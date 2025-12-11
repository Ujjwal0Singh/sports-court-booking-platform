const express = require('express');
const router = express.Router();
const { Court, Booking, sequelize } = require('../models');

// Get all courts
router.get('/', async (req, res) => {
  try {
    const courts = await Court.findAll({ where: { is_active: true } });
    res.json(courts);
  } catch (error) {
    console.error('Courts fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch courts' });
  }
});

// Get available slots for a date
router.get('/:court_id/slots/:date', async (req, res) => {
  try {
    const { court_id, date } = req.params;
    const targetDate = new Date(date);
    
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Generate time slots (9 AM to 10 PM, 1-hour slots)
    const slots = [];
    const startHour = 9;
    const endHour = 22;
    
    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = new Date(targetDate);
      startTime.setHours(hour, 0, 0, 0);
      
      const endTime = new Date(targetDate);
      endTime.setHours(hour + 1, 0, 0, 0);
      
      // Check if slot is booked
      const existingBooking = await Booking.findOne({
        where: {
          court_id,
          start_time: { [sequelize.Op.lt]: endTime },
          end_time: { [sequelize.Op.gt]: startTime },
          status: 'confirmed'
        }
      });
      
      slots.push({
        start_time: startTime,
        end_time: endTime,
        is_available: !existingBooking
      });
    }
    
    res.json({
      court_id,
      date: targetDate.toISOString().split('T')[0],
      slots
    });
  } catch (error) {
    console.error('Slots error:', error);
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
});

// Get court details
router.get('/:id', async (req, res) => {
  try {
    const court = await Court.findByPk(req.params.id);
    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }
    res.json(court);
  } catch (error) {
    console.error('Court details error:', error);
    res.status(500).json({ error: 'Failed to fetch court details' });
  }
});

module.exports = router;