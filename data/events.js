import {ObjectId} from 'mongodb';
import { buildLocationObject } from './location.js';


async function getAllEvents() {
    const eventCollection = await events();
    return await eventCollection.find({}).toArray();
}

async function getEventById(id) {
    if (!id || typeof id !== 'string' || !ObjectId.isValid(id)) {
        throw 'Error: You must provide a valid event id';
    }

    const eventCollection = await events();
    const event = await eventCollection.findOne({_id: new ObjectId(id)});
    if (!event) throw 'Error: Event not found';

    return event;
}

async function createEvent({
    title,
    link,
    description,
    registration_url,
    registration_description,
    parknames,
    startdate,
    enddate,
    contact_phone,
    location,
    coordinates,
    image
}) {
    if (!title || typeof title !== 'string') {
        throw 'Error: You must provide a valid title';
    }
    if (!link || typeof link !== 'string') {
        throw 'Error: You must provide a valid link';
    }
    if (!description || typeof description !== 'string') {
        throw 'Error: You must provide a valid description';
    }
    if (!registration_url || typeof registration_url !== 'string') {
        throw 'Error: You must provide a valid registration_url';
    }
    if (!registration_description || typeof registration_description !== 'string') {
        throw 'Error: You must provide a valid registration_description';
    }
    if (!parknames || typeof parknames !== 'string') {
        throw 'Error: You must provide a valid parknames';
    }
    if (!startdate || typeof startdate !== 'string') {
        throw 'Error: You must provide a valid startdate';
    }
    if (!enddate || typeof enddate !== 'string') {
        throw 'Error: You must provide a valid enddate';
    }
    if (!contact_phone || typeof contact_phone !== 'string') {
        throw 'Error: You must provide a valid contact_phone';
    }
    if (!location || typeof location !== 'object' || Array.isArray(location)) {
        throw 'Error: You must provide a valid location object';
    }
    if (!image || typeof image !== 'string') {
        throw 'Error: You must provide a valid image';
    }

    let eventCollection = await events();
    title = title.trim();
    link = link.trim()
    description = description.trim();
    registration_url = registration_url.trim()
    registration_description = registration_description.trim()
    parknames = parknames.trim()
    startdate = startdate.trim()
    enddate = enddate.trim()
    contact_phone = contact_phone.trim()
    image = image.trim()

    const normalizedLocation = buildLocationObject(location, parknames, coordinates);
    
    const newEvent = {
        title,
        link,
        description,
        registration_url,
        registration_description,
        startdate,
        enddate,
        contact_phone,
        location: normalizedLocation,
        image,
        cost: 0,
        eventType: null,
        comments: [],
        likeCount: 0,
        reviewList: [],
        checkedInList: [],
        registeredList: []
    };
    const result = await eventCollection.insertOne(newEvent);
    eventCollection = await events();
    return getEventById(result.insertedId.toString());
}

async function updateEvent(id, updates){
    if (!id || typeof id !== 'string' || !ObjectId.isValid(id)) {
        throw 'Error: You must provide a valid event id';
    }
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
        throw 'Error: You must provide a valid updates object';
    }
    for(let key of Object.keys(updates)){
        if (key === 'location') {
            if (typeof updates[key] !== 'object' || Array.isArray(updates[key]) || updates[key] === null) {
                throw 'Error: Update value for location must be an object';
            }
            continue;
        }
        if(typeof updates[key] !== 'string' && key !== 'cost' && key !== 'likeCount' && key !== 'comments' && key !== 'reviewList' && key !== 'checkedInList' && key !== 'registeredList') {
            throw `Error: Update value for ${key} must be a string`;
        }
        if((key === 'cost' || key === 'likeCount') && typeof updates[key] !== 'number') {
            throw `Error: Update value for ${key} must be a number`;
        }
        if((key === 'comments' || key === 'reviewList' || key === 'checkedInList' || key === 'registeredList') && !Array.isArray(updates[key])) {
            throw `Error: Update value for ${key} must be an array`;
        }
    }

    let event_data = await events();
    const existing_event = await event_data.findOne({_id: new ObjectId(id)});
    if (!existing_event) throw 'Error: Event not found';

    
    const update_data = {...updates};
    if (updates.location && typeof updates.location === 'object' && !Array.isArray(updates.location)) {
        update_data.location ={
            parknames: updates.location.parknames ?updates.location.parknames.trim(): existing_event.location?.parknames,
            location: updates.location.location ?updates.location.location.trim() : existing_event.location?.location,
            coordinates: updates.location.coordinates? updates.location.coordinates.trim(): existing_event.location?.coordinates
        };
    }

    if (updates.parknames || updates.coordinates) {
        update_data.location = buildLocationObject(
            {
                ...(update_data.location && typeof update_data.location === 'object' ? update_data.location : existing_event.location),
                location:(update_data.location && update_data.location.location) || existing_event.location?.location
            },
            updates.parknames??existing_event.location.parknames,
            updates.coordinates??existing_event.location.coordinates
        );
    }

    delete update_data.parknames;
    delete update_data.coordinates;

    await event_data.updateOne({_id: new ObjectId(id)}, {$set: update_data});

    let event = await event_data.findOne({_id: new ObjectId(id)});
    return event;
}

async function deleteEvent(id) {
    if (!id || typeof id !== 'string' || !ObjectId.isValid(id)) {
        throw 'Error: You must provide a valid event id';
    }
    let event_data = await events();
    const existingEvent = await event_data.findOne({_id: new ObjectId(id)});
    if (!existingEvent) throw 'Error: Event not found';
    let event = await event_data.findOne({_id: new ObjectId(id)});

    await event_data.deleteOne({_id:new ObjectId(id)});
    return event
}

export {getAllEvents, getEventById, createEvent, updateEvent, deleteEvent};