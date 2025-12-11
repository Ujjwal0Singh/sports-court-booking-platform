const express = require('express');
const router = express.Router();
const PricingController = require('../controllers/pricingController');

// Geting pricing simulation
router.post('/simulate', PricingController.simulatePrice);

// Geting active pricing rules
router.get('/rules', async (req, res) => {
  try {
    const { PricingRule } = require('../models');
    const rules = await PricingRule.findAll({ 
      where: { is_active: true },
      order: [['createdAt', 'ASC']]
    });
    res.json(rules);
  } catch (error) {
    console.error('Pricing rules error:', error);
    res.status(500).json({ error: 'Failed to fetch pricing rules' });
  }
});

module.exports = router;