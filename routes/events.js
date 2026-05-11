/* This is our events.js file */

import {Router} from 'express';
import * as eventData from '../data/events.js';
import * as validation from '../helper.js';
import { getSavedEventIds, attachIsSaved } from '../helper.js';
import userData from '../data/users.js';
import dotenv from 'dotenv';
import {getWeather} from '../data/mapbox.js';

dotenv.config();

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;

const router = Router();

router.get('/home', async (req, res) => {
    
    try {
      const allEvents = await eventData.getAllEvents();
      const savedIds = req.session.user ? await getSavedEventIds(req.session.user, userData) : [];
      const eventsWithSaved = attachIsSaved(allEvents, savedIds);

            const toEventDateTime = (event) => {
                if (!event?.startDate || !event?.startTime) return new Date(event?.startDate);
                return new Date(`${event.startDate} ${event.startTime}`);
            };

      const recEvents = req.session.user  ? eventsWithSaved.filter(e => e.location?.parkNames === req.session.user.borough): [];

      const fullUser = req.session.user ? await userData.getUserById(req.session.user._id): null;
      const now = new Date();
      const nextEvent = fullUser ? eventsWithSaved
        .filter(e => fullUser.savedEvents
          .map(id => id.toString())
          .includes(e._id.toString()) && new Date(e.startDate) >= now)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0]: null;
        
        let reviewQueue = [];
        if (req.session.user) {
            let savedEventIds = await getSavedEventIds(req.session.user, userData);
            for (let eventId of savedEventIds) {
                const event = await eventData.getEventById(eventId);
                const isPastEvent = new Date(event.endDate) < new Date();
                const hasCheckedIn = event.checkedInList?.some((id) => {
                    return id.toString() === req.session.user._id.toString();
                });
                const hasReviewed = event.reviewList?.some((review) => {
                    return review.userID.toString() === req.session.user._id.toString();
                });
                if (isPastEvent && hasCheckedIn && !hasReviewed) {
                    reviewQueue.push(event);
                }
            }
        }
        let hasCheckedIn = false;
        if (nextEvent && Array.isArray(nextEvent.checkedInList)) {
            hasCheckedIn = nextEvent.checkedInList.some((id) => id.toString() === req.session.user._id);
        }

        const userBorough = req.session.user?.borough || req.query.borough || 'Manhattan';
        const todayByBorough = await eventData.getEventsByBorough(userBorough);

        const today = new Date().toISOString().split('T')[0];
            
        let weather = null;
        try {
            weather = await getWeather(userBorough);
        } catch {
            weather = null;
        }

      return res.render('home', {
        user: req.session.user||null,
        nextEvent,
        recEvents,
        reviewQueue,
        hasCheckedIn,
        todayByBorough,
        today,
        selectedBorough: userBorough,
        weather
      });
    } catch(e) {
      return res.status(500).send(e.toString());
    }
  //} else {
    //return res.redirect('/users/login'); // redirect doesn't take second argument
  //}

});

router.get('/create', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/users/login');
    }
    return res.render('create');
});

//GET for search route
router.get('/search', async (req, res) => {
    let { q, sortBy = 'startDate', order = 'asc', borough, eventType } = req.query;

    try {
        let results;
        if (q && q.trim()) {
            results = await eventData.searchEvents(q.trim());
        } else if(borough){
            results = await eventData.getEventsByBorough(borough);
        }else{
            results = await eventData.getSortedEvents({sortBy, order, eventType});
        }

        const savedIds = await getSavedEventIds(req.session.user, userData);
        results = attachIsSaved(results, savedIds);

        return res.render('search', {user: req.session.user, results, query: q, selectedBorough: borough, selectedType: eventType, sortBy, order, boroughSearch: !!borough});

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
        return res.status(500).render('error', {error: e.message || e.toString()});
    }
});

