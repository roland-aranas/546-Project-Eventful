import {ObjectId} from 'mongodb';
import { getEventById } from './events.js';

const buildLocationObject = (location, parknames, coordinates, borough) => {
    if (!location || typeof location !== 'string') {
        throw 'Error: You must provide a valid location string';
    }
    
    if (!parknames || typeof parknames !== 'string') {
        throw 'Error: You must provide a valid parknames';
    }
    
    if (!coordinates || typeof coordinates !== 'object') {
        throw 'Error: You must provide valid coordinates';
    }
    
    if (typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
        throw 'Error: Coordinates must include numeric lat and lng';
    }
    
    if (borough && typeof borough !== 'string') {
        throw 'Error: Borough must be a string';
    }
    
    return {
        parknames: parknames.trim(),
        location: location.trim(),
        borough: borough ? borough.trim() : null,
        coordinates: {
            lat: coordinates.lat,
            lng: coordinates.lng
        }
    };
};



export { buildLocationObject };