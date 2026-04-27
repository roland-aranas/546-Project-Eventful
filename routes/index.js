/* This is our index.js file */

import userRoutes from './users.js';
import eventRoutes from './events.js';

const constructorMethod = (app) => {
  app.use('/users', userRoutes);
  app.use('/events', eventRoutes);

  app.use(/(.*)/, (req, res) => {
    return res.status(404).json({ error: 'Not found' });
  });
};

export default constructorMethod;