const express = require('express');
const router = express.Router();
const bookingsController = require('../controllers/bookingsController');

router.get('/', bookingsController.getBookings);
router.post('/', bookingsController.createBooking);
router.patch('/:id', bookingsController.updateBooking); // Admin route
router.get('/availability', bookingsController.getAvailability);

module.exports = router;
