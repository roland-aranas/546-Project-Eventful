/* This is our events.js file */

import {Router} from 'express';
import * as eventData from '../data/events.js';
import * as validation from '../helper.js';
import { getSavedEventIds, attachIsSaved } from '../helper.js';
import userData from '../data/users.js';
import { geocodeLocation } from '../data/mapbox.js';
import dotenv from 'dotenv';

dotenv.config();

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;

const router = Router();

router.get('/home', async (req, res) => {
    // const events = await eventData.getAllEvents();

    // return res.render('home', {
    //     user: req.session.user,
    //     recEvents: events
    // });

    if (req.session.user) {
    try {
      const allEvents = await eventData.getAllEvents();
      const savedIds = await getSavedEventIds(req.session.user, userData);
      const eventsWithSaved = attachIsSaved(allEvents, savedIds);

      const recEvents = eventsWithSaved.filter(e => 
        e.location.parkNames === req.session.user.borough
      );

      const fullUser = await userData.getUserById(req.session.user._id);
      const now = new Date();
      const nextEvent = eventsWithSaved
        .filter(e => fullUser.savedEvents
          .map(id => id.toString())
          .includes(e._id.toString()) && new Date(e.startDate) >= now)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0];

      return res.render('home', {
        user: req.session.user,
        nextEvent,
        recEvents
      });
    } catch(e) {
      return res.status(500).send(e.toString());
    }
  } else {
    return res.redirect('/users/login'); // redirect doesn't take second argument
  }

});

router.get('/create', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/users/login');
    }
    return res.render('create');
});

//GET for search route
router.get('/search', async (req, res) => {
    let { q, sortBy, order, borough, eventType } = req.query;

    try {
        let results;

        if (q && q.trim()) {
            results = await eventData.searchEvents(q.trim());
        } else {
            results = await eventData.getSortedEvents({sortBy, order, borough, eventType});
        }

        const savedIds = await getSavedEventIds(req.session.user, userData);
        results = attachIsSaved(results, savedIds);

        return res.render('search', {user: req.session.user, results, query: q, selectedBorough: borough, selectedType: eventType, sortBy, order});

    } catch (e) {
        res.status(500).send(e.toString());    
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
        if (!event) {
            return res.status(404).json({error: 'Event not found'});
        }
        const savedIds = await getSavedEventIds(req.session.user, userData);
        const isSaved = savedIds.includes(event._id.toString());

        let hasReported = false;
        if (req.session.user && event.reportedBy && Array.isArray(event.reportedBy)) {
            hasReported = event.reportedBy.some((id) => id.toString() === req.session.user._id);
        }

        let hasLiked = false;
        if (req.session.user && event.likedBy && Array.isArray(event.likedBy)) {
            hasLiked = event.likedBy.some((id) => id.toString() === req.session.user._id);
        }

        let hasDisliked = false;
        if (!hasLiked){
            if (req.session.user && event.dislikedBy && Array.isArray(event.dislikedBy)) {
                hasDisliked = event.dislikedBy.some((id) => id.toString() === req.session.user._id);
            }
        }
        let isAuthor = false;
        if (req.session.user && event.createdBy) {
            isAuthor = event.createdBy.toString() === req.session.user._id;
        }

        return res.render('event', { event, isSaved, hasReported, hasLiked, hasDisliked, isAuthor, mapboxToken: MAPBOX_TOKEN});
    } catch (e) {
        return res.status(404).json({error: e || e.toString()});
    }
});

// POST event
router.route('/').post(async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/users/login');
    }

    let eventInfo = req.body;

    if (!eventInfo || typeof eventInfo !== 'object' || Array.isArray(eventInfo)) {
        return res.status(400).json({error: 'You must provide event data'});
    }
    if (Object.keys(eventInfo).length === 0) {
        return res.status(400).json({error: 'No data provided'});
    }
    // restructure location from flat form data into nested object
    const { parkNames, location, coordinates, ...rest } = eventInfo;
    let hostedBy = req.session.user.username;
    let createdBy = req.session.user._id;

    const newEvent = await eventData.createEvent({
      ...rest,
      cost: parseFloat(eventInfo.cost),
      hostedBy,
      createdBy,
      location: {
        parkNames,
        location,
        coordinates
      }
    });


    try {
        eventInfo.hostedBy = req.session.user.username;
        eventInfo.createdBy = req.session.user._id;
        
        await userData.addCreatedEvent(
            req.session.user._id,
            newEvent._id.toString()
        );
        return res.redirect(`/events/${newEvent._id}`);
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
        return res.redirect(`/events/${id}`);
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
        return res.redirect('/events/home');
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
    let data = await eventData.getEventById(id);
    if (!data) {
        return res.status(404).json({error: 'Event not found'});
    }
    if (!req.session.user) {
        return res.status(401).json({error: 'You must be logged in to like an event'});
    }
    let event = await eventData.getEventById(id);
    if (!event) {
        return res.status(404).json({error: 'Event not found'});
    }
    if (event.likedBy && event.likedBy.some((id) => id.toString() === req.session.user._id)) {
        return res.redirect(`/events/${id}`);
    }

    try {
        if (event.dislikedBy && event.dislikedBy.some((id) => id.toString() === req.session.user._id)) {
            await eventData.undislikeEvent(id, req.session.user._id);
        }
        await eventData.likeEvent(id, req.session.user._id);
        //reload the event page to show updated like count
        return res.redirect(`/events/${id}`);
    } catch (e) {
        res.status(400).json({error: e.message || e.toString()});
    }
});

