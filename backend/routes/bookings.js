const express = require('express');
const router = express.Router();
const BookingController = require('../controllers/bookingController');
const PricingController = require('../controllers/pricingController');


// Get user bookings
router.get('/user/:user_id', BookingController.getBookingsByUser);

// Check availability
router.post('/availability', (req, res) => {
  // Simplified availability check - always return available for now
  res.json({
    available: true,
    message: 'Slot is available'
  });
});

// Create booking
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      user_name,
      user_email,
      court_id,
      start_time,
      end_time,
      coach_id,
      equipment_items = []
    } = req.body;

    console.log('Creating booking for:', { user_name, user_email, court_id });

    // Calculate price
    const priceDetails = await PricingController.calculatePrice({
      court_id,
      start_time,
      end_time,
      coach_id,
      equipment_items
    });

    // Generate booking reference
    const bookingReference = `BK${Date.now().toString().slice(-6)}`;

    res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        id: Date.now(),
        booking_reference: bookingReference,
        total_price: priceDetails.total_price,
        start_time: start_time,
        end_time: end_time
      }
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({ error: 'Failed to create booking', details: error.message });
  }
});

// Get user bookings
router.get('/user/:user_id', (req, res) => {
  res.json([]); // Return empty array for now
});

// Cancel booking
router.put('/:booking_id/cancel', (req, res) => {
  res.json({ message: 'Booking cancelled successfully' });
});

// Add to waitlist
router.post('/waitlist', (req, res) => {
  res.status(201).json({
    message: 'Added to waitlist',
    waitlist: {
      id: Date.now(),
      position: 1
    }
  });
});

// Get price simulation
router.post('/price/simulate', async (req, res) => {
  try {
    const priceDetails = await PricingController.calculatePrice(req.body);
    res.json(priceDetails);
  } catch (error) {
    console.error('Price simulation error:', error);
    res.status(500).json({ error: 'Failed to simulate price' });
  }
});

// Create booking
router.post('/', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      user_id,
      user_name,
      user_email,
      court_id,
      start_time,
      end_time,
      coach_id,
      equipment_items = []
    } = req.body;

    console.log('Creating booking for:', { 
      user_id, 
      user_name, 
      court_id, 
      start_time, 
      end_time 
    });

    // Validate required fields
    if (!user_id || !user_name || !user_email || !court_id || !start_time || !end_time) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['user_id', 'user_name', 'user_email', 'court_id', 'start_time', 'end_time']
      });
    }

    const startTime = new Date(start_time);
    const endTime = new Date(end_time);
    const durationHours = (endTime - startTime) / (1000 * 60 * 60);

    // Check if court exists
    const court = await Court.findByPk(court_id, { transaction });
    if (!court) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Court not found' });
    }

    // Check if coach exists if provided
    if (coach_id) {
      const coach = await Coach.findByPk(coach_id, { transaction });
      if (!coach) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Coach not found' });
      }
    }

    // Calculate price
    const priceDetails = await PricingController.calculatePrice({
      court_id,
      start_time: startTime,
      end_time: endTime,
      coach_id,
      equipment_items
    });

    // Create booking
    const booking = await Booking.create({
      user_id,
      user_name,
      user_email,
      court_id,
      coach_id,
      start_time: startTime,
      end_time: endTime,
      duration_hours: durationHours,
      court_price: priceDetails.court_price,
      equipment_price: priceDetails.equipment_total,
      coach_price: priceDetails.coach_price || 0,
      total_price: priceDetails.total_price,
      status: 'confirmed',
      payment_status: 'pending'
    }, { transaction });

    // Add equipment items
    if (equipment_items.length > 0) {
      for (const item of equipment_items) {
        const equipment = await Equipment.findByPk(item.equipment_id, { transaction });
        if (!equipment) {
          await transaction.rollback();
          return res.status(404).json({ error: `Equipment ${item.equipment_id} not found` });
        }

        await BookingEquipment.create({
          booking_id: booking.id,
          equipment_id: item.equipment_id,
          quantity: item.quantity || 1
        }, { transaction });
      }
    }

    await transaction.commit();

    // Return success response
    res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        id: booking.id,
        booking_reference: `BK${String(booking.id).padStart(6, '0')}`,
        total_price: booking.total_price,
        start_time: booking.start_time,
        end_time: booking.end_time,
        user_id: booking.user_id
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Booking creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create booking',
      details: error.message 
    });
  }
});

module.exports = router;