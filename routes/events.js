/* This is our events.js file */

import {Router} from 'express';
import * as eventData from '../data/events.js';

const router = Router();

// GET all events
router.route('/').get(async (req, res) => {
    try {
        const events = await eventData.getAllEvents();
        return res.json(events);
    } catch (e) {
        return res.status(500).json({error: e});
    }
});

// GET event by id
router.route('/:id').get(async (req, res) => {
    try {
        const event = await eventData.getEventById(req.params.id);
        return res.json(event);
    } catch (e) {
        return res.status(404).json({error: e});
    }
});

// POST event
router.route('/').post(async (req, res) => {
    let eventInfo = req.body;

    if (!eventInfo || Object.keys(eventInfo).length === 0) {
        return res.status(400).json({error: 'No data provided'});
    }

    try {
        const newEvent = await eventData.createEvent(eventInfo);
        return res.json(newEvent);
    } catch (e) {
    console.log(e);
    return res.status(400).json({error: e.message || e});
    }
});

export default router;