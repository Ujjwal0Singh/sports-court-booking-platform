const express = require('express');
const router = express.Router();
const { Court, Equipment, Coach, CoachAvailability, PricingRule } = require('../models');

// Managing Courts
router.get('/courts', async (req, res) => {
  try {
    const courts = await Court.findAll();
    res.json(courts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courts' });
  }
});

router.post('/courts', async (req, res) => {
  try {
    const court = await Court.create(req.body);
    res.status(201).json(court);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create court' });
  }
});

router.put('/courts/:id', async (req, res) => {
  try {
    const court = await Court.findByPk(req.params.id);
    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }
    await court.update(req.body);
    res.json(court);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update court' });
  }
});

// Managing Equipment
router.get('/equipment', async (req, res) => {
  try {
    const equipment = await Equipment.findAll();
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

router.post('/equipment', async (req, res) => {
  try {
    const equipment = await Equipment.create(req.body);
    res.status(201).json(equipment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create equipment' });
  }
});

// Managing Coaches
router.get('/coaches', async (req, res) => {
  try {
    const coaches = await Coach.findAll({
      include: [{ model: CoachAvailability }]
    });
    res.json(coaches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coaches' });
  }
});

router.post('/coaches', async (req, res) => {
  try {
    const coach = await Coach.create(req.body);
    res.status(201).json(coach);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create coach' });
  }
});

// Managing Pricing Rules
router.get('/pricing-rules', async (req, res) => {
  try {
    const rules = await PricingRule.findAll();
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pricing rules' });
  }
});

router.post('/pricing-rules', async (req, res) => {
  try {
    const rule = await PricingRule.create(req.body);
    res.status(201).json(rule);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create pricing rule' });
  }
});

router.put('/pricing-rules/:id', async (req, res) => {
  try {
    const rule = await PricingRule.findByPk(req.params.id);
    if (!rule) {
      return res.status(404).json({ error: 'Pricing rule not found' });
    }
    await rule.update(req.body);
    res.json(rule);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update pricing rule' });
  }
});

module.exports = router;