# Sports Court Booking Platform

A full-stack web application for managing sports facility court bookings with multi-resource support and dynamic pricing.

## Features

### User Features
- Browse available courts (4 total: 2 indoor, 2 outdoor)
- Real-time availability checking
- Multi-resource booking (court + equipment + coach)
- Dynamic pricing with live breakdown
- Waitlist for fully booked slots
- Booking history and cancellation

### Admin Features
- Court management (add/edit/disable)
- Equipment inventory management
- Coach profile and availability management
- Dynamic pricing rule configuration
- Booking management

## Tech Stack

### Frontend
- React.js
- Material-UI
- React Router
- Axios

### Backend
- Node.js + Express.js
- SQLite (development) / PostgreSQL (production)
- Sequelize ORM

## Live Demos

- **Frontend**: [https://sports-court-booking.vercel.app](https://sports-court-booking.vercel.app)
- **Backend API**: [https://sports-court-booking-api.onrender.com](https://sports-court-booking-api.onrender.com)
- **API Health Check**: [https://sports-court-booking-api.onrender.com/api/health](https://sports-court-booking-api.onrender.com/api/health)

## Local Development

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
npm run seed
npm run dev