/* This is our users.js file */

import {Router} from 'express';
import bcrypt from 'bcrypt';
import { users } from '../config/mongoCollections.js';

const router = Router();

router.route('/').get(async (req, res) => {
  return res.json({message: 'users route works'});
});

// GET /users/login - show login form
router.get('/login', (req, res) => {
  res.render('login');
});

// POST /users/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const usersCollection = await users();
    const user = await usersCollection.findOne({ username });
    if (!user) return res.render('login', { error: 'User not found' });
    
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.render('login', { error: 'Invalid password' });
   
    req.session.user = user;
    res.redirect('/');
  } catch (e) {
    res.status(500).render('error', { error: e.message });
  }
});

// POST /users/logout
router.post('/logout', async (req, res) => {
  req.session.destroy();
  res.redirect('/users/login');
});

// GET /users/signup 
router.get('/signup', (req, res) => {
  res.render('signup');
});

// POST /users/signup 
router.post('/signup', async (req, res) => {
  const { firstName, lastName, age, email, username, password, borough } = req.body;

  try {
    const newUser = await exportedMethods.createUser({
      firstName,
      lastName,
      age: parseInt(age),
      email,
      username,
      password,
      borough
    });
    req.session.user = newUser;
    res.redirect('/');
  } catch (e) {
    res.render('register', { error: e });
  }
});

//GET /users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await exportedMethods.getUserById(req.params.id);
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

    res.render('profile', {
      user,
      plannedEvents,
      pastEvents,
      createdEvents: createdEventDocs,
      isOwnProfile: req.session.user._id.toString() === req.params.id
    });
  } catch (e){
    res.status(404).render('error', { error: e });
  }
});




export default router;