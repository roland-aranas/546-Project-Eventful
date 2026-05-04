/* This is our index.js file */

import userRoutes from './users.js';
import eventRoutes from './events.js';

const constructorMethod = (app) => {
  app.get('/', (req, res) => {
    if (!req.session.user) {
      return res.redirect('/users/signup');
    }

    if (req.session.user.isAdmin) {
      return res.redirect('/users/admin');
    }
    
    return res.redirect(`/users/${req.session.user._id}`);
  });

  app.use('/users', userRoutes);
  app.use('/events', eventRoutes);

  app.use(/(.*)/, (req, res) => {
    return res.status(404).json({ error: 'Not found' });
  });
};

export default constructorMethod;