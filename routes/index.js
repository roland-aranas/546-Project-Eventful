/* This is our index.js file */

import userRoutes from './users.js';
import eventRoutes from './events.js';

const constructorMethod = (app) => {
  app.get('/', (req, res) => {
    if (!req.session.user) {
      return res.redirect('/users/login');
    }
    return res.redirect('/events/home');
  });

  app.use('/users', userRoutes);
  app.use('/events', eventRoutes);

  app.use(/(.*)/, (req, res) => {
    return res.status(404).render('error', { error: 'Not found' });
  });
};

export default constructorMethod;