const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});


const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Court Model
const Court = sequelize.define('Court', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('indoor', 'outdoor'),
    allowNull: false
  },
  base_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 10.00
  },
  description: {
    type: DataTypes.TEXT
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

// Equipment Model
const Equipment = sequelize.define('Equipment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('racket', 'shoes', 'other'),
    allowNull: false
  },
  price_per_session: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 5.00
  },
  total_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  available_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

// Coach Model
const Coach = sequelize.define('Coach', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  specialization: {
    type: DataTypes.STRING
  },
  hourly_rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 20.00
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

// Coach Availability Model
const CoachAvailability = sequelize.define('CoachAvailability', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  coach_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  day_of_week: {
    type: DataTypes.INTEGER, // 0-6 (Sunday-Saturday)
    allowNull: false
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  is_recurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

// Pricing Rule Model
const PricingRule = sequelize.define('PricingRule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  rule_type: {
    type: DataTypes.ENUM('time_based', 'day_based', 'court_type', 'multiplier', 'fixed_addition'),
    allowNull: false
  },
  target: {
    type: DataTypes.STRING // e.g., 'indoor', 'weekend', 'peak_hours'
  },
  value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  start_time: {
    type: DataTypes.TIME
  },
  end_time: {
    type: DataTypes.TIME
  },
  days_of_week: {
    type: DataTypes.STRING // Comma-separated: '0,6' for Sunday, Saturday
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

// Booking Model
const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  user_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  user_email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  court_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  coach_id: {
    type: DataTypes.INTEGER
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  duration_hours: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false
  },
  court_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  equipment_price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  coach_price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('confirmed', 'cancelled', 'completed'),
    defaultValue: 'confirmed'
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'refunded'),
    defaultValue: 'pending'
  }
});

// Booking Equipment Junction Table
const BookingEquipment = sequelize.define('BookingEquipment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  booking_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  equipment_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  }
});

// Waitlist Model
const Waitlist = sequelize.define('Waitlist', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  user_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  user_email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  court_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  coach_id: {
    type: DataTypes.INTEGER
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'notified', 'cancelled', 'booked'),
    defaultValue: 'active'
  },
  notified_at: {
    type: DataTypes.DATE
  }
});

// Define Relationships
Court.hasMany(Booking, { foreignKey: 'court_id' });
Booking.belongsTo(Court, { foreignKey: 'court_id' });

Coach.hasMany(Booking, { foreignKey: 'coach_id' });
Booking.belongsTo(Coach, { foreignKey: 'coach_id' });

Coach.hasMany(CoachAvailability, { foreignKey: 'coach_id' });
CoachAvailability.belongsTo(Coach, { foreignKey: 'coach_id' });

Booking.hasMany(BookingEquipment, { foreignKey: 'booking_id' });
BookingEquipment.belongsTo(Booking, { foreignKey: 'booking_id' });
BookingEquipment.belongsTo(Equipment, { foreignKey: 'equipment_id' });

// Sync Database
const syncDatabase = async () => {
  try {
    await sequelize.sync({ force: false });
    console.log('Database synchronized');
  } catch (error) {
    console.error('Error syncing database:', error);
  }
};

module.exports = {
  sequelize,
  Court,
  Equipment,
  Coach,
  CoachAvailability,
  PricingRule,
  Booking,
  BookingEquipment,
  Waitlist,
  syncDatabase
};