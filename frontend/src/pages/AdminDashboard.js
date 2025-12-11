import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { adminAPI } from '../services/api';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const AdminDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Data states
  const [courts, setCourts] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [pricingRules, setPricingRules] = useState([]);

  // Form states
  const [courtForm, setCourtForm] = useState({
    name: '',
    type: 'indoor',
    base_price: '',
    description: '',
    is_active: true
  });

  const [equipmentForm, setEquipmentForm] = useState({
    name: '',
    type: 'racket',
    price_per_session: '',
    total_quantity: '',
    available_quantity: ''
  });

  const [coachForm, setCoachForm] = useState({
    name: '',
    specialization: '',
    hourly_rate: '',
    is_active: true
  });

  const [pricingRuleForm, setPricingRuleForm] = useState({
    name: '',
    description: '',
    rule_type: 'multiplier',
    target: '',
    value: '',
    start_time: '',
    end_time: '',
    days_of_week: '',
    is_active: true
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [courtsRes, equipmentRes, coachesRes, rulesRes] = await Promise.all([
        adminAPI.getCourts(),
        adminAPI.getEquipment(),
        adminAPI.getCoaches(),
        adminAPI.getPricingRules()
      ]);
      setCourts(courtsRes.data);
      setEquipment(equipmentRes.data);
      setCoaches(coachesRes.data);
      setPricingRules(rulesRes.data);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCourtSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await adminAPI.createCourt(courtForm);
      setCourts([...courts, response.data]);
      setCourtForm({
        name: '',
        type: 'indoor',
        base_price: '',
        description: '',
        is_active: true
      });
      setSuccess('Court added successfully');
    } catch (err) {
      setError('Failed to add court');
    }
  };

  const handleEquipmentSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = {
        ...equipmentForm,
        available_quantity: equipmentForm.available_quantity || equipmentForm.total_quantity
      };
      const response = await adminAPI.createEquipment(formData);
      setEquipment([...equipment, response.data]);
      setEquipmentForm({
        name: '',
        type: 'racket',
        price_per_session: '',
        total_quantity: '',
        available_quantity: ''
      });
      setSuccess('Equipment added successfully');
    } catch (err) {
      setError('Failed to add equipment');
    }
  };

  const handleCoachSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await adminAPI.createCoach(coachForm);
      setCoaches([...coaches, response.data]);
      setCoachForm({
        name: '',
        specialization: '',
        hourly_rate: '',
        is_active: true
      });
      setSuccess('Coach added successfully');
    } catch (err) {
      setError('Failed to add coach');
    }
  };

  const handlePricingRuleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await adminAPI.createPricingRule(pricingRuleForm);
      setPricingRules([...pricingRules, response.data]);
      setPricingRuleForm({
        name: '',
        description: '',
        rule_type: 'multiplier',
        target: '',
        value: '',
        start_time: '',
        end_time: '',
        days_of_week: '',
        is_active: true
      });
      setSuccess('Pricing rule added successfully');
    } catch (err) {
      setError('Failed to add pricing rule');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ width: '100%' }}>
      <Typography variant="h4" sx={{ p: 3, pb: 0 }}>
        Admin Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ m: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ m: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs">
          <Tab label="Courts" />
          <Tab label="Equipment" />
          <Tab label="Coaches" />
          <Tab label="Pricing Rules" />
        </Tabs>
      </Box>

      {/* Courts Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Add New Court
              </Typography>
              <form onSubmit={handleCourtSubmit}>
                <TextField
                  fullWidth
                  label="Court Name"
                  value={courtForm.name}
                  onChange={(e) => setCourtForm({ ...courtForm, name: e.target.value })}
                  margin="normal"
                  required
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={courtForm.type}
                    onChange={(e) => setCourtForm({ ...courtForm, type: e.target.value })}
                    label="Type"
                  >
                    <MenuItem value="indoor">Indoor</MenuItem>
                    <MenuItem value="outdoor">Outdoor</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Base Price ($/hour)"
                  type="number"
                  value={courtForm.base_price}
                  onChange={(e) => setCourtForm({ ...courtForm, base_price: e.target.value })}
                  margin="normal"
                  required
                  inputProps={{ step: "0.01", min: "0" }}
                />
                <TextField
                  fullWidth
                  label="Description"
                  value={courtForm.description}
                  onChange={(e) => setCourtForm({ ...courtForm, description: e.target.value })}
                  margin="normal"
                  multiline
                  rows={3}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={courtForm.is_active}
                      onChange={(e) => setCourtForm({ ...courtForm, is_active: e.target.checked })}
                    />
                  }
                  label="Active"
                />
                <Button type="submit" variant="contained" sx={{ mt: 2 }}>
                  Add Court
                </Button>
              </form>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Existing Courts ({courts.length})
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {courts.map((court) => (
                    <TableRow key={court.id}>
                      <TableCell>{court.name}</TableCell>
                      <TableCell>{court.type}</TableCell>
                      <TableCell align="right">${court.base_price}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={court.is_active ? 'Active' : 'Inactive'}
                          color={court.is_active ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Equipment Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Add New Equipment
              </Typography>
              <form onSubmit={handleEquipmentSubmit}>
                <TextField
                  fullWidth
                  label="Equipment Name"
                  value={equipmentForm.name}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                  margin="normal"
                  required
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={equipmentForm.type}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, type: e.target.value })}
                    label="Type"
                  >
                    <MenuItem value="racket">Racket</MenuItem>
                    <MenuItem value="shoes">Shoes</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Price per Session ($)"
                  type="number"
                  value={equipmentForm.price_per_session}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, price_per_session: e.target.value })}
                  margin="normal"
                  required
                  inputProps={{ step: "0.01", min: "0" }}
                />
                <TextField
                  fullWidth
                  label="Total Quantity"
                  type="number"
                  value={equipmentForm.total_quantity}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, total_quantity: e.target.value })}
                  margin="normal"
                  required
                  inputProps={{ min: "0" }}
                />
                <TextField
                  fullWidth
                  label="Available Quantity"
                  type="number"
                  value={equipmentForm.available_quantity}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, available_quantity: e.target.value })}
                  margin="normal"
                  inputProps={{ min: "0" }}
                />
                <Button type="submit" variant="contained" sx={{ mt: 2 }}>
                  Add Equipment
                </Button>
              </form>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Equipment Inventory ({equipment.length})
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Available</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {equipment.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell align="right">${item.price_per_session}</TableCell>
                      <TableCell align="right">{item.total_quantity}</TableCell>
                      <TableCell align="right">{item.available_quantity}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Coaches Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Add New Coach
              </Typography>
              <form onSubmit={handleCoachSubmit}>
                <TextField
                  fullWidth
                  label="Coach Name"
                  value={coachForm.name}
                  onChange={(e) => setCoachForm({ ...coachForm, name: e.target.value })}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Specialization"
                  value={coachForm.specialization}
                  onChange={(e) => setCoachForm({ ...coachForm, specialization: e.target.value })}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Hourly Rate ($)"
                  type="number"
                  value={coachForm.hourly_rate}
                  onChange={(e) => setCoachForm({ ...coachForm, hourly_rate: e.target.value })}
                  margin="normal"
                  required
                  inputProps={{ step: "0.01", min: "0" }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={coachForm.is_active}
                      onChange={(e) => setCoachForm({ ...coachForm, is_active: e.target.checked })}
                    />
                  }
                  label="Active"
                />
                <Button type="submit" variant="contained" sx={{ mt: 2 }}>
                  Add Coach
                </Button>
              </form>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Coaches ({coaches.length})
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Specialization</TableCell>
                    <TableCell align="right">Rate</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {coaches.map((coach) => (
                    <TableRow key={coach.id}>
                      <TableCell>{coach.name}</TableCell>
                      <TableCell>{coach.specialization}</TableCell>
                      <TableCell align="right">${coach.hourly_rate}/hr</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={coach.is_active ? 'Active' : 'Inactive'}
                          color={coach.is_active ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Pricing Rules Tab */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Add New Pricing Rule
              </Typography>
              <form onSubmit={handlePricingRuleSubmit}>
                <TextField
                  fullWidth
                  label="Rule Name"
                  value={pricingRuleForm.name}
                  onChange={(e) => setPricingRuleForm({ ...pricingRuleForm, name: e.target.value })}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Description"
                  value={pricingRuleForm.description}
                  onChange={(e) => setPricingRuleForm({ ...pricingRuleForm, description: e.target.value })}
                  margin="normal"
                  multiline
                  rows={2}
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel>Rule Type</InputLabel>
                  <Select
                    value={pricingRuleForm.rule_type}
                    onChange={(e) => setPricingRuleForm({ ...pricingRuleForm, rule_type: e.target.value })}
                    label="Rule Type"
                  >
                    <MenuItem value="multiplier">Multiplier</MenuItem>
                    <MenuItem value="fixed_addition">Fixed Addition</MenuItem>
                    <MenuItem value="time_based">Time Based</MenuItem>
                    <MenuItem value="day_based">Day Based</MenuItem>
                    <MenuItem value="court_type">Court Type Based</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Target (e.g., indoor, weekend, peak_hours)"
                  value={pricingRuleForm.target}
                  onChange={(e) => setPricingRuleForm({ ...pricingRuleForm, target: e.target.value })}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Value (multiplier or fixed amount)"
                  type="number"
                  value={pricingRuleForm.value}
                  onChange={(e) => setPricingRuleForm({ ...pricingRuleForm, value: e.target.value })}
                  margin="normal"
                  required
                  inputProps={{ step: "0.01" }}
                />
                {pricingRuleForm.rule_type === 'time_based' && (
                  <>
                    <TextField
                      fullWidth
                      label="Start Time (HH:MM)"
                      value={pricingRuleForm.start_time}
                      onChange={(e) => setPricingRuleForm({ ...pricingRuleForm, start_time: e.target.value })}
                      margin="normal"
                      placeholder="18:00"
                    />
                    <TextField
                      fullWidth
                      label="End Time (HH:MM)"
                      value={pricingRuleForm.end_time}
                      onChange={(e) => setPricingRuleForm({ ...pricingRuleForm, end_time: e.target.value })}
                      margin="normal"
                      placeholder="21:00"
                    />
                  </>
                )}
                {pricingRuleForm.rule_type === 'day_based' && (
                  <TextField
                    fullWidth
                    label="Days of Week (0-6 comma separated, 0=Sunday)"
                    value={pricingRuleForm.days_of_week}
                    onChange={(e) => setPricingRuleForm({ ...pricingRuleForm, days_of_week: e.target.value })}
                    margin="normal"
                    placeholder="0,6"
                  />
                )}
                <FormControlLabel
                  control={
                    <Switch
                      checked={pricingRuleForm.is_active}
                      onChange={(e) => setPricingRuleForm({ ...pricingRuleForm, is_active: e.target.checked })}
                    />
                  }
                  label="Active"
                />
                <Button type="submit" variant="contained" sx={{ mt: 2 }}>
                  Add Pricing Rule
                </Button>
              </form>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Active Pricing Rules ({pricingRules.filter(r => r.is_active).length})
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Target</TableCell>
                    <TableCell align="right">Value</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pricingRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>{rule.name}</TableCell>
                      <TableCell>{rule.rule_type}</TableCell>
                      <TableCell>{rule.target || '-'}</TableCell>
                      <TableCell align="right">
                        {rule.rule_type === 'multiplier' ? `${rule.value}x` : `$${rule.value}`}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={rule.is_active ? 'Active' : 'Inactive'}
                          color={rule.is_active ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </TabPanel>
    </Paper>
  );
};

export default AdminDashboard;