import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // For demo purposes, use a mock user ID
    if (!config.headers['X-User-Id']) {
      config.headers['X-User-Id'] = `user_${Date.now()}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Helper functions for common API calls
export const bookingAPI = {
  checkAvailability: (data) => api.post('/bookings/availability', data),
  createBooking: (data) => api.post('/bookings', data),
  getUserBookings: (userId) => api.get(`/bookings/user/${userId}`),
  cancelBooking: (bookingId) => api.put(`/bookings/${bookingId}/cancel`),
  addToWaitlist: (data) => api.post('/bookings/waitlist', data),
  simulatePrice: (data) => api.post('/pricing/simulate', data), // Changed from /bookings/price/simulate
};

export const courtAPI = {
  getAllCourts: () => api.get('/courts'),
  getCourtSlots: (courtId, date) => api.get(`/courts/${courtId}/slots/${date}`),
  getCourtDetails: (courtId) => api.get(`/courts/${courtId}`),
};

export const availabilityAPI = {
  getAvailableSlots: (date, courtType) => 
    api.get(`/availability/slots/${date}${courtType ? `?court_type=${courtType}` : ''}`),
  getEquipmentAvailability: (startTime, endTime) => 
    api.get(`/availability/equipment/${startTime}/${endTime}`),
  getCoachAvailability: (date) => api.get(`/availability/coaches/${date}`),
};

export const adminAPI = {
  getCourts: () => api.get('/admin/courts'),
  createCourt: (data) => api.post('/admin/courts', data),
  updateCourt: (id, data) => api.put(`/admin/courts/${id}`, data),
  
  getEquipment: () => api.get('/admin/equipment'),
  createEquipment: (data) => api.post('/admin/equipment', data),
  
  getCoaches: () => api.get('/admin/coaches'),
  createCoach: (data) => api.post('/admin/coaches', data),
  
  getPricingRules: () => api.get('/admin/pricing-rules'),
  createPricingRule: (data) => api.post('/admin/pricing-rules', data),
  updatePricingRule: (id, data) => api.put(`/admin/pricing-rules/${id}`, data),
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Get user ID from localStorage or generate one
    let userId = localStorage.getItem('user_id');
    if (!userId) {
      userId = `user_${Date.now()}`;
      localStorage.setItem('user_id', userId);
    }
    
    // Add user ID header for backend
    config.headers['X-User-Id'] = userId;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;