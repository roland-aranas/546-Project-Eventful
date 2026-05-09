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
console.log('1 - before imports');
import configRoutes from './routes/index.js';
import express from 'express';
import { engine } from "express-handlebars";
import session from 'express-session';
import dotenv from "dotenv";
// import eventRoutes from './routes/events.js';
console.log('2 - after imports');

dotenv.config();
const app = express();

const rewriteUnsupportedBrowserMethods = (req, res, next) => {
  // If the user posts to the server with a property called _method, rewrite the request's method
  // To be that method; so if they post _method=PUT you can now allow browsers to POST to a route that gets
  // rewritten in this middleware to a PUT route
  if (req.body && req.body._method) {
    req.method = req.body._method;
    delete req.body._method;
  }
    next();
};


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

app.use(rewriteUnsupportedBrowserMethods);

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
