const axios = require('axios');
require('dotenv').config();

const getMpesaToken = async () => {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    try {
        const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
            headers: {
                Authorization: `Basic ${auth}`,
            },
        });
        return response.data.access_token;
    } catch (error) {
        console.error('M-Pesa Token Error:', error.response ? error.response.data : error.message);
        throw new Error('Failed to generate M-Pesa token');
    }
};

const triggerStkPush = async (phone, amount, bookingId) => {
    // Standardize phone format to 254XXXXXXXXX
    const formattedPhone = phone.replace('+', '');
    
    try {
        const token = await getMpesaToken();
        const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
        const shortcode = process.env.MPESA_SHORTCODE;
        const passkey = process.env.MPESA_PASSKEY;
        const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

        const payload = {
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.ceil(amount),
            PartyA: formattedPhone,
            PartyB: shortcode,
            PhoneNumber: formattedPhone,
            CallBackURL: `${process.env.APP_URL}/api/bookings/mpesa-callback`,
            AccountReference: `NyxGlam-${bookingId}`,
            TransactionDesc: 'Service Booking Payment',
        };

        const response = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', payload, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return response.data;
    } catch (error) {
        console.error('M-Pesa STK Push Error:', error.response ? error.response.data : error.message);
        // For development/demo, we'll return a mock success if credentials are missing
        if (!process.env.MPESA_CONSUMER_KEY) {
            console.log('--- MOCK MPESA TRIGGERED ---');
            return { ResponseCode: "0", CustomerMessage: "Mock Success" };
        }
        throw new Error('Failed to trigger STK Push');
    }
};

module.exports = { triggerStkPush };
