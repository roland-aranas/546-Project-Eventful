/* This is our users.js file */

import {Router} from 'express';
import bcrypt from 'bcrypt';
import {users, events} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';
import userData from '../data/users.js';
import * as validation from '../helper.js';

const router = Router();

//HOME PAGE
router.route('/').get(async (req, res) => {
  try {
    const allUsers = await userData.getAllUsers();
    return res.json(allUsers);
  } catch (e) {
    return res.status(500).json({error: e.message});
  }
});

// GET /users/login - show login form
router.get('/login', (req, res) => {
  return res.render('login');
});

// POST /users/login
router.post('/login', async (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).render('login', {error: 'Invalid request body'});
  }

  let {username, password} = req.body;

  try {
    username = validation.checkString(username, 'Username');
    password = validation.checkString(password, 'Password');

    const usersCollection = await users();
    const user = await usersCollection.findOne({username: username});
    if (!user) return res.status(400).render('login', {error: 'Invalid username or password'});
    
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(400).render('login', {error: 'Invalid username or password'});
   
    req.session.user = {_id: user._id.toString(), username: user.username, firstName: user.firstName, lastName: user.lastName, isAdmin: user.isAdmin, borough: user.borough};
    return res.redirect('/');
  } catch (e) {
    return res.status(400).render('login', { error: e.message || e.toString()});
  }
});

// POST /users/logout
router.post('/logout', (req, res) => {
  if (!req.session) {
    return res.redirect('/users/login');
  }

  req.session.destroy((err) => {
    if (err) {
      return res.status(500).render('error', {
        error: 'Could not log out'
      });
    }

    res.clearCookie('AuthCookie');
    return res.redirect('/users/login');
  });
});

// GET /users/signup 
router.get('/signup', (req, res) => {
  return res.render('signup');
});

// POST /users/signup 
router.post('/signup', async (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).render('signup', {error: 'Invalid request body'});
  }

  const { firstName, lastName, age, email, username, password, borough } = req.body;

  try {
    const parsedAge = parseInt(age);
    if (isNaN(parsedAge)) throw 'Age must be a number';
    if (parsedAge < 13) throw 'You must be at least 13 years old to create an account';
    const newUser = await userData.createUser({
      firstName,
      lastName,
      age: parsedAge,
      email,
      username,
      password,
      borough
    });
    req.session.user = {_id: newUser._id.toString(), username: newUser.username, firstName: newUser.firstName, lastName: newUser.lastName, isAdmin: newUser.isAdmin, borough: newUser.borough};
    return res.redirect('/');
  } catch (e) {
    return res.status(400).render('signup', { error: e });
  }
});


//GET /users/calendar 
router.get('/calendar', async (req, res) => {
  try {
    const currentUser = req.session.user;
    const eventsCollection = await events(); // move outside if/else
    let savedEventDocs = [];
    let conflictingEvents = [];
    let isLoggedIn = false;

    if (!currentUser) {
      // not logged in - show all events
      savedEventDocs = await eventsCollection.find({
        title: { $not: { $regex: 'cancel', $options: 'i' } },
        description: { $not: { $regex: 'cancel', $options: 'i' } }
    }).toArray();
    } else {
      isLoggedIn = true;
      const fullUser = await userData.getUserById(currentUser._id);
      savedEventDocs = await eventsCollection
        .find({ _id: { $in: fullUser.savedEvents } })
        .toArray();

      // check for conflicts
      for (const event of savedEventDocs) {
        const eventStart = new Date(`${event.startDate}T${validation.convertTimeTo24Hour(event.startTime)}:00`);
        const eventEnd = new Date(`${event.endDate}T${validation.convertTimeTo24Hour(event.endTime)}:00`);
        
        for (const otherEvent of savedEventDocs) {
          if (event._id.toString() === otherEvent._id.toString()) continue;
          
          const otherStart = new Date(`${otherEvent.startDate}T${validation.convertTimeTo24Hour(otherEvent.startTime)}:00`);
          const otherEnd = new Date(`${otherEvent.endDate}T${validation.convertTimeTo24Hour(otherEvent.endTime)}:00`);
          
          if (event.startDate === otherEvent.startDate) {
            if (eventStart < otherEnd && eventEnd > otherStart) {
              conflictingEvents.push(event);
              break;
            }
          }
        }
      }
    }

    res.render('calendar', { 
      savedEvents: savedEventDocs,
      allEvents: await eventsCollection.find({}).toArray(),
      conflicts: conflictingEvents,
      isLoggedIn
    });
  } catch (e) {
    res.status(500).send(e.toString());
  }
});

