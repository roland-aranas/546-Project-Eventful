/*ORIGINAL CODE
 // import {getApiData} from './getData.js';
// import {getAllEvents, getEventById} from './data/events.js';
// import {dbConnection,closeConnection} from './config/mongoConnections.js';
// import {initializeCollections} from './config/mongoCollections.js';

// async function main() {
//   //try removing the await keyword and run the application
//     try {
//         console.log("NPM RUN START DOES NOT DO ANYTHING RIGHT NOW. Test the seed file with npm run seed");
//     } catch (e) {
//         console.log(e);
//     } finally {
//         await closeConnection();
//     }
// }

// main();

import configRoutes from './routes/index.js';
import express from 'express';
import { engine } from "express-handlebars";

const app = express();

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

app.use('public', express.static('public'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

configRoutes(app);

app.listen(3000, ()=> {
    console.log('ParkParty running on http://localhost:3000');
}); 
*/


//NEW CODE:
import configRoutes from './routes/index.js';
import express from 'express';
import { engine } from "express-handlebars";
import session from 'express-session';
// import eventRoutes from './routes/events.js';

const app = express();

// app.use('/events', eventRoutes);

app.engine("handlebars", engine({
  helpers: {
    json: (context) => JSON.stringify(context)
  }
}));
app.set("view engine", "handlebars");
app.set("views", "./views");

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  name: 'AuthCookie',
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

app.get('/home', (req, res) => {
    res.redirect('/events/home');
});

configRoutes(app);

app.listen(3000, () => {
  console.log('ParkParty running on http://localhost:3000');
});
