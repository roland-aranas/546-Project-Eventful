import {ObjectId} from 'mongodb';
import { getEventById } from './events.js';

const buildLocationObject = (location, parknames, coordinates) => {
    if (!location || typeof location !== 'object' || Array.isArray(location)) {
        throw 'Error: You must provide a valid location object';
    }

    const locationObject = {
        parknames: location.parknames ?? parknames,
        location: location.location,
        coordinates: location.coordinates ?? coordinates
    };

    if (!locationObject.parknames || typeof locationObject.parknames !== 'string') {
        throw 'Error: You must provide a valid parknames';
    }
    if (!locationObject.location || typeof locationObject.location !== 'string') {
        throw 'Error: You must provide a valid location';
    }
    if (!locationObject.coordinates || typeof locationObject.coordinates !== 'string') {
        throw 'Error: You must provide a valid coordinates';
    }

    locationObject.parknames = locationObject.parknames.trim();
    locationObject.location = locationObject.location.trim();
    locationObject.coordinates = locationObject.coordinates.trim();

    return locationObject;
};



export { buildLocationObject };