router.get('/admin', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/users/login');
    }

    if (!req.session.user.isAdmin) {
      return res.status(403).render('error', {error: 'You do not have permission to view this page'});
    }

    const user = await userData.getUserById(req.session.user._id);

    const eventsCollection = await events();
    const reportedEvents = await eventsCollection.find({totalReports: { $gt:2}}).toArray();

    return res.render('admin', {
      reportedEvents: reportedEvents
    });
  } catch (e) {
    return res.status(500).render('error', {error: e.toString()});
  }
});


//GET /users/:id
router.get('/:id', async (req, res) => {
  let id;
  try {
    id = validation.checkId(req.params.id, "User ID");
  } catch (e) {
    return res.status(400).render('error', {error: e.message});
  }

  try {
    const user = await userData.getUserById(id);
    const eventsCollection = await events();
    const savedEventDocs = await eventsCollection
      .find({ _id: { $in: user.savedEvents } })
      .toArray();

    const createdEventDocs = await eventsCollection
      .find({ _id: { $in: user.createdEvents } })
      .toArray();

    const now = new Date();

    const upcomingEvents = savedEventDocs.filter(e => new Date(e.startDate) >= now);
    const pastEvents = savedEventDocs.filter(e => new Date(e.startDate) < now);

    return res.render('profile', {
      user: user,
      upcomingEvents: upcomingEvents,
      pastEvents: pastEvents,
      createdEvents: createdEventDocs,
      isOwnProfile: req.session.user && req.session.user._id.toString() === req.params.id
    });
  } catch (e){
    return res.status(404).render('error', { error: e });
  }
});

//POST new location
router.post('/:id/location/current', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/users/login');
    }

    if (req.session.user._id !== req.params.id) {
      return res.status(403).render('error', {error: 'You do not have permission to view this page'});
    }

    const lat = parseFloat(req.body.lat);
    const lng = parseFloat(req.body.lng);

    //close enough validation for NYC, will be checked again if user tries to find directions
    if (isNaN(lat)|| isNaN(lng)|| lat < 40|| lat > 42|| lng < -75|| lng > -72) {
      return res.status(400).render('error', {error: 'Invalid coordinates'});
    }

    await userData.updateUser(req.params.id, {currentLocation: {lat, lng}});

    return res.redirect(`/users/${req.params.id}`);
  } catch (e) {
    return res.status(500).render('error', {error: e});
  }
});

//POST new favorite location
router.post('/:id/location/favorite', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/users/login');
    }

    if (req.session.user._id !== req.params.id) {
      return res.status(403).render('error', {error: 'You do not have permission to view this page'});
    }

    const lat = parseFloat(req.body.lat);
    const lng = parseFloat(req.body.lng);

    if (isNaN(lat)|| isNaN(lng)|| lat < 40|| lat > 42|| lng < -75|| lng > -72) {
      return res.status(400).render('error', {error: 'Invalid coordinates'});
    }

    const user = await userData.getUserById(req.params.id);
    const locations = [{lat, lng}].concat(user.favoriteLocations || []).slice(0, 3);

    await userData.updateUser(req.params.id, {favoriteLocations: locations});

    return res.redirect(`/users/${req.params.id}`);
  } catch (e) {
    return res.status(500).render('error', {error: e});
  }
});

export default router;