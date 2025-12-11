import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Chip
} from '@mui/material';
import moment from 'moment';
import api from '../services/api'; // Remove bookingAPI import since we're using api directly

const steps = ['Select Date & Court', 'Select Add-ons', 'Confirm Booking'];

const BookingPage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState(moment().add(1, 'day').format('YYYY-MM-DD'));
  const [selectedTime, setSelectedTime] = useState('18:00');
  const [courts, setCourts] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState({});
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userDetails, setUserDetails] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Generate time slots
  const timeSlots = Array.from({ length: 13 }, (_, i) => {
    const hour = 9 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  // Get or create user ID
  const getOrCreateUserId = useCallback(() => {
    let userId = localStorage.getItem('booking_user_id');
    if (!userId) {
      userId = `user_${Date.now().toString().slice(-8)}`;
      localStorage.setItem('booking_user_id', userId);
    }
    return userId;
  }, []);

  // Local price calculation as fallback
  const calculateLocalPrice = useCallback(() => {
    if (!selectedCourt || !selectedDate || !selectedTime) return;

    const startTime = moment(`${selectedDate}T${selectedTime}:00`);
    const isPeakHour = startTime.hour() >= 18 && startTime.hour() < 21;
    const isWeekend = startTime.day() === 0 || startTime.day() === 6;
    const isIndoor = selectedCourt.type === 'indoor';

    // Base calculations
    let courtPrice = selectedCourt.base_price;
    
    // Apply rules
    if (isIndoor) courtPrice *= 1.2; // 20% premium for indoor
    if (isPeakHour) courtPrice *= 1.5; // 50% premium for peak hours
    if (isWeekend) courtPrice *= 1.3; // 30% premium for weekends

    const coachPrice = selectedCoach ? 
      (coaches.find(c => c.id === selectedCoach)?.hourly_rate || 0) : 0;
    
    const equipmentPrice = Object.entries(selectedEquipment)
      .filter(([_, selected]) => selected)
      .reduce((total, [id, _]) => {
        const eq = equipment.find(e => e.id === parseInt(id));
        return total + (eq?.price_per_session || 0);
      }, 0);

    const totalPrice = courtPrice + coachPrice + equipmentPrice;

    setPriceBreakdown({
      court_price: parseFloat(courtPrice.toFixed(2)),
      coach_price: parseFloat(coachPrice.toFixed(2)),
      equipment_total: parseFloat(equipmentPrice.toFixed(2)),
      total_price: parseFloat(totalPrice.toFixed(2))
    });
  }, [selectedCourt, selectedDate, selectedTime, selectedEquipment, selectedCoach, coaches, equipment]);

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [courtsRes, equipmentRes, coachesRes] = await Promise.all([
        api.get('/courts'),
        api.get('/admin/equipment'),
        api.get('/admin/coaches')
      ]);
      setCourts(courtsRes.data);
      setEquipment(equipmentRes.data);
      setCoaches(coachesRes.data);
    } catch (err) {
      setError('Failed to load data');
    }
  };

  // Calculate price when selections change
  const calculatePrice = useCallback(async () => {
    if (!selectedCourt || !selectedDate || !selectedTime) return;

    const equipmentItems = Object.entries(selectedEquipment)
      .filter(([_, selected]) => selected)
      .map(([id, _]) => ({ equipment_id: parseInt(id), quantity: 1 }));

    const startTime = new Date(`${selectedDate}T${selectedTime}:00`);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later

    try {
      const response = await api.post('/pricing/simulate', {
        court_id: selectedCourt.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        coach_id: selectedCoach,
        equipment_items: equipmentItems
      });
      setPriceBreakdown(response.data);
    } catch (err) {
      console.error('Price calculation failed:', err);
      // Calculate locally if API fails
      calculateLocalPrice();
    }
  }, [selectedCourt, selectedDate, selectedTime, selectedEquipment, selectedCoach, calculateLocalPrice]);

  const [priceBreakdown, setPriceBreakdown] = useState(null);

  useEffect(() => {
    if (selectedCourt && selectedDate && selectedTime) {
      calculatePrice();
    }
  }, [selectedCourt, selectedDate, selectedTime, selectedEquipment, selectedCoach, calculatePrice]);

  const handleEquipmentToggle = (equipmentId) => {
    setSelectedEquipment(prev => ({
      ...prev,
      [equipmentId]: !prev[equipmentId]
    }));
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmitBooking = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = getOrCreateUserId();

      const equipmentItems = Object.entries(selectedEquipment)
        .filter(([_, selected]) => selected)
        .map(([id, _]) => ({ equipment_id: parseInt(id), quantity: 1 }));

      const startTime = new Date(`${selectedDate}T${selectedTime}:00`);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

      const bookingData = {
        user_id: userId,
        user_name: userDetails.name,
        user_email: userDetails.email,
        court_id: selectedCourt.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        coach_id: selectedCoach,
        equipment_items: equipmentItems
      };

      console.log('Submitting booking for user:', userId);
      console.log('Booking data:', bookingData);

      const response = await api.post('/bookings', bookingData);
      
      setSuccess({
        message: 'Booking confirmed!',
        bookingId: response.data.booking?.booking_reference || 'BK' + Date.now().toString().slice(-6)
      });
      
      // Refresh bookings after successful booking
      setTimeout(() => {
        window.dispatchEvent(new Event('bookingCreated'));
      }, 1000);
      
      handleNext();
    } catch (err) {
      console.error('Booking error:', err);
      setError(err.response?.data?.error || err.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                type="date"
                label="Select Date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  min: new Date().toISOString().split('T')[0],
                  max: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select Time Slot</InputLabel>
                <Select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  label="Select Time Slot"
                >
                  {timeSlots.map((time) => (
                    <MenuItem key={time} value={time}>
                      {time} - {moment(time, 'HH:mm').add(1, 'hour').format('HH:mm')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Select Court
              </Typography>
              <Grid container spacing={2}>
                {courts.map(court => (
                  <Grid item xs={12} sm={6} key={court.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: selectedCourt?.id === court.id ? '2px solid #1976d2' : 'none',
                        backgroundColor: selectedCourt?.id === court.id ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
                      }}
                      onClick={() => setSelectedCourt(court)}
                    >
                      <CardContent>
                        <Typography variant="h6">{court.name}</Typography>
                        <Chip
                          label={court.type}
                          color={court.type === 'indoor' ? 'primary' : 'secondary'}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {court.description}
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 2, fontWeight: 'bold' }}>
                          Base: ${court.base_price}/hr
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Add Equipment
              </Typography>
              {equipment.map(item => (
                <Card key={item.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!selectedEquipment[item.id]}
                          onChange={() => handleEquipmentToggle(item.id)}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1">{item.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            ${item.price_per_session} per session
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Available: {item.available_quantity}
                          </Typography>
                        </Box>
                      }
                    />
                  </CardContent>
                </Card>
              ))}
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Add Coach (Optional)
              </Typography>
              {coaches.map(coach => (
                <Card 
                  key={coach.id} 
                  sx={{ 
                    mb: 2,
                    cursor: 'pointer',
                    border: selectedCoach === coach.id ? '2px solid #1976d2' : 'none',
                    backgroundColor: selectedCoach === coach.id ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
                  }}
                  onClick={() => setSelectedCoach(selectedCoach === coach.id ? null : coach.id)}
                >
                  <CardContent>
                    <Typography variant="h6">{coach.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Specialization: {coach.specialization}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1, fontWeight: 'bold' }}>
                      ${coach.hourly_rate}/hour
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Grid>

            {priceBreakdown && (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Price Breakdown
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography>Court ({selectedCourt?.name}):</Typography>
                    </Grid>
                    <Grid item xs={6} textAlign="right">
                      <Typography>${priceBreakdown.court_price?.toFixed(2) || '0.00'}</Typography>
                    </Grid>
                    
                    {selectedCoach && (
                      <>
                        <Grid item xs={6}>
                          <Typography>Coach:</Typography>
                        </Grid>
                        <Grid item xs={6} textAlign="right">
                          <Typography>${priceBreakdown.coach_price?.toFixed(2) || '0.00'}</Typography>
                        </Grid>
                      </>
                    )}

                    {Object.keys(selectedEquipment).filter(id => selectedEquipment[id]).length > 0 && (
                      <>
                        <Grid item xs={6}>
                          <Typography>Equipment:</Typography>
                        </Grid>
                        <Grid item xs={6} textAlign="right">
                          <Typography>${priceBreakdown.equipment_total?.toFixed(2) || '0.00'}</Typography>
                        </Grid>
                      </>
                    )}

                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                    </Grid>

                    <Grid item xs={6}>
                      <Typography variant="h6">Total:</Typography>
                    </Grid>
                    <Grid item xs={6} textAlign="right">
                      <Typography variant="h6">${priceBreakdown.total_price?.toFixed(2) || '0.00'}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            )}
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Enter Your Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={userDetails.name}
                    onChange={(e) => setUserDetails(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={userDetails.email}
                    onChange={(e) => setUserDetails(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={userDetails.phone}
                    onChange={(e) => setUserDetails(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Booking Summary
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2">Court:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>{selectedCourt?.name}</Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2">Date:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      {moment(selectedDate).format('ddd, MMM D, YYYY')}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2">Time:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      {selectedTime} - {moment(selectedTime, 'HH:mm').add(1, 'hour').format('HH:mm')}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2">Duration:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>1 hour</Typography>
                  </Grid>

                  {selectedCoach && (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="body2">Coach:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography>
                          {coaches.find(c => c.id === selectedCoach)?.name}
                        </Typography>
                      </Grid>
                    </>
                  )}

                  {Object.keys(selectedEquipment).filter(id => selectedEquipment[id]).length > 0 && (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="body2">Equipment:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography>
                          {equipment
                            .filter(e => selectedEquipment[e.id])
                            .map(e => e.name)
                            .join(', ')}
                        </Typography>
                      </Grid>
                    </>
                  )}

                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="h6">Total Price:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="h6">${priceBreakdown?.total_price?.toFixed(2) || '0.00'}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Box textAlign="center" py={8}>
            <Typography variant="h4" color="success.main" gutterBottom>
              Booking Confirmed! 🎉
            </Typography>
            <Typography variant="h6" gutterBottom>
              Booking Reference: {success?.bookingId}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              A confirmation email has been sent to {userDetails.email}
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                setActiveStep(0);
                setSuccess(null);
                setUserDetails({ name: '', email: '', phone: '' });
                setSelectedCourt(null);
                setSelectedDate(moment().add(1, 'day').format('YYYY-MM-DD'));
                setSelectedTime('18:00');
                setSelectedEquipment({});
                setSelectedCoach(null);
              }}
              sx={{ mt: 2 }}
            >
              Make Another Booking
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  // Main component return
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Book a Court
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 2 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success.message}
        </Alert>
      )}

      {renderStepContent(activeStep)}

      {activeStep < 3 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmitBooking}
                disabled={loading || !userDetails.name || !userDetails.email}
              >
                {loading ? <CircularProgress size={24} /> : 'Confirm Booking'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={
                  (activeStep === 0 && (!selectedCourt || !selectedDate || !selectedTime)) ||
                  (activeStep === 2 && (!userDetails.name || !userDetails.email))
                }
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default BookingPage;