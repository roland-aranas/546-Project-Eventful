/* This is our events.js file */

import {Router} from 'express';
import * as eventData from '../data/events.js';
import * as validation from '../helper.js';

const router = Router();

// GET all events
router.route('/').get(async (req, res) => {
    try {
        const events = await eventData.getAllEvents();
        return res.json(events);
    } catch (e) {
        return res.status(500).json({error: e || e.toString()});
    }
});

// GET event by id
router.route('/:id').get(async (req, res) => {
    try {
        const id = validation.checkId(req.params.id, 'Event ID');
        const event = await eventData.getEventById(req.params.id);
        return res.json(event);
    } catch (e) {
        return res.status(404).json({error: e || e.toString()});
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
    return res.status(400).json({error: e.message || e.toString()});
    }
});

// PATCH event
router.route('/:id').patch(async (req, res) => {
    let eventInfo = req.body;

    if (!eventInfo || Object.keys(eventInfo).length === 0) {
        return res.status(400).json({error: 'No fields provided'});
    }

    try {
        const id = validation.checkId(req.params.id, 'Event ID');
        const updatedEvent = await eventData.updateEvent(req.params.id, eventInfo);
        return res.json(updatedEvent);
    } catch (e) {
        return res.status(400).json({error: e.message || e.toString()});
    }
});

// DELETE event
router.route('/:id').delete(async (req, res) => {
    try {
        const id = validation.checkId(req.params.id, 'Event ID');
        const deletedEvent = await eventData.deleteEvent(req.params.id);
        return res.json({deleted: true, event: deletedEvent});
    } catch (e) {
        return res.status(400).json({error: e.message || e.toString()});
    }
});

// ADD linke
router.route('/:id/like').post(async (req, res) => {
    try {
        const id = validation.checkId(req.params.id, 'Event ID');
        const updatedEvent = await likeEvent(req.params.id, req.session.user._id);
        res.json({likeCount: updatedEvent.likeCount});
    } catch (e) {
        res.status(400).json({error: e.message || e.toString()});
    }
});

export default router;