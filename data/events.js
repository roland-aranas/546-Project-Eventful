import {getApiData} from '../getData.js';
import {events} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';

async function getAllEvents() {
    const eventCollection = await events();
    let eventList = await eventCollection.find({}).toArray();

    if (eventList.length === 0) {
        const data = await getApiData();
        if (!Array.isArray(data)) throw 'Could not get API event data';

        if (data.length > 0) {
            for (let i of data) {
                i.cost = 0;
                i.eventType = null;
                i.comments = [];
                i.likeCount = 0;
                i.reviewList = [];
                i.checkedInList = [];
                i.registeredList = [];
            }
            await eventCollection.insertMany(data);
            eventList = await eventCollection.find({}).toArray();
        }
    }

    return eventList;
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

export {getAllEvents, getEventById};