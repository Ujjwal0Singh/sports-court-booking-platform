# Sports Facility Court Booking Platform

A full-stack web application for booking badminton courts with multi-resource booking, dynamic pricing, and admin management features.

## Features

### User Features
- Browse available courts (4 total: 2 indoor, 2 outdoor)
- Check real-time availability for specific dates/times
- Book court + equipment + coach in a single transaction
- View dynamic price calculation with breakdown
- Join waitlist for fully booked slots
- View booking history and cancel bookings

### Admin Features
- Manage courts (add/edit/disable)
- Manage equipment inventory
- Manage coach profiles and availability
- Configure dynamic pricing rules
- View all bookings and reports

### Technical Features
- Atomic booking transactions (all or nothing)
- Dynamic pricing engine with configurable rules
- Concurrent booking prevention
- Waitlist system with notifications
- Responsive React frontend
- RESTful API backend

## Tech Stack

**Backend:**
- Node.js + Express.js
- SQLite + Sequelize ORM
- REST API architecture

**Frontend:**
- React.js
- Material-UI components
- React Router for navigation
- Axios for API calls

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend