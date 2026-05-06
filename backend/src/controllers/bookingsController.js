const db = require('../config/db');
const { generateTimeSlots, addMinutesToTime, checkOverlap } = require('../utils/timeSlots');
const { sendBookingEmail } = require('../config/mailer');
const { triggerStkPush } = require('../utils/mpesa');

const getBookings = async (req, res) => {
  const { date } = req.query;
  try {
    let query = `
      SELECT b.*, s.name as service_name, s.duration_minutes 
      FROM bookings b 
      LEFT JOIN services s ON b.service_id = s.id
    `;
    let values = [];

    if (date) {
      query += ` WHERE b.booking_date = $1 ORDER BY b.start_time ASC`;
      values.push(date);
    } else {
      query += ` ORDER BY b.booking_date ASC, b.start_time ASC`;
    }

    const { rows } = await db.query(query, values);
    
    // Convert dates to YYYY-MM-DD string for JSON consistency
    const result = rows.map(r => ({
      ...r,
      booking_date: r.booking_date.toISOString().split('T')[0]
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

// GET /api/availability?date=YYYY-MM-DD
const getAvailability = async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Date is required (YYYY-MM-DD)' });
  
  const reqDate = new Date(date);
  const today = new Date();
  today.setHours(0,0,0,0);
  if (reqDate < today) {
    return res.status(400).json({ error: 'Cannot fetch availability for past dates' });
  }

  try {
    const { rows: existingBookings } = await db.query(
      `SELECT start_time, end_time FROM bookings WHERE booking_date = $1 AND status != 'cancelled'`,
      [date]
    );

    const allSlots = generateTimeSlots(9, 20, 30);
    
    const availability = allSlots.map(slotTime => {
      const slotEnd = addMinutesToTime(slotTime, 30); 
      const isBooked = existingBookings.some(booking => {
        return checkOverlap(slotTime, slotEnd, booking.start_time, booking.end_time);
      });
      return { time: slotTime, available: !isBooked };
    });

    res.json({ date, slots: availability });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
};

// POST /api/bookings
const createBooking = async (req, res) => {
  const { customer_name, phone, service_id, booking_date, start_time, email, location, payment_method } = req.body;
  
  // 1. Validate required fields
  if (!customer_name || !phone || !service_id || !booking_date || !start_time || !location || !payment_method) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // 2. Validate Location
  const allowedLocations = [
    'Narok County - Maasai Mara University Gate C',
    'Chuka University - Tharaka Nithi County'
  ];
  if (!allowedLocations.includes(location)) {
    return res.status(400).json({ error: 'Invalid location. Please select either Narok or Chuka branch.' });
  }

  // 3. Validate Payment Method
  const allowedPayments = ['cash', 'mpesa', 'crypto'];
  if (!allowedPayments.includes(payment_method)) {
    return res.status(400).json({ error: 'Invalid payment method.' });
  }

  // 4. Validate Phone Number (Kenya Format: +254XXXXXXXXX)
  if (!/^\+254\d{9}$/.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone number format. Must start with +254 and be 13 characters long.' });
  }

  try {
    // 5. Fetch Service Duration & Price
    const serviceRes = await db.query('SELECT name, duration_minutes, price FROM services WHERE id = $1', [service_id]);
    if (serviceRes.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    const service = serviceRes.rows[0];
    const duration = service.duration_minutes || 0;
    const price = service.price || 0;
    
    const end_time = duration > 0 ? addMinutesToTime(start_time, duration) : addMinutesToTime(start_time, 15);
    
    // 6. Check for Overlap / Duplicates
    const overlapCheck = await db.query(`
      SELECT id FROM bookings 
      WHERE booking_date = $1 
        AND location = $4
        AND status != 'cancelled'
        AND (
          ($2 >= start_time AND $2 < end_time) OR 
          ($3 > start_time AND $3 <= end_time) OR
          ($2 <= start_time AND $3 >= end_time)
        )
    `, [booking_date, start_time, end_time, location]);
    
    if (overlapCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Time slot is no longer available or overlaps with another booking at this location.' });
    }

    // 7. Insert Booking
    const payment_status = (payment_method === 'cash') ? 'pending' : 'pending'; // All start as pending
    const insertRes = await db.query(`
      INSERT INTO bookings (customer_name, phone, service_id, booking_date, start_time, end_time, status, location, payment_method, payment_status)
      VALUES ($1, $2, $3, $4, $5, $6, 'confirmed', $7, $8, $9)
      RETURNING *
    `, [customer_name, phone, service_id, booking_date, start_time, end_time, location, payment_method, payment_status]);

    const newBooking = insertRes.rows[0];
    newBooking.booking_date = newBooking.booking_date.toISOString().split('T')[0];

    // 8. Handle M-Pesa STK Push
    if (payment_method === 'mpesa') {
        try {
            const mpesaRes = await triggerStkPush(phone, price, newBooking.id);
            if (mpesaRes.ResponseCode === "0") {
                await db.query('UPDATE bookings SET transaction_id = $1 WHERE id = $2', [mpesaRes.CheckoutRequestID, newBooking.id]);
            }
        } catch (mpesaError) {
            console.error('M-Pesa Trigger Failed:', mpesaError);
            // We still keep the booking but maybe log the error
        }
    }

    if (email) {
      sendBookingEmail(email, {
        customer_name: newBooking.customer_name,
        service_name: service.name,
        booking_date: newBooking.booking_date,
        start_time: newBooking.start_time,
        end_time: newBooking.end_time,
        status: newBooking.status,
        location: newBooking.location,
        payment_method: newBooking.payment_method,
        payment_status: newBooking.payment_status
      });
    }

    res.status(201).json({ message: 'Booking created successfully', booking: newBooking });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

// PATCH /api/bookings/:id
const updateBooking = async (req, res) => {
  const { id } = req.params;
  const { status, location, payment_status, transaction_id } = req.body;
  
  if (!status && !location && !payment_status && !transaction_id) {
    return res.status(400).json({ error: 'No fields provided for update' });
  }

  let updateFields = [];
  let values = [];
  let idx = 1;

  if (status) {
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    updateFields.push(`status = $${idx++}`);
    values.push(status);
  }

  if (location) {
    const allowedLocations = [
      'Narok County - Maasai Mara University Gate C',
      'Chuka University - Tharaka Nithi County'
    ];
    if (!allowedLocations.includes(location)) {
      return res.status(400).json({ error: 'Invalid location' });
    }
    updateFields.push(`location = $${idx++}`);
    values.push(location);
  }

  if (payment_status) {
    if (!['pending', 'paid', 'failed'].includes(payment_status)) {
        return res.status(400).json({ error: 'Invalid payment status' });
    }
    updateFields.push(`payment_status = $${idx++}`);
    values.push(payment_status);
  }

  if (transaction_id) {
    updateFields.push(`transaction_id = $${idx++}`);
    values.push(transaction_id);
  }

  values.push(id);
  const query = `UPDATE bookings SET ${updateFields.join(', ')} WHERE id = $${idx} RETURNING *`;

  try {
    const updateRes = await db.query(query, values);
    
    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const updated = updateRes.rows[0];
    updated.booking_date = updated.booking_date.toISOString().split('T')[0];
    res.json(updated);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
};

// POST /api/bookings/mpesa-callback
const mpesaCallback = async (req, res) => {
    const { Body } = req.body;
    
    if (!Body || !Body.stkCallback) {
        return res.status(400).json({ error: 'Invalid callback data' });
    }

    const { ResultCode, CheckoutRequestID, ResultDesc } = Body.stkCallback;

    try {
        if (ResultCode === 0) {
            // Success
            await db.query(
                'UPDATE bookings SET payment_status = $1 WHERE transaction_id = $2',
                ['paid', CheckoutRequestID]
            );
            console.log(`Payment Success: ${CheckoutRequestID}`);
        } else {
            // Failed
            await db.query(
                'UPDATE bookings SET payment_status = $1 WHERE transaction_id = $2',
                ['failed', CheckoutRequestID]
            );
            console.log(`Payment Failed: ${CheckoutRequestID} - ${ResultDesc}`);
        }
        res.status(200).json({ message: 'Callback processed' });
    } catch (error) {
        console.error('M-Pesa Callback Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
  getBookings,
  getAvailability,
  createBooking,
  updateBooking,
  mpesaCallback
};
