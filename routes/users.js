/* This is our users.js file */

import {Router} from 'express';

const router = Router();

router.route('/').get(async (req, res) => {
  return res.json({message: 'users route works'});
});

export default router;