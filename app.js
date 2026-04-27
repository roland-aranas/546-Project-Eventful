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

const app = express();

app.use('public', express.static('public'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

configRoutes(app);

app.listen(3000, ()=> {
    console.log('ParkParty running on http://localhost:3000');
});
