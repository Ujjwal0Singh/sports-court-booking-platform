const { sequelize, Booking, Court, Coach, Equipment, BookingEquipment, Waitlist } = require('../models');
const { calculatePrice } = require('./pricingController');
const moment = require('moment');

class BookingController {
  // Checking availability for a slot
  static async checkAvailability(req, res) {
    try {
      const { court_id, start_time, end_time, coach_id, equipment_items } = req.body;
      
      // Basic validation
      if (!court_id || !start_time || !end_time) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const startTime = new Date(start_time);
      const endTime = new Date(end_time);
      
      // Checking court availability
      const conflictingCourtBooking = await Booking.findOne({
        where: {
          court_id,
          start_time: { [sequelize.Op.lt]: endTime },
          end_time: { [sequelize.Op.gt]: startTime },
          status: 'confirmed'
        }
      });

      if (conflictingCourtBooking) {
        return res.json({
          available: false,
          reason: 'Court already booked for this slot'
        });
      }

      // Checking coach availability if requested
      if (coach_id) {
        const conflictingCoachBooking = await Booking.findOne({
          where: {
            coach_id,
            start_time: { [sequelize.Op.lt]: endTime },
            end_time: { [sequelize.Op.gt]: startTime },
            status: 'confirmed'
          }
        });

        if (conflictingCoachBooking) {
          return res.json({
            available: false,
            reason: 'Coach already booked for this slot'
          });
        }
      }

      // Checking equipment availability
      if (equipment_items && equipment_items.length > 0) {
        for (const item of equipment_items) {
          const equipment = await Equipment.findByPk(item.equipment_id);
          
          // Counting how many of this equipment are already booked for overlapping slots
          const totalBooked = await BookingEquipment.sum('quantity', {
            include: [{
              model: Booking,
              where: {
                start_time: { [sequelize.Op.lt]: endTime },
                end_time: { [sequelize.Op.gt]: startTime },
                status: 'confirmed'
              }
            }],
            where: { equipment_id: item.equipment_id }
          }) || 0;

          const requestedQuantity = item.quantity || 1;
          const availableQuantity = equipment.available_quantity - totalBooked;
          
          if (availableQuantity < requestedQuantity) {
            return res.json({
              available: false,
              reason: `Not enough ${equipment.name} available`
            });
          }
        }
      }

      return res.json({
        available: true,
        message: 'Slot is available'
      });
    } catch (error) {
      console.error('Availability check error:', error);
      res.status(500).json({ error: 'Failed to check availability' });
    }
  }

  // Creating a booking
  static async createBooking(req, res) {
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

      // Validate inputs
      if (!user_id || !user_name || !user_email || !court_id || !start_time || !end_time) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const startTime = new Date(start_time);
      const endTime = new Date(end_time);
      const durationHours = (endTime - startTime) / (1000 * 60 * 60);

      if (durationHours <= 0) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Invalid time slot' });
      }

      // Checking availability again within transaction
      const availability = await this.checkAvailabilityInTransaction({
        court_id,
        start_time: startTime,
        end_time: endTime,
        coach_id,
        equipment_items
      }, transaction);

      if (!availability.available) {
        await transaction.rollback();
        return res.status(409).json({ 
          error: 'Slot no longer available',
          details: availability.reason 
        });
      }

      // Calculating price
      const priceDetails = await calculatePrice({
        court_id,
        start_time: startTime,
        end_time: endTime,
        coach_id,
        equipment_items
      });

      // Creating booking
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

      // Adding equipment items
      if (equipment_items.length > 0) {
        const bookingEquipmentPromises = equipment_items.map(item =>
          BookingEquipment.create({
            booking_id: booking.id,
            equipment_id: item.equipment_id,
            quantity: item.quantity || 1
          }, { transaction })
        );
        await Promise.all(bookingEquipmentPromises);

        // Updating equipment availability
        for (const item of equipment_items) {
          await Equipment.decrement('available_quantity', {
            by: item.quantity || 1,
            where: { id: item.equipment_id },
            transaction
          });
        }
      }

      await transaction.commit();

      // Checking waitlist for this slot
      await this.checkWaitlist({
        court_id,
        start_time: startTime,
        end_time: endTime,
        coach_id
      });

      res.status(201).json({
        message: 'Booking created successfully',
        booking: {
          id: booking.id,
          booking_reference: `BK${String(booking.id).padStart(6, '0')}`,
          total_price: booking.total_price,
          start_time: booking.start_time,
          end_time: booking.end_time
        }
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Booking creation error:', error);
      res.status(500).json({ error: 'Failed to create booking' });
    }
  }