// GET event by id
router.route('/:id').get(async (req, res) => {
    let id;
    try {
        id = validation.checkId(req.params.id, 'Event ID');
    } catch (e) {
        return res.status(400).render('error', {error: e.message || e.toString()});
    }

    try {
        const event = await eventData.getEventById(id);
        if (!event) {
            return res.status(404).render('error', {error: 'Event not found'});
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
        if(event.createdBy) {
            var author = await userData.getUserById(event.createdBy);
        }
        let hasCheckedIn = false;
        if (req.session.user && Array.isArray(event.checkedInList)) {
            hasCheckedIn = event.checkedInList.some((id) => id.toString() === req.session.user._id);
        }
        let canReview = false;
        if (req.session.user && event.checkedInList && Array.isArray(event.checkedInList) && event.checkedInList.some((id) => id.toString() === req.session.user._id)) {
            if (event.reviewList && Array.isArray(event.reviewList) && event.reviewList.every((r) => r.userID.toString() !== req.session.user._id) && new Date(event.endDate) < new Date()) {
                canReview = true;
            }
        }

        let weather = null;
        try {
            weather = await getWeather(event.location?.borough);
        } catch {
            weather = null;
        }
        
        let currentLocation = null;
        try {
            if (req.session.user) {
                const fullUser = await userData.getUserById(req.session.user._id);
                currentLocation = fullUser.currentLocation || null;
            }
        } catch {
            currentLocation = null;
}

        return res.render('event', { event, isSaved, hasReported, hasLiked, hasDisliked, isAuthor, author, hasCheckedIn, canReview, mapboxToken: MAPBOX_TOKEN, weather, currentLocation});
    } catch (e) {
        return res.status(404).render('error', {error: e.message || e.toString()});
    }
});

// POST event
router.route('/').post(async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/users/login');
    }

    let eventInfo = req.body;

    if (!eventInfo || typeof eventInfo !== 'object' || Array.isArray(eventInfo)) {
        return res.status(400).render('error', {error: 'You must provide event data'});
    }
    if (Object.keys(eventInfo).length === 0) {
        return res.status(400).render('error', {error: 'No data provided'});
    }
    // restructure location from flat form data into nested object
    const { parkNames, location, coordinates, ...rest } = eventInfo;
    let hostedBy = req.session.user.username;
    let createdBy = req.session.user._id;

    try{
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
        eventInfo.hostedBy = req.session.user.username;
        eventInfo.createdBy = req.session.user._id;
        
        await userData.addCreatedEvent(
            req.session.user._id,
            newEvent._id.toString()
        );
        return res.redirect(`/events/${newEvent._id}`);
    } catch (e) {
        return res.status(500).render('error', { error: e.message || e.toString() });
        // return res.status(400).json({error: e.message || e.toString()});
    }
});

// PATCH event
router.route('/:id').patch(async (req, res) => {
    let id;
    try {
        id = validation.checkId(req.params.id, 'Event ID');
    } catch (e) {
        return res.status(400).render('error', {error: e.message || e.toString()});
    }

    if (!req.session.user) {
        return res.status(401).render('error', {error: 'You must be logged in to update an event'});
    }

    let eventInfo = req.body;
    if (!eventInfo || typeof eventInfo !== 'object' || Array.isArray(eventInfo)) {
        return res.status(400).render('error', {error: 'You must provide update data'});
    }
    if (Object.keys(eventInfo).length === 0) {
        return res.status(400).render('error', {error: 'No fields provided'});
    }

    try {
        const existingEvent = await eventData.getEventById(id);
        if (existingEvent.createdBy && existingEvent.createdBy.toString() !== req.session.user._id && !req.session.user.isAdmin) {
            return res.status(403).render('error', {error: 'You do not have permission to update this event'});
        }
        const updatedEvent = await eventData.updateEvent(id, eventInfo);
        return res.redirect(`/events/${id}`);
    } catch (e) {
        return res.status(400).render('error', {error: e.message || e.toString()});
    }
});

// DELETE event
router.route('/:id').delete(async (req, res) => {
    let id;
    try {
        id = validation.checkId(req.params.id, 'Event ID');
    } catch (e) {
        return res.status(400).render('error', {error: e.message || e.toString()});
    }
    if (!req.session.user) {
        return res.status(401).render('error', {error: 'You must be logged in to delete an event'});
    }
    try {
        const existingEvent = await eventData.getEventById(id);
        if (existingEvent.createdBy && existingEvent.createdBy.toString() !== req.session.user._id && !req.session.user.isAdmin) {
            return res.status(403).render('error', {error: 'You do not have permission to delete this event'});
        }
        const deletedEvent = await eventData.deleteEvent(id);
        if (existingEvent.createdBy) {
            await userData.removeCreatedEvent(existingEvent.createdBy.toString(), id);
        }
        return res.redirect('/events/home');
    } catch (e) {
        return res.status(404).render('error', {error: e.message || e.toString()});
    }
});

// ADD linke
router.route('/:id/like').post(async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/users/login');
    }
    let id;
    try {
        id = validation.checkId(req.params.id, 'Event ID');
    } catch (e) {
        return res.status(400).render('error', {error: e.message || e.toString()});
    }
    let data = await eventData.getEventById(id);
    if (!data) {
        return res.status(404).render('error', {error: 'Event not found'});
    }
    if (!req.session.user) {
        return res.status(401).render('error', {error: 'You must be logged in to like an event'});
    }
    let event = await eventData.getEventById(id);
    if (!event) {
        return res.status(404).render('error', {error: 'Event not found'});
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
        return res.status(400).render('error', {error: e.message || e.toString()});
    }
});

// Remove like
router.route('/:id/unlike').post(async (req, res) => {
    let id; 
    try {
        id = validation.checkId(req.params.id, 'Event ID');
    } catch (e) {
        return res.status(400).render('error', {error: e.message || e.toString()});
    }
    if (!req.session.user) {
        return res.status(401).render('error', {error: 'You must be logged in to unlike an event'});
    }
    let event = await eventData.getEventById(id);
    if (!event) {
        return res.status(404).render('error', {error: 'Event not found'});
    }
    if (!event.likedBy || !event.likedBy.some((id) => id.toString() === req.session.user._id)) {
        return res.redirect(`/events/${id}`);
    }

    try {
        await eventData.unlikeEvent(id, req.session.user._id);
        //reload the event page to show updated like count
        return res.redirect(`/events/${id}`);
    } catch (e) {
        return res.status(400).render('error', {error: e.message || e.toString()});
    }
});

