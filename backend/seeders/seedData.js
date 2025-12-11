const { 
  Court, 
  Equipment, 
  Coach, 
  CoachAvailability, 
  PricingRule,
  sequelize 
} = require('../models');

const seedDatabase = async () => {
  try {
    // Clearing existing data
    await sequelize.sync({ force: true });
    console.log('Database cleared');

    // Creating courts
    const courts = await Court.bulkCreate([
      {
        name: 'Indoor Court 1',
        type: 'indoor',
        base_price: 15.00,
        description: 'Premium indoor court with AC'
      },
      {
        name: 'Indoor Court 2',
        type: 'indoor',
        base_price: 15.00,
        description: 'Premium indoor court with AC'
      },
      {
        name: 'Outdoor Court 1',
        type: 'outdoor',
        base_price: 10.00,
        description: 'Outdoor court with floodlights'
      },
      {
        name: 'Outdoor Court 2',
        type: 'outdoor',
        base_price: 10.00,
        description: 'Outdoor court with floodlights'
      }
    ]);
    console.log('Courts created');

    // Creating equipment
    const equipment = await Equipment.bulkCreate([
      {
        name: 'Professional Racket',
        type: 'racket',
        price_per_session: 8.00,
        total_quantity: 20,
        available_quantity: 20
      },
      {
        name: 'Beginner Racket',
        type: 'racket',
        price_per_session: 5.00,
        total_quantity: 15,
        available_quantity: 15
      },
      {
        name: 'Badminton Shoes',
        type: 'shoes',
        price_per_session: 6.00,
        total_quantity: 25,
        available_quantity: 25
      },
      {
        name: 'Shuttlecocks (tube of 6)',
        type: 'other',
        price_per_session: 12.00,
        total_quantity: 50,
        available_quantity: 50
      }
    ]);
    console.log('Equipment created');

    // Creating coaches
    const coaches = await Coach.bulkCreate([
      {
        name: 'John Smith',
        specialization: 'Advanced Training',
        hourly_rate: 30.00
      },
      {
        name: 'Sarah Johnson',
        specialization: 'Beginner Coaching',
        hourly_rate: 25.00
      },
      {
        name: 'Mike Chen',
        specialization: 'Competitive Training',
        hourly_rate: 35.00
      }
    ]);
    console.log('Coaches created');

    // Creating coach availability
    await CoachAvailability.bulkCreate([
      {
        coach_id: 1,
        day_of_week: 1, // Monday
        start_time: '09:00',
        end_time: '17:00'
      },
      {
        coach_id: 1,
        day_of_week: 2, // Tuesday
        start_time: '09:00',
        end_time: '17:00'
      },
      {
        coach_id: 2,
        day_of_week: 3, // Wednesday
        start_time: '13:00',
        end_time: '21:00'
      },
      {
        coach_id: 2,
        day_of_week: 4, // Thursday
        start_time: '13:00',
        end_time: '21:00'
      },
      {
        coach_id: 3,
        day_of_week: 5, // Friday
        start_time: '16:00',
        end_time: '22:00'
      },
      {
        coach_id: 3,
        day_of_week: 6, // Saturday
        start_time: '09:00',
        end_time: '18:00'
      }
    ]);
    console.log('Coach availability set');

    // Creating pricing rules
    await PricingRule.bulkCreate([
      {
        name: 'Peak Hours (6-9 PM)',
        description: 'Increased rates during evening peak hours',
        rule_type: 'time_based',
        target: 'peak_hours',
        value: 1.5, // 50% increase
        start_time: '18:00',
        end_time: '21:00',
        is_active: true
      },
      {
        name: 'Weekend Premium',
        description: 'Higher rates on weekends',
        rule_type: 'day_based',
        target: 'weekend',
        value: 1.3, // 30% increase
        days_of_week: '0,6', // Sunday, Saturday
        is_active: true
      },
      {
        name: 'Indoor Court Premium',
        description: 'Premium pricing for indoor courts',
        rule_type: 'court_type',
        target: 'indoor',
        value: 1.2, // 20% increase
        is_active: true
      },
      {
        name: 'Early Bird Discount',
        description: 'Discount for morning bookings',
        rule_type: 'time_based',
        target: 'early_bird',
        value: 0.8, // 20% discount
        start_time: '09:00',
        end_time: '12:00',
        is_active: true
      }
    ]);
    console.log('Pricing rules created');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();