// Remove like
router.route('/:id/unlike').post(async (req, res) => {
    let id; 
    try {
        id = validation.checkId(req.params.id, 'Event ID');
    } catch (e) {
        return res.status(400).json({error: e.message || e.toString()});
    }
    if (!req.session.user) {
        return res.status(401).json({error: 'You must be logged in to unlike an event'});
    }
    let event = await eventData.getEventById(id);
    if (!event) {
        return res.status(404).json({error: 'Event not found'});
    }
    if (!event.likedBy || !event.likedBy.some((id) => id.toString() === req.session.user._id)) {
        return res.redirect(`/events/${id}`);
    }

    try {
        await eventData.unlikeEvent(id, req.session.user._id);
        //reload the event page to show updated like count
        return res.redirect(`/events/${id}`);
    } catch (e) {
        res.status(400).json({error: e.message || e.toString()});
    }
});

// Add dislike
router.route('/:id/dislike').post(async (req, res) => {
    let id;
    try {
        id = validation.checkId(req.params.id, 'Event ID');
    } catch (e) {
        return res.status(400).json({error: e.message || e.toString()});
    }
    if (!req.session.user) {
        return res.status(401).json({error: 'You must be logged in to dislike an event'});
    }
    let event = await eventData.getEventById(id);
    if (!event) {
        return res.status(404).json({error: 'Event not found'});
    }
    if (event.dislikedBy && event.dislikedBy.some((id) => id.toString() === req.session.user._id)) {
        return res.redirect(`/events/${id}`);
    }

    try {
        if (event.likedBy && event.likedBy.some((id) => id.toString() === req.session.user._id)) {
            await eventData.unlikeEvent(id, req.session.user._id);
        }
        await eventData.dislikeEvent(id, req.session.user._id);
        //reload the event page to show updated dislike count
        return res.redirect(`/events/${id}`);
    } catch (e) {
        res.status(400).json({error: e.message || e.toString()});
    }
});

// Remove dislike
router.route('/:id/undislike').post(async (req, res) => {
        let id;
    try {
        id = validation.checkId(req.params.id, 'Event ID');
    } catch (e) {
        return res.status(400).json({error: e.message || e.toString()});
    }
    if (!req.session.user) {
        return res.status(401).json({error: 'You must be logged in to dislike an event'});
    }
    let event = await eventData.getEventById(id);
    if (!event) {
        return res.status(404).json({error: 'Event not found'});
    }
    if (!event.dislikedBy || !event.dislikedBy.some((id) => id.toString() === req.session.user._id)) {
        return res.redirect(`/events/${id}`);
    }

    try {
        await eventData.undislikeEvent(id, req.session.user._id);
        //reload the event page to show updated dislike count
        return res.redirect(`/events/${id}`);
    } catch (e) {
        res.status(400).json({error: e.message || e.toString()});
    }
});

// SAVE
router.post('/:id/save', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const id = validation.checkId(req.params.id);

  try {
    await userData.addSavedEvent(req.session.user._id, id);
    return res.redirect(`/events/${id}`);
  } catch (e) {
    return res.status(400).render('error', { error: e.toString() });
  }
});

// UNSAVE
router.post('/:id/unsave', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const id = validation.checkId(req.params.id);

  try {
    await userData.removeSavedEvent(req.session.user._id, id);
    return res.redirect(`/events/${id}`);
  } catch (e) {
    return res.status(400).render('error', { error: e.toString() });
  }
});

//Report event
router.patch('/:id/report', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const id = validation.checkId(req.params.id);

  try {
    await eventData.reportEvent(id, req.session.user._id);
    return res.redirect(`/events/${id}`);
  } catch (e) {
    return res.status(400).render('error', { error: e.toString() });
  }
});

//Admin review event
router.patch('/:id/review', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  if (!req.session.user.isAdmin) return res.status(403).render('error', {error: 'You do not have permission to perform this action'});

  const id = validation.checkId(req.params.id);
  
  try {
    await eventData.reviewEvent(id);
    return res.render('admin', {successMessage: 'Event marked as reviewed'});
  } catch (e) {
    return res.status(400).render('error', { error: e.toString() });
  }
});

//Add comment
router.post('/:id/comment', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const id = validation.checkId(req.params.id);
    const textContent = validation.checkString(req.body.commentInput, 'Comment');

    try {
        const newComment = await eventData.addComment(id, req.session.user._id, textContent);
        let username = null;
        try {
            const fullUser = await userData.getUserById(req.session.user._id);
            username = fullUser.username;
        } catch (ue) {
            username = req.session.user.username || null;
        }

        return res.redirect(`/events/${id}`);
    } catch (e) {
        if (req.headers.accept?.includes('application/json')) {
            return res.status(400).json({ success: false, error: e.message || e.toString() });
        }
        return res.status(400).render('error', { error: e.toString() });
    }
});

//Remove comment
router.route('/:eventId/comment/:commentId').delete(async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const eventId = validation.checkId(req.params.eventId);
    const commentId = validation.checkId(req.params.commentId);

    try {
        await eventData.removeComment(eventId, commentId, req.session.user._id);
        return res.redirect(`/events/${eventId}`);
    } catch (e) {
        return res.status(400).render('error', { error: e.toString() });
    }
});

export default router;