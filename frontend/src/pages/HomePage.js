import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Paper,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import moment from 'moment';
import SportsTennisIcon from '@mui/icons-material/SportsTennis';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import GroupIcon from '@mui/icons-material/Group';
import { courtAPI } from '../services/api';

const HomePage = () => {
  const [selectedDate, setSelectedDate] = useState(moment().add(1, 'day').format('YYYY-MM-DD'));
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourts();
  }, []);

  const fetchCourts = async () => {
    try {
      setLoading(true);
      const response = await courtAPI.getAllCourts();
      setCourts(response.data);
    } catch (err) {
      setError('Failed to load courts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <SportsTennisIcon fontSize="large" />,
      title: '4 Premium Courts',
      description: '2 indoor AC courts and 2 outdoor floodlit courts'
    },
    {
      icon: <AccessTimeIcon fontSize="large" />,
      title: 'Easy Booking',
      description: 'Book slots from 9 AM to 10 PM with instant confirmation'
    },
    {
      icon: <AttachMoneyIcon fontSize="large" />,
      title: 'Dynamic Pricing',
      description: 'Competitive pricing with peak hour and weekend rates'
    },
    {
      icon: <GroupIcon fontSize="large" />,
      title: 'Expert Coaches',
      description: '3 professional coaches available for training'
    }
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Paper
        sx={{
          position: 'relative',
          backgroundColor: 'grey.800',
          color: '#fff',
          mb: 4,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7))',
          minHeight: 400,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography component="h1" variant="h2" color="inherit" gutterBottom>
              Book Your Perfect Court
            </Typography>
            <Typography variant="h5" color="inherit" paragraph>
              Reserve badminton courts, equipment, and coaches in one simple booking
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              href="/book"
              sx={{ mt: 3 }}
            >
              Book Now
            </Button>
          </Box>
        </Container>
      </Paper>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 6 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Why Choose Our Facility
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          {features.map((feature, index) => (
            <Grid item key={index} xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                <Box sx={{ color: 'primary.main', mb: 2 }}>
                  {feature.icon}
                </Box>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" component="div" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Courts Section */}
      <Container maxWidth="lg" sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom>
          Our Courts
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {courts.map((court) => (
              <Grid item key={court.id} xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h5" component="div">
                        {court.name}
                      </Typography>
                      <Chip
                        label={court.type}
                        color={court.type === 'indoor' ? 'primary' : 'secondary'}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {court.description}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body1">
                        <strong>Base Price:</strong> ${court.base_price}/hour
                      </Typography>
                      <Typography variant="body1">
                        <strong>Status:</strong> {court.is_active ? 'Available' : 'Maintenance'}
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      color="primary"
                      href={`/book?court=${court.id}`}
                    >
                      Book This Court
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Quick Booking Section */}
      <Paper sx={{ p: 4, mt: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" align="center" gutterBottom>
            Quick Booking
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" paragraph>
            Check availability and book your preferred time slot
          </Typography>
          
          <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
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
            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
              href={`/book?date=${selectedDate}`}
            >
              Check Availability
            </Button>
          </Box>
        </Container>
      </Paper>

      {/* Pricing Info */}
      <Container maxWidth="lg" sx={{ mt: 6, mb: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Pricing Information
        </Typography>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Off-Peak Hours
                </Typography>
                <Typography variant="body2" paragraph>
                  (9 AM - 6 PM, Monday-Friday)
                </Typography>
                <Typography variant="body1">
                  • Outdoor: $10/hour
                </Typography>
                <Typography variant="body1">
                  • Indoor: $15/hour
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Peak Hours
                </Typography>
                <Typography variant="body2" paragraph>
                  (6 PM - 9 PM, Monday-Friday)
                </Typography>
                <Typography variant="body1">
                  • 50% premium on base rates
                </Typography>
                <Typography variant="body1">
                  • Equipment & coach booking available
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Weekend Rates
                </Typography>
                <Typography variant="body2" paragraph>
                  (All day Saturday & Sunday)
                </Typography>
                <Typography variant="body1">
                  • 30% premium on base rates
                </Typography>
                <Typography variant="body1">
                  • All facilities available
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default HomePage;