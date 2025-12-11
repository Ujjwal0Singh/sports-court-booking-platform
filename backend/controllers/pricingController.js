const { Court, Coach, Equipment, PricingRule } = require('../models');
const moment = require('moment');

class PricingController {
  static async calculatePrice(data) {
    try {
      const { court_id, start_time, end_time, coach_id, equipment_items = [] } = data;
      
      console.log('Calculating price for:', { court_id, start_time, end_time, coach_id, equipment_items });

      const startTime = new Date(start_time);
      const endTime = new Date(end_time);
      const durationHours = (endTime - startTime) / (1000 * 60 * 60);

      // Get base prices
      const court = await Court.findByPk(court_id);
      if (!court) {
        throw new Error('Court not found');
      }

      const coach = coach_id ? await Coach.findByPk(coach_id) : null;

      // Start with base court price
      let courtPrice = court.base_price * durationHours;

      // Apply basic pricing rules
      const dayOfWeek = startTime.getDay();
      const hour = startTime.getHours();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isPeakHour = hour >= 18 && hour < 21;

      if (court.type === 'indoor') {
        courtPrice *= 1.2; // 20% premium for indoor
      }
      if (isPeakHour) {
        courtPrice *= 1.5; // 50% premium for peak hours
      }
      if (isWeekend) {
        courtPrice *= 1.3; // 30% premium for weekends
      }

      // Calculate coach price
      let coachPrice = 0;
      if (coach) {
        coachPrice = coach.hourly_rate * durationHours;
      }

      // Calculate equipment price
      let equipmentTotal = 0;
      if (equipment_items.length > 0) {
        for (const item of equipment_items) {
          const equipment = await Equipment.findByPk(item.equipment_id);
          if (equipment) {
            const quantity = item.quantity || 1;
            equipmentTotal += equipment.price_per_session * quantity;
          }
        }
      }

      // Calculate total
      const totalPrice = courtPrice + coachPrice + equipmentTotal;

      return {
        court_price: parseFloat(courtPrice.toFixed(2)),
        coach_price: parseFloat(coachPrice.toFixed(2)),
        equipment_total: parseFloat(equipmentTotal.toFixed(2)),
        total_price: parseFloat(totalPrice.toFixed(2)),
        breakdown: {
          court: courtPrice,
          coach: coachPrice,
          equipment: equipmentTotal,
          duration_hours: durationHours
        }
      };
    } catch (error) {
      console.error('Price calculation error:', error);
      throw new Error('Failed to calculate price: ' + error.message);
    }
  }

  static async getPriceBreakdown(data) {
    const priceDetails = await this.calculatePrice(data);
    
    return {
      ...priceDetails,
      applied_rules: []
    };
  }

  static async simulatePrice(req, res) {
    try {
      const priceDetails = await this.calculatePrice(req.body);
      res.json(priceDetails);
    } catch (error) {
      console.error('Price simulation error:', error);
      res.status(500).json({ error: 'Failed to simulate price' });
    }
  }
}

module.exports = PricingController;