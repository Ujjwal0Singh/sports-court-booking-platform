import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Tooltip
} from '@mui/material';
import moment from 'moment';
import CancelIcon from '@mui/icons-material/Cancel';
import ReceiptIcon from '@mui/icons-material/Receipt';
import RefreshIcon from '@mui/icons-material/Refresh';
import { bookingAPI } from '../services/api';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Get user ID from localStorage or generate one
  const getUserId = useCallback(() => {
    let userId = localStorage.getItem('booking_user_id');
    if (!userId) {
      userId = `user_${Date.now().toString().slice(-8)}`;
      localStorage.setItem('booking_user_id', userId);
    }
    return userId;
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const userId = getUserId();
      console.log('Fetching bookings for user:', userId);
      
      const response = await bookingAPI.getUserBookings(userId);
      console.log('Bookings response:', response.data);
      
      if (response.data && response.data.length > 0) {
        setBookings(response.data);
        setError(null);
      } else {
        // If no bookings, show demo data
        setBookings(getDemoBookings(userId));
        setError('No bookings found. Showing demo data.');
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      // Show demo data on error
      setBookings(getDemoBookings(getUserId()));
      setError('Could not load bookings. Showing demo data.');
    } finally {
      setLoading(false);
    }
  }, [getUserId]);

  const getDemoBookings = (userId) => {
    return [
      {
        id: 1,
        booking_reference: 'BK000001',
        user_id: userId,
        user_name: 'Demo User',
        user_email: 'demo@example.com',
        court: { name: 'Indoor Court 1', type: 'indoor' },
        coach: { name: 'John Smith', specialization: 'Advanced Training' },
        start_time: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        end_time: new Date(Date.now() + 25 * 60 * 60 * 1000), // Tomorrow + 1 hour
        duration_hours: 1,
        court_price: 22.50,
        equipment_price: 13.00,
        coach_price: 30.00,
        total_price: 65.50,
        status: 'confirmed',
        payment_status: 'paid',
        equipment_items: [
          { name: 'Professional Racket', quantity: 2 },
          { name: 'Badminton Shoes', quantity: 1 }
        ]
      },
      {
        id: 2,
        booking_reference: 'BK000002',
        user_id: userId,
        user_name: 'Demo User',
        user_email: 'demo@example.com',
        court: { name: 'Outdoor Court 2', type: 'outdoor' },
        coach: null,
        start_time: new Date(Date.now() + 48 * 60 * 60 * 1000), // 2 days from now
        end_time: new Date(Date.now() + 50 * 60 * 60 * 1000), // 2 days + 2 hours
        duration_hours: 2,
        court_price: 20.00,
        equipment_price: 5.00,
        coach_price: 0,
        total_price: 25.00,
        status: 'confirmed',
        payment_status: 'pending',
        equipment_items: [
          { name: 'Beginner Racket', quantity: 1 }
        ]
      }
    ];
  };

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleRefresh = () => {
    fetchBookings();
  };

  const handleCancelClick = (booking) => {
    setSelectedBooking(booking);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    try {
      if (selectedBooking) {
        await bookingAPI.cancelBooking(selectedBooking.id);
        
        // Update local state
        setBookings(bookings.map(b => 
          b.id === selectedBooking.id 
            ? { ...b, status: 'cancelled', payment_status: 'refunded' }
            : b
        ));
        
        setCancelDialogOpen(false);
        setSelectedBooking(null);
      }
    } catch (err) {
      setError('Failed to cancel booking');
      console.error('Cancel booking error:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'success';
      case 'cancelled': return 'error';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'refunded': return 'info';
      default: return 'default';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          My Bookings
        </Typography>
        <Box>
          <Tooltip title="Refresh bookings">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            href="/book"
            sx={{ ml: 2 }}
          >
            Book New Court
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert 
          severity="info"
          sx={{ mb: 3 }} 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {bookings.length === 0 ? (
        <Box textAlign="center" py={6}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No bookings found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            You haven't made any bookings yet.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            href="/book"
            sx={{ mt: 2 }}
          >
            Make Your First Booking
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {bookings.map((booking) => (
            <Grid item xs={12} key={booking.id || booking.booking_reference}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Booking #{booking.booking_reference}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {moment(booking.start_time).format('MMM D, YYYY')}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={booking.status?.toUpperCase() || 'CONFIRMED'}
                        color={getStatusColor(booking.status)}
                        size="small"
                      />
                      <Chip
                        label={booking.payment_status?.toUpperCase() || 'PENDING'}
                        color={getPaymentStatusColor(booking.payment_status)}
                        size="small"
                      />
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" gutterBottom color="primary">
                        <strong>Court Details</strong>
                      </Typography>
                      <Box mb={2}>
                        <Typography variant="body1" fontWeight="medium">
                          {booking.court?.name} ({booking.court?.type})
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Date: {moment(booking.start_time).format('dddd, MMMM D, YYYY')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Time: {moment(booking.start_time).format('h:mm A')} - {moment(booking.end_time).format('h:mm A')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Duration: {booking.duration_hours} hour(s)
                        </Typography>
                      </Box>

                      {booking.coach && (
                        <Box mb={2}>
                          <Typography variant="subtitle2" gutterBottom>
                            <strong>Coach:</strong> {booking.coach.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {booking.coach.specialization}
                          </Typography>
                        </Box>
                      )}
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" gutterBottom color="primary">
                        <strong>Price Breakdown</strong>
                      </Typography>
                      <Box mb={2}>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">Court Fee:</Typography>
                          <Typography variant="body2">{formatCurrency(booking.court_price)}</Typography>
                        </Box>
                        {booking.coach_price > 0 && (
                          <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography variant="body2">Coach Fee:</Typography>
                            <Typography variant="body2">{formatCurrency(booking.coach_price)}</Typography>
                          </Box>
                        )}
                        {booking.equipment_price > 0 && (
                          <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography variant="body2">Equipment:</Typography>
                            <Typography variant="body2">{formatCurrency(booking.equipment_price)}</Typography>
                          </Box>
                        )}
                        <Divider sx={{ my: 1 }} />
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body1" fontWeight="medium">Total:</Typography>
                          <Typography variant="body1" fontWeight="medium">{formatCurrency(booking.total_price)}</Typography>
                        </Box>
                      </Box>

                      {booking.equipment_items && booking.equipment_items.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            <strong>Equipment:</strong>
                          </Typography>
                          {booking.equipment_items.map((item, idx) => (
                            <Typography key={idx} variant="body2" color="text.secondary">
                              • {item.name} x{item.quantity}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </Grid>

                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          User ID: {getUserId().slice(0, 8)}...
                        </Typography>
                        <Box>
                          {booking.status === 'confirmed' && (
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<CancelIcon />}
                              onClick={() => handleCancelClick(booking)}
                              sx={{ mr: 1 }}
                            >
                              Cancel Booking
                            </Button>
                          )}
                          <Button
                            variant="outlined"
                            startIcon={<ReceiptIcon />}
                            onClick={() => {
                              alert(`Receipt for Booking #${booking.booking_reference}\nTotal: ${formatCurrency(booking.total_price)}`);
                            }}
                          >
                            Receipt
                          </Button>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel booking #{selectedBooking?.booking_reference}?
            <br /><br />
            <strong>Court:</strong> {selectedBooking?.court?.name}
            <br />
            <strong>Date:</strong> {selectedBooking?.start_time ? moment(selectedBooking.start_time).format('MMM D, YYYY') : ''}
            <br />
            <strong>Time:</strong> {selectedBooking?.start_time ? moment(selectedBooking.start_time).format('h:mm A') : ''}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>
            Keep Booking
          </Button>
          <Button 
            onClick={handleCancelConfirm} 
            color="error" 
            variant="contained"
            startIcon={<CancelIcon />}
          >
            Cancel Booking
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default MyBookings;