// Add dislike
router.route('/:id/dislike').post(async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/users/login');
    }
    let id;
    try {
        id = validation.checkId(req.params.id, 'Event ID');
    } catch (e) {
        return res.status(400).render('error', {error: e.message || e.toString()});
    }
    let event = await eventData.getEventById(id);
    if (!event) {
        return res.status(404).render('error', {error: 'Event not found'});
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
        return res.status(400).render('error', {error: e.message || e.toString()});
    }
});

// Remove dislike
router.route('/:id/undislike').post(async (req, res) => {
        let id;
    try {
        id = validation.checkId(req.params.id, 'Event ID');
    } catch (e) {
        return res.status(400).render('error', {error: e.message || e.toString()});
    }
    if (!req.session.user) {
        return res.status(401).render('error', {error: 'You must be logged in to dislike an event'});
    }
    let event = await eventData.getEventById(id);
    if (!event) {
        return res.status(404).render('error', {error: 'Event not found'});
    }
    if (!event.dislikedBy || !event.dislikedBy.some((id) => id.toString() === req.session.user._id)) {
        return res.redirect(`/events/${id}`);
    }

    try {
        await eventData.undislikeEvent(id, req.session.user._id);
        //reload the event page to show updated dislike count
        return res.redirect(`/events/${id}`);
    } catch (e) {
        return res.status(400).render('error', {error: e.message || e.toString()});
    }
});

// SAVE
router.post('/:id/save', async (req, res) => {
  if (!req.session.user) return res.redirect('/users/login');

  const id = validation.checkId(req.params.id);

  try {
    await userData.addSavedEvent(req.session.user._id, id);
    return res.redirect(`/events/search`);
  } catch (e) {
    return res.status(400).render('error', { error: e.toString() });
  }
});

// UNSAVE
router.post('/:id/unsave', async (req, res) => {
  if (!req.session.user) return res.redirect('/users/login');

  const id = validation.checkId(req.params.id);

  try {
    await userData.removeSavedEvent(req.session.user._id, id);
    return res.redirect(`/events/search`);
  } catch (e) {
    return res.status(400).render('error', { error: e.toString() });
  }
});

//Report event
router.patch('/:id/report', async (req, res) => {
  if (!req.session.user) return res.redirect('/users/login');

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
  if (!req.session.user) return res.redirect('/users/login');
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
    if (!req.session.user) return res.redirect('/users/login');

    try {
        const id = validation.checkId(req.params.id);
        const textContent = validation.checkString(req.body.commentInput, 'Comment');

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
            return res.status(400).render('error', { error: e.message || e.toString() });
        }
        return res.status(400).render('error', { error: e.toString() });
    }
});

//Remove comment
router.route('/:eventId/comment/:commentId').delete(async (req, res) => {
    if (!req.session.user) return res.redirect('/users/login');

    const eventId = validation.checkId(req.params.eventId);
    const commentId = validation.checkId(req.params.commentId);

    try {
        await eventData.removeComment(eventId, commentId, req.session.user._id);
        return res.redirect(`/events/${eventId}`);
    } catch (e) {
        return res.status(400).render('error', { error: e.toString() });
    }
});

//GET review form
router.get('/:id/reviews', async (req, res) => {
    if (!req.session.user) return res.redirect('/users/login');

    let id;
    try {
        id = validation.checkId(req.params.id, 'Event ID');
    } catch (e) {
        return res.status(400).render('error', {error: e.message || e.toString()});
    }

    try {
        const event = await eventData.getEventById(id);
        return res.render('review', {event: event});
    } catch (e) {
        return res.status(404).render('error', {error: e.message || e.toString()});
    }
});

//POST review
router.post('/:eventId/reviews', async (req, res) => {
    if (!req.session.user) return res.redirect('/users/login');

     let id;
    try {
        id = validation.checkId(req.params.eventId, 'Event ID');
    } catch (e) {
        return res.status(400).render('error', {error: e.message || e.toString()});
    }

    try {
        const rating = parseInt(req.body.rating);
        const reviewText = validation.checkString(req.body.reviewText, 'Review');

        await eventData.addReview(
            id,
            req.session.user._id,
            req.session.user.username,
            rating,
            reviewText
        );

        return res.redirect(`/events/${id}`);
    } catch (e) {
        if (req.headers.accept?.includes('application/json')) {
            return res.status(400).render('error', { error: e.message || e.toString() });
        }
        return res.status(400).render('error', { error: e.toString() });
    }
});

//Check in 
router.post('/:id/checkin', async (req, res) => {
  if (!req.session.user) return res.redirect('/users/login');

    const id = validation.checkId(req.params.id);

    try {
        await eventData.checkInEvent(id, req.session.user._id);
        return res.redirect(`/events/${id}`);
    } catch (e) {
        return res.status(400).render('error', { error: e.toString() });
    }
});

export default router;