  // Helper method to checking availability within transaction
  static async checkAvailabilityInTransaction(data, transaction) {
    const { court_id, start_time, end_time, coach_id, equipment_items } = data;

    // Checking court
    const courtConflict = await Booking.findOne({
      where: {
        court_id,
        start_time: { [sequelize.Op.lt]: end_time },
        end_time: { [sequelize.Op.gt]: start_time },
        status: 'confirmed'
      },
      transaction
    });

    if (courtConflict) {
      return { available: false, reason: 'Court already booked' };
    }

    // Checking coach
    if (coach_id) {
      const coachConflict = await Booking.findOne({
        where: {
          coach_id,
          start_time: { [sequelize.Op.lt]: end_time },
          end_time: { [sequelize.Op.gt]: start_time },
          status: 'confirmed'
        },
        transaction
      });

      if (coachConflict) {
        return { available: false, reason: 'Coach already booked' };
      }
    }

    // Checking equipment
    if (equipment_items && equipment_items.length > 0) {
      for (const item of equipment_items) {
        const equipment = await Equipment.findByPk(item.equipment_id, { transaction });
        
        const totalBooked = await BookingEquipment.sum('quantity', {
          include: [{
            model: Booking,
            where: {
              start_time: { [sequelize.Op.lt]: end_time },
              end_time: { [sequelize.Op.gt]: start_time },
              status: 'confirmed'
            }
          }],
          where: { equipment_id: item.equipment_id },
          transaction
        }) || 0;

        const requestedQuantity = item.quantity || 1;
        const availableQuantity = equipment.available_quantity - totalBooked;
        
        if (availableQuantity < requestedQuantity) {
          return { 
            available: false, 
            reason: `Only ${availableQuantity} ${equipment.name}(s) available` 
          };
        }
      }
    }

    return { available: true };
  }


  // Get user bookings
  static async getBookingsByUser(req, res) {
    try {
      const { user_id } = req.params;
      
      const bookings = await Booking.findAll({
        where: { user_id },
        include: [
          { 
            model: Court, 
            attributes: ['id', 'name', 'type', 'base_price'],
            required: true 
          },
          { 
            model: Coach, 
            attributes: ['id', 'name', 'specialization', 'hourly_rate'],
            required: false 
          },
          { 
            model: BookingEquipment,
            include: [{ 
              model: Equipment, 
              attributes: ['id', 'name', 'type', 'price_per_session'] 
            }],
            required: false
          }
        ],
        order: [['start_time', 'DESC']]
      });

      // Format the response
      const formattedBookings = bookings.map(booking => {
        const bookingObj = booking.toJSON();
        return {
          id: bookingObj.id,
          booking_reference: `BK${String(bookingObj.id).padStart(6, '0')}`,
          user_id: bookingObj.user_id,
          user_name: bookingObj.user_name,
          user_email: bookingObj.user_email,
          court: {
            id: bookingObj.Court.id,
            name: bookingObj.Court.name,
            type: bookingObj.Court.type,
            base_price: bookingObj.Court.base_price
          },
          coach: bookingObj.Coach ? {
            id: bookingObj.Coach.id,
            name: bookingObj.Coach.name,
            specialization: bookingObj.Coach.specialization,
            hourly_rate: bookingObj.Coach.hourly_rate
          } : null,
          start_time: bookingObj.start_time,
          end_time: bookingObj.end_time,
          duration_hours: bookingObj.duration_hours,
          court_price: bookingObj.court_price,
          equipment_price: bookingObj.equipment_price,
          coach_price: bookingObj.coach_price,
          total_price: bookingObj.total_price,
          status: bookingObj.status,
          payment_status: bookingObj.payment_status,
          created_at: bookingObj.createdAt,
          updated_at: bookingObj.updatedAt,
          equipment_items: bookingObj.BookingEquipment ? bookingObj.BookingEquipment.map(item => ({
            id: item.Equipment.id,
            name: item.Equipment.name,
            type: item.Equipment.type,
            price_per_session: item.Equipment.price_per_session,
            quantity: item.quantity
          })) : []
        };
      });

      res.json(formattedBookings);
    } catch (error) {
      console.error('Get user bookings error:', error);
      res.status(500).json({ error: 'Failed to fetch user bookings' });
    }
  }

