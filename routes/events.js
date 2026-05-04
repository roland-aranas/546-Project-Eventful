/* This is our events.js file */

import {Router} from 'express';
import * as eventData from '../data/events.js';
import * as validation from '../helper.js';
import userData from '../data/users.js';

const router = Router();

router.get('/home', async (req, res) => {
    const events = await eventData.getAllEvents();

    return res.render('home', {
        user: req.session.user,
        recEvents: events
    });
});

router.get('/search', async (req, res) => {
    return res.render('search');
});

router.get('/create', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/users/login');
    }
    return res.render('create');
});

//search route
router.route('/search').get(async (req, res) => {
    let query = req.query.q;

    if (!query || typeof query !== 'string' || !query.trim()) {
        return res.status(400).json({ error: 'no search terms given' });
    }

    query = query.trim();

    try {
        const all = await eventData.getAllEvents();
        const results = all.filter((event) => event.title.toLowerCase().includes(query.toLowerCase()) ||
            event.description.toLowerCase().includes(query.toLowerCase()) ||
            event.eventType?.toLowerCase().includes(query.toLowerCase())
        );

        return res.json(results);
    } 
    
    catch (e) {
        return res.status(500).json({ error: e || e.toString() });
    }
});

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
    let id;
    try {
        id = validation.checkId(req.params.id, 'Event ID');
    } catch (e) {
        return res.status(400).json({error: e.message || e.toString()});
    }

    try {
        const event = await eventData.getEventById(id);
        return res.json(event);
    } catch (e) {
        return res.status(404).json({error: e || e.toString()});
    }
});

// POST event
router.route('/').post(async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({error: 'You must be logged in to create an event'});
    }

    let eventInfo = req.body;

    if (!eventInfo || typeof eventInfo !== 'object' || Array.isArray(eventInfo)) {
        return res.status(400).json({error: 'You must provide event data'});
    }
    if (Object.keys(eventInfo).length === 0) {
        return res.status(400).json({error: 'No data provided'});
    }

    try {
        eventInfo.hostedBy = req.session.user.username;
        eventInfo.createdBy = req.session.user._id;
        const newEvent = await eventData.createEvent(eventInfo);
        await userData.addCreatedEvent(
            req.session.user._id,
            newEvent._id.toString()
        );
        return res.status(201).json(newEvent);
    } catch (e) {
        return res.status(400).json({error: e.message || e.toString()});
    }
});

// PATCH event
router.route('/:id').patch(async (req, res) => {
    let id;
    try {
        id = validation.checkId(req.params.id, 'Event ID');
    } catch (e) {
        return res.status(400).json({error: e.message || e.toString()});
    }

    if (!req.session.user) {
        return res.status(401).json({error: 'You must be logged in to update an event'});
    }

    let eventInfo = req.body;
    if (!eventInfo || typeof eventInfo !== 'object' || Array.isArray(eventInfo)) {
        return res.status(400).json({error: 'You must provide update data'});
    }
    if (Object.keys(eventInfo).length === 0) {
        return res.status(400).json({error: 'No fields provided'});
    }

    try {
        const existingEvent = await eventData.getEventById(id);
        if (existingEvent.createdBy && existingEvent.createdBy.toString() !== req.session.user._id && !req.session.user.isAdmin) {
            return res.status(403).json({error: 'You do not have permission to update this event'});
        }
        const updatedEvent = await eventData.updateEvent(id, eventInfo);
        return res.json(updatedEvent);
    } catch (e) {
        return res.status(400).json({error: e.message || e.toString()});
    }
});

// DELETE event
router.route('/:id').delete(async (req, res) => {
    let id;
    try {
        id = validation.checkId(req.params.id, 'Event ID');
    } catch (e) {
        return res.status(400).json({error: e.message || e.toString()});
    }
    if (!req.session.user) {
        return res.status(401).json({error: 'You must be logged in to delete an event'});
    }
    try {
        const existingEvent = await eventData.getEventById(id);
        if (existingEvent.createdBy && existingEvent.createdBy.toString() !== req.session.user._id && !req.session.user.isAdmin) {
            return res.status(403).json({error: 'You do not have permission to delete this event'});
        }
        const deletedEvent = await eventData.deleteEvent(id);
        if (existingEvent.createdBy) {
            await userData.removeCreatedEvent(existingEvent.createdBy.toString(), id);
        }
        return res.json({deleted: true, event: deletedEvent});
    } catch (e) {
        return res.status(404).json({error: e.message || e.toString()});
    }
});

// ADD linke
router.route('/:id/like').post(async (req, res) => {
    let id;
    try {
        id = validation.checkId(req.params.id, 'Event ID');
    } catch (e) {
        return res.status(400).json({error: e.message || e.toString()});
    }

    try {
        const updatedEvent = await eventData.likeEvent(id, req.session.user._id);
        res.json({likeCount: updatedEvent.likeCount});
    } catch (e) {
        res.status(400).json({error: e.message || e.toString()});
    }
});

// SAVE event to user's calendar
router.route('/:id/save').post(async (req, res) => {
    let id;
    try {
        id = validation.checkId(req.params.id, 'Event ID');
    } catch (e) {
        return res.status(400).json({error: e.message || e.toString()});
    }

    if (!req.session.user) {
        return res.status(401).json({error: 'You must be logged in to save an event'});
    }

    try {
        await eventData.getEventById(id);
        const updatedUser = await userData.addSavedEvent(req.session.user._id, id);
        return res.json({saved: true, savedEvents: updatedUser.savedEvents});
    } catch (e) {
        return res.status(400).json({error: e.message || e.toString()});
    }
});

// REMOVE event from user's calendar
router.route('/:id/save').delete(async (req, res) => {
    let id;
    try {
        id = validation.checkId(req.params.id, 'Event ID');
    } catch (e) {
        return res.status(400).json({error: e.message || e.toString()});
    }

    if (!req.session.user) {
        return res.status(401).json({error: 'You must be logged in to remove a saved event'});
    }

    try {
        await eventData.getEventById(id);
        const updatedUser = await userData.removeSavedEvent(req.session.user._id, id);
        return res.json({removed: true, savedEvents: updatedUser.savedEvents});
    } catch (e) {
        return res.status(400).json({error: e.message || e.toString()});
    }
});

export default router;