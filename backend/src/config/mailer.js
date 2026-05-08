const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendBookingEmail = async (customerEmail, bookingDetails) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || '"Nyx Glam Studio" <nyxglamstudios@gmail.com>',
      to: customerEmail, // in a real scenario this comes from the booking, here we mock it or pass it
      subject: 'Booking Confirmation - Nyx Glam Studio',
      text: `Hello ${bookingDetails.customer_name},\n\nYour booking for ${bookingDetails.service_name} on ${bookingDetails.booking_date} at ${bookingDetails.start_time} has been received.`,
      html: `
        <h3>Hello ${bookingDetails.customer_name},</h3>
        <p>Your booking has been received and is currently <b>${bookingDetails.status}</b>.</p>
        <ul>
          <li><strong>Service:</strong> ${bookingDetails.service_name}</li>
          <li><strong>Date:</strong> ${bookingDetails.booking_date}</li>
          <li><strong>Time:</strong> ${bookingDetails.start_time} - ${bookingDetails.end_time}</li>
        </ul>
        <p>Thank you for choosing Nyx Glam Studio!</p>
      `,
    });
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = { sendBookingEmail };