  // Checking waitlist when a slot becomes available
  static async checkWaitlist(bookingData) {
    try {
      const { court_id, start_time, end_time, coach_id } = bookingData;
      
      // Finding first person in waitlist for this slot
      const waitlistEntry = await Waitlist.findOne({
        where: {
          court_id,
          start_time,
          end_time,
          coach_id: coach_id || null,
          status: 'active'
        },
        order: [['position', 'ASC']]
      });

      if (waitlistEntry) {
        // Marking as notified
        await waitlistEntry.update({
          status: 'notified',
          notified_at: new Date()
        });

        // Here you would typically:
        // 1. Send email notification
        // 2. Reserve slot for a limited time
        // 3. Update frontend via WebSocket
        console.log(`Notified ${waitlistEntry.user_name} for waitlisted slot`);
      }
    } catch (error) {
      console.error('Waitlist check error:', error);
    }
  }

  // Geting user bookings
  static async getUserBookings(req, res) {
    try {
      const { user_id } = req.params;
      
      const bookings = await Booking.findAll({
        where: { user_id },
        include: [
          { model: Court, attributes: ['name', 'type'] },
          { model: Coach, attributes: ['name', 'specialization'] },
          { 
            model: BookingEquipment,
            include: [{ model: Equipment, attributes: ['name', 'type'] }]
          }
        ],
        order: [['start_time', 'DESC']]
      });

      res.json(bookings);
    } catch (error) {
      console.error('Get bookings error:', error);
      res.status(500).json({ error: 'Failed to fetch bookings' });
    }
  }

  // Cancel booking
  static async cancelBooking(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const { booking_id } = req.params;
      
      const booking = await Booking.findByPk(booking_id, { 
        include: [BookingEquipment],
        transaction 
      });

      if (!booking) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Booking not found' });
      }

      if (booking.status === 'cancelled') {
        await transaction.rollback();
        return res.status(400).json({ error: 'Booking already cancelled' });
      }

      // Updating booking status
      await booking.update({ 
        status: 'cancelled',
        payment_status: 'refunded'
      }, { transaction });

      // Returning equipment to inventory
      for (const equipmentItem of booking.BookingEquipment) {
        await Equipment.increment('available_quantity', {
          by: equipmentItem.quantity,
          where: { id: equipmentItem.equipment_id },
          transaction
        });
      }

      await transaction.commit();

      // Checking waitlist for the now-available slot
      await this.checkWaitlist({
        court_id: booking.court_id,
        start_time: booking.start_time,
        end_time: booking.end_time,
        coach_id: booking.coach_id
      });

      res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
      await transaction.rollback();
      console.error('Cancel booking error:', error);
      res.status(500).json({ error: 'Failed to cancel booking' });
    }
  }

  // Adding to waitlist
  static async addToWaitlist(req, res) {
    try {
      const {
        user_id,
        user_name,
        user_email,
        court_id,
        start_time,
        end_time,
        coach_id
      } = req.body;

      // Checking if slot is actually booked
      const existingBooking = await Booking.findOne({
        where: {
          court_id,
          start_time: new Date(start_time),
          end_time: new Date(end_time),
          status: 'confirmed'
        }
      });

      if (!existingBooking) {
        return res.status(400).json({ 
          error: 'Slot is not booked, you can book directly' 
        });
      }

      // Checking if already in waitlist
      const existingWaitlist = await Waitlist.findOne({
        where: {
          user_id,
          court_id,
          start_time: new Date(start_time),
          end_time: new Date(end_time)
        }
      });

      if (existingWaitlist) {
        return res.status(400).json({ 
          error: 'Already on waitlist for this slot' 
        });
      }

      // Geting current waitlist position
      const waitlistCount = await Waitlist.count({
        where: {
          court_id,
          start_time: new Date(start_time),
          end_time: new Date(end_time),
          status: 'active'
        }
      });

      const waitlistEntry = await Waitlist.create({
        user_id,
        user_name,
        user_email,
        court_id,
        coach_id,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        position: waitlistCount + 1,
        status: 'active'
      });

      res.status(201).json({
        message: 'Added to waitlist',
        waitlist: {
          id: waitlistEntry.id,
          position: waitlistEntry.position
        }
      });
    } catch (error) {
      console.error('Waitlist error:', error);
      res.status(500).json({ error: 'Failed to add to waitlist' });
    }
  }
}

module.exports = BookingController;