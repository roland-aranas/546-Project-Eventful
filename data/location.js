import {ObjectId} from 'mongodb';
import { getEventById } from './events.js';

const buildLocationObject = (location, parknames, coordinates, borough) => {
    if (!location || typeof location !== 'object' || Array.isArray(location)) {
        throw 'Error: You must provide a valid location object';
    }

    const locationObject = {
        parknames: location.parknames ?? parknames,
        location: location.location,
        coordinates: location.coordinates ?? coordinates, 
        borough: location.borough ?? borough
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
    if (!locationObject.borough || typeof locationObject.borough !== 'string') {
        throw 'Error: You must provide a valid coordinates';
    }

    locationObject.parknames = locationObject.parknames.trim();
    locationObject.location = locationObject.location.trim();
    locationObject.coordinates = locationObject.coordinates.trim();
    locationObject.borough = locationObject.borough.trim();

    return locationObject;
};



export { buildLocationObject };