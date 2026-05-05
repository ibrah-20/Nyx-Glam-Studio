const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/servicesController');

router.get('/', servicesController.getAllServices);
router.post('/', servicesController.createService); // Admin route
router.put('/:id', servicesController.updateService); // Admin route
router.delete('/:id', servicesController.deleteService); // Admin route

module.exports = router;
