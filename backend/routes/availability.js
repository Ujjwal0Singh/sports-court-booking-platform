const express = require('express');
const router = express.Router();
const { Court, Coach, Equipment, Booking, BookingEquipment, sequelize } = require('../models');
const moment = require('moment');

// Geting available slots for a specific date
router.get('/slots/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { court_type, coach_id } = req.query;
    
    const targetDate = moment(date).startOf('day');
    
    if (!targetDate.isValid()) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Get all courts (filter by type if specified)
    const whereClause = { is_active: true };
    if (court_type) {
      whereClause.type = court_type;
    }
    
    const courts = await Court.findAll({ where: whereClause });
    
    // Generating time slots (9 AM to 10 PM, 1-hour slots)
    const slots = [];
    const startHour = 9;
    const endHour = 22;
    
    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = targetDate.clone().set({ hour, minute: 0, second: 0 }).toDate();
      const endTime = targetDate.clone().set({ hour: hour + 1, minute: 0, second: 0 }).toDate();
      
      slots.push({
        start_time: startTime,
        end_time: endTime,
        hour: hour,
        formatted_time: `${hour}:00 - ${hour + 1}:00`
      });
    }

    // For each court, checking availability for each slot
    const courtAvailability = await Promise.all(
      courts.map(async (court) => {
        const availability = await Promise.all(
          slots.map(async (slot) => {
            // Checking if court is booked for this slot
            const existingBooking = await Booking.findOne({
              where: {
                court_id: court.id,
                start_time: { [sequelize.Op.lt]: slot.end_time },
                end_time: { [sequelize.Op.gt]: slot.start_time },
                status: 'confirmed'
              }
            });

            const isCourtAvailable = !existingBooking;

            // Checking coach availability if coach_id is specified
            let isCoachAvailable = true;
            if (coach_id) {
              const coachBooking = await Booking.findOne({
                where: {
                  coach_id,
                  start_time: { [sequelize.Op.lt]: slot.end_time },
                  end_time: { [sequelize.Op.gt]: slot.start_time },
                  status: 'confirmed'
                }
              });
              isCoachAvailable = !coachBooking;
            }

            return {
              ...slot,
              is_available: isCourtAvailable && isCoachAvailable,
              court_id: court.id,
              court_name: court.name
            };
          })
        );

        return {
          court_id: court.id,
          court_name: court.name,
          court_type: court.type,
          slots: availability
        };
      })
    );

    res.json({
      date: targetDate.format('YYYY-MM-DD'),
      court_availability: courtAvailability
    });
  } catch (error) {
    console.error('Availability fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// Getting available equipment for a time slot
router.get('/equipment/:start_time/:end_time', async (req, res) => {
  try {
    const { start_time, end_time } = req.params;
    
    const startTime = new Date(start_time);
    const endTime = new Date(end_time);
    
    const allEquipment = await Equipment.findAll();
    
    const equipmentAvailability = await Promise.all(
      allEquipment.map(async (equipment) => {
        // Counting how many of this equipment are booked for the overlapping slot
        const bookedQuantity = await BookingEquipment.sum('quantity', {
          include: [{
            model: Booking,
            where: {
              start_time: { [sequelize.Op.lt]: endTime },
              end_time: { [sequelize.Op.gt]: startTime },
              status: 'confirmed'
            }
          }],
          where: { equipment_id: equipment.id }
        }) || 0;

        const availableQuantity = equipment.available_quantity - bookedQuantity;

        return {
          id: equipment.id,
          name: equipment.name,
          type: equipment.type,
          price_per_session: equipment.price_per_session,
          total_quantity: equipment.total_quantity,
          booked_quantity: bookedQuantity,
          available_quantity: Math.max(0, availableQuantity)
        };
      })
    );

    res.json({
      start_time: startTime,
      end_time: endTime,
      equipment: equipmentAvailability
    });
  } catch (error) {
    console.error('Equipment availability error:', error);
    res.status(500).json({ error: 'Failed to fetch equipment availability' });
  }
});

// Geting coach availability
router.get('/coaches/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = moment(date);
    const dayOfWeek = targetDate.day(); // 0 = Sunday, 6 = Saturday

    const coaches = await Coach.findAll({
      where: { is_active: true },
      include: [{
        model: sequelize.models.CoachAvailability,
        where: {
          day_of_week: dayOfWeek
        },
        required: false
      }]
    });

    const coachAvailability = coaches.map(coach => ({
      id: coach.id,
      name: coach.name,
      specialization: coach.specialization,
      hourly_rate: coach.hourly_rate,
      is_available_today: coach.CoachAvailabilities && coach.CoachAvailabilities.length > 0,
      availability: coach.CoachAvailabilities?.map(avail => ({
        start_time: avail.start_time,
        end_time: avail.end_time
      })) || []
    }));

    res.json({
      date: targetDate.format('YYYY-MM-DD'),
      day_of_week: dayOfWeek,
      coaches: coachAvailability
    });
  } catch (error) {
    console.error('Coach availability error:', error);
    res.status(500).json({ error: 'Failed to fetch coach availability' });
  }
});

module.exports = router;