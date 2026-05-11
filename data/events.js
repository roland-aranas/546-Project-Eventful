import {ObjectId} from 'mongodb';
import {events, users, todayEvent} from '../config/mongoCollections.js';
import * as validation from '../helper.js';
import { getBorough } from './mapbox.js';


async function getAllEvents() {
    const eventCollection = await events();
    return await eventCollection.find({
        title: { $not: { $regex: 'cancel', $options: 'i' } },
        description: { $not: { $regex: 'cancel', $options: 'i' } }
     }).toArray();
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
    registrationUrl,
    registrationDescription,
    startDate,
    endDate,
    startTime,
    endTime,
    contactPhone,
    location,
    image,
    cost,
    eventType,
    hostedBy,
    createdBy,
    totalReports = 0
}) {
    title = validation.checkString(title, 'Title');
    description = validation.checkString(description, 'Description');
    registrationUrl = validation.checkOptionalString(registrationUrl, 'Registration URL');
    registrationDescription = validation.checkOptionalString(registrationDescription, 'Registration description');
    let checkedDateTime = validation.checkEventDateTime(startDate, endDate, startTime, endTime);
    startDate = checkedDateTime.startDate;
    endDate = checkedDateTime.endDate;
    startTime = checkedDateTime.startTime;
    endTime = checkedDateTime.endTime;
    contactPhone = validation.checkOptionalString(contactPhone, 'Contact phone');
    location = validation.checkLocationString(location);
    image = validation.checkOptionalString(image, 'Image');
    cost = validation.checkCost(cost);
    eventType = validation.checkOptionalString(eventType, 'Event type');
    createdBy = validation.checkString(createdBy, 'Created By');
    hostedBy = validation.checkString(hostedBy, 'Hosted By');

    title = title.trim();
    description = description.trim();
    startDate = startDate.trim();
    endDate = endDate.trim();
    startTime = startTime.trim();
    endTime = endTime.trim();
    location.parkNames = location.parkNames.trim();
    location.location = location.location.trim();
    
    const newEvent = {
        title,
        link: 'placeholder',
        description,
        registrationUrl,
        registrationDescription,
        startDate,
        endDate,
        startTime,
        endTime,
        contactPhone,
        location: {
            parkNames: location.parkNames,
            location: location.location,
            borough: location.borough,
            coordinates: location.coordinates,
        },
        image,
        cost,
        eventType,
        createdBy: createdBy,
        comments: [],
        likeCount: 0,
        likedBy: [],
        dislikeCount: 0,
        dislikedBy: [],
        reviewList: [],
        checkedInList: [],
        registeredList: [],
        totalReports,
        reportedBy: []
    };

    const eventCollection = await events();
    const result = await eventCollection.insertOne(newEvent);
    
    //autogenerates link to event within app 
    const generatedLink = `/events/${result.insertedId.toString()}`;
    await eventCollection.updateOne(
        { _id: result.insertedId },
        { $set: { link: generatedLink } }
    );

    return await getEventById(result.insertedId.toString());
}

async function updateEvent(id, updates){
    id = validation.checkId(id);
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
        throw 'Error: You must provide a valid updates object';
    }
    if (Object.keys(updates).length === 0) {
        throw 'Error: No update fields provided';
    }

    const allowedFields = [
        'title',
        'link',
        'description',
        'registrationUrl',
        'registrationDescription',
        'startDate',
        'endDate',
        'startTime',
        'endTime',
        'contactPhone',
        'location',
        'image',
        'cost',
        'eventType',
        'totalReports'
    ];

    let event_data = await events();
    const existing_event = await event_data.findOne({_id: new ObjectId(id)});
    if (!existing_event) throw 'Error: Event not found';
    
    let update_data = {};

    for(let key of Object.keys(updates)){
        if (!allowedFields.includes(key)) {
            throw `Error: ${key} cannot be updated`;
        }
        if (key === 'location') {
            if (typeof updates[key] !== 'object' || Array.isArray(updates[key]) || updates[key] === null) {
                throw 'Error: Update value for location must be an object';
            }
            const allowedLocationFields = ['parkNames', 'location', 'coordinates'];

            for (let locKey of Object.keys(updates.location)) {
                if (!allowedLocationFields.includes(locKey)) {
                    throw `Error: location.${locKey} cannot be updated`;
                }

                if (locKey === "coordinates") {
                    if (!updates.location.coordinates) {
                        throw "Error: coordinates must be a string with lat and lng";
                    }
                
                    update_data.location = update_data.location || {};
                    update_data.location.coordinates = updates.location.coordinates;
                }
            }

            if(updates.location.parkNames) {
                update_data.location = update_data.location || {};
                update_data.location.parkNames = validation.checkString(updates.location.parkNames, 'Park Names').trim();
            }
            if(updates.location.location) {
                update_data.location = update_data.location || {};
                update_data.location.location = validation.checkString(updates.location.location, 'Location').trim();
            }
            if(updates.location.borough) {
                update_data.location = update_data.location || {};
                update_data.location.borough = validation.checkOptionalString(updates.location.borough, 'Borough').trim();
            }

        } else if (key === 'cost') {
            update_data.cost = validation.checkCost(updates.cost);
        } else if (key=== 'startDate') {
            update_data.startDate = validation.checkDate(updates.startDate, 'Start Date');
        } else if (key === 'endDate') {
            update_data.endDate = validation.checkDate(updates.endDate, 'End Date');
        } else if (key === 'startTime') {
            update_data.startTime = validation.checkTime(updates.startTime, 'Start Time');
        } else if (key === 'endTime') {
            update_data.endTime = validation.checkTime(updates.endTime, 'End Time');
        } else {
            const requiredFields = [
                'title',
                'description',
            ];

            if (requiredFields.includes(key)) {
                update_data[key] = validation.checkString(updates[key], key);
            } else {
                update_data[key] = validation.checkOptionalString(updates[key], key);
            }
        }
    }
    
    if (updates.startDate !== undefined || updates.endDate !== undefined || updates.startTime !== undefined || updates.endTime !== undefined) {
        let finalStartDate = update_data.startDate || existing_event.startDate;
        let finalEndDate = update_data.endDate || existing_event.endDate;
        let finalStartTime = update_data.startTime || existing_event.startTime;
        let finalEndTime = update_data.endTime || existing_event.endTime;
        let checkedDateTime = validation.checkEventDateTime(finalStartDate, finalEndDate, finalStartTime, finalEndTime);

        update_data.startDate = checkedDateTime.startDate;
        update_data.endDate = checkedDateTime.endDate;
        update_data.startTime = checkedDateTime.startTime;
        update_data.endTime = checkedDateTime.endTime;
    }

    const updateInfo = await event_data.updateOne(
        {_id: new ObjectId(id)},
        {$set: update_data}
    );

    return await getEventById(id);
}

async function deleteEvent(id, userId) {
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

async function addComment(eventId, userId, textContent) {
    if (typeof eventId !== 'string' || typeof userId !== 'string') {
        throw 'Error: eventId and userId must be strings';
    }
    eventId = eventId.trim();
    userId = userId.trim();
    if (!ObjectId.isValid(eventId)) {
        throw 'Error: Invalid event id';
    }
    if (!ObjectId.isValid(userId)) {
        throw 'Error: Invalid user id';
    }
    if (!textContent || typeof textContent !== 'string' || !textContent.trim()) {
        throw 'Error: Comment text must be a non-empty string';
    }

    const eventCollection = await events();
    const event = await eventCollection.findOne({_id: new ObjectId(eventId)});
    if (!event) throw 'Error: Event not found';
    const data = await users();
    const user = await data.findOne({_id: new ObjectId(userId)});

    const newComment = {
        _id: new ObjectId(),
        userID: new ObjectId(userId),
        username: user.username,
        createdAt: new Date(),
        textContent: textContent.trim(),
        likes: 0,
        likedBy: []
    };

    await eventCollection.updateOne(
        { _id: new ObjectId(eventId) },
        { $push: { comments: newComment }}
    );

    return newComment;
}

async function addReview(eventId, userId, username, rating, textContent) {
    if (typeof eventId !== 'string' || typeof userId !== 'string') {
        throw 'Error: eventId and userId must be strings';
    }
    eventId = eventId.trim();
    userId = userId.trim();
    if (!ObjectId.isValid(eventId)) {
        throw 'Error: Invalid event id';
    }
    if (!ObjectId.isValid(userId)) {
        throw 'Error: Invalid user id';
    }
    if (typeof username !== 'string' || !username.trim()) {
        throw 'Error: Username must be a non-empty string';
    }
    username = username.trim();
    if (typeof textContent !== 'string' || !textContent.trim()) {
        throw 'Error: Review text must be a non-empty string';
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        throw 'Rating must be between 1 and 5';
    }

    const eventCollection = await events();
    const event = await eventCollection.findOne({_id: new ObjectId(eventId)});

    if (!event) throw 'Event not found';

    const checkedInList = Array.isArray(event.checkedInList) ? event.checkedInList : [];
    const checkedIn = checkedInList.some((id) => id.toString() === userId);

    if (!checkedIn) {
        throw 'User must check in before reviewing';
    }

    if (event.reviewList?.some((r) => r.userID.toString() === userId)) {
        throw 'Error: User already reviewed this event';
    }

    const newReview = {
        _id: new ObjectId(),
        userID: new ObjectId(userId),
        username,
        createdAt: new Date(),
        textContent: textContent.trim(),
        rating
    };

    await eventCollection.updateOne(
        { _id: new ObjectId(eventId) },
        { $push: { reviewList: newReview } }
    );

    return newReview;
}

async function likeComment(eventId, commentId, userId) {
    if (typeof eventId !== 'string' || typeof commentId !== 'string' || typeof userId !== 'string') {
        throw 'Error: eventId, commentId, and userId must be strings';
    }
    eventId = eventId.trim();
    commentId = commentId.trim();
    userId = userId.trim();
    if (!ObjectId.isValid(eventId)) {
        throw 'Error: Invalid event id';
    }
    if (!ObjectId.isValid(commentId)) {
        throw 'Error: Invalid comment id';
    }
    if (!ObjectId.isValid(userId)) {
        throw 'Error: Invalid user id';
    }

    const eventCollection = await events();
    const event = await eventCollection.findOne({_id: new ObjectId(eventId)});
    if (!event) throw 'Error: Event not found';

    const comment = event.comments?.find((c) => c._id.toString() === commentId);
    if (!comment) throw 'Error: Comment not found';

    if (comment.likedBy?.some((id) => id.toString() === userId)) {
        throw 'Error: User already liked this comment';
    }

    await eventCollection.updateOne(
        { 
            _id: new ObjectId(eventId),
            "comments._id": new ObjectId(commentId)
        },
        {
            $inc: { "comments.$.likes": 1 },
            $push: { "comments.$.likedBy": new ObjectId(userId) }
        }
    );
}

async function likeEvent(eventId, userId) {
    if (typeof eventId !== 'string' || typeof userId !== 'string') {
        throw 'Error: eventId and userId must be strings';
    }
    eventId = eventId.trim();
    userId = userId.trim();
    userId = userId.trim();
    if (!ObjectId.isValid(eventId)) {
        throw 'Error: Invalid event id';
    }
    if (!ObjectId.isValid(userId)) {
        throw 'Error: Invalid user id';
    }

    const eventCollection = await events();
    const event = await eventCollection.findOne({_id: new ObjectId(eventId)});
    if (!event) throw 'Error: Event not found';

    if (event.likedBy?.some((id) => id.toString() === userId)) {
        throw 'Error: User already liked this event';
    }

    await eventCollection.updateOne(
        { _id: new ObjectId(eventId) },
        {
            $inc: { likeCount: 1 },
            $push: { likedBy: new ObjectId(userId) }
        }
    );
}

async function unlikeEvent(eventId, userId) {
    if (typeof eventId !== 'string' || typeof userId !== 'string') {
        throw 'Error: eventId and userId must be strings';
    }
    eventId = eventId.trim();
    userId = userId.trim();
    if (!ObjectId.isValid(eventId)) {
        throw 'Error: Invalid event id';
    }
    if (!ObjectId.isValid(userId)) {
        throw 'Error: Invalid user id';
    }

    const eventCollection = await events();
    const event = await eventCollection.findOne({_id: new ObjectId(eventId)});
    if (!event) throw 'Error: Event not found';

    if (!event.likedBy || !event.likedBy.some((id) => id.toString() === userId)) {
        throw 'Error: User has not liked this event';
    }

    await eventCollection.updateOne(
        { _id: new ObjectId(eventId) },
        {
            $inc: { likeCount: -1 },
            $pull: { likedBy: new ObjectId(userId) }
        }
    );
}

async function dislikeEvent(eventId, userId) {
    if (typeof eventId !== 'string' || typeof userId !== 'string') {
        throw 'Error: eventId and userId must be strings';
    }
    eventId = eventId.trim();
    userId = userId.trim();
    if (!ObjectId.isValid(eventId)) {
        throw 'Error: Invalid event id';
    }
    if (!ObjectId.isValid(userId)) {
        throw 'Error: Invalid user id';
    }

    const eventCollection = await events();
    const event = await eventCollection.findOne({_id: new ObjectId(eventId)});
    if (!event) throw 'Error: Event not found';

    if (event.dislikedBy && event.dislikedBy.some((id) => id.toString() === userId)) {
        throw 'Error: User already disliked this event';
    }

    if (event.likedBy && event.likedBy.some((id) => id.toString() === userId)) {
        await eventCollection.updateOne(
            { _id: new ObjectId(eventId) },
            {
                $inc: { likeCount: -1 },
                $pull: { likedBy: new ObjectId(userId) }
            }
        );
    }

    await eventCollection.updateOne(
        { _id: new ObjectId(eventId) },
        {
            $inc: { dislikeCount: 1 },
            $push: { dislikedBy: new ObjectId(userId) }
        }
    );
}

async function undislikeEvent(eventId, userId) {
    if (typeof eventId !== 'string' || typeof userId !== 'string') {
        throw 'Error: eventId and userId must be strings';
    }
    eventId = eventId.trim();
    userId = userId.trim();
    if (!ObjectId.isValid(eventId)) {
        throw 'Error: Invalid event id';
    }
    if (!ObjectId.isValid(userId)) {
        throw 'Error: Invalid user id';
    }

    const eventCollection = await events();
    const event = await eventCollection.findOne({_id: new ObjectId(eventId)});
    if (!event) throw 'Error: Event not found';

    if (!event.dislikedBy || !event.dislikedBy.some((id) => id.toString() === userId)) {
        throw 'Error: User has not disliked this event';
    }

    await eventCollection.updateOne(
        { _id: new ObjectId(eventId) },
        {
            $inc: { dislikeCount: -1 },
            $pull: { dislikedBy: new ObjectId(userId) }
        }
    );
}

async function reportEvent(eventId, userId, reviewedBy) {
    if (typeof eventId !== 'string') {
        throw 'Error: eventId must be a string';
    }
    eventId = eventId.trim();
    if (!ObjectId.isValid(eventId)) {
        throw 'Error: Invalid event id';
    }
    if (typeof userId !== 'string') {
        throw 'Error: userId must be a string';
    }
    userId = userId.trim();
    if (!ObjectId.isValid(userId)) {
        throw 'Error: Invalid user id';
    }
    const data = await events();
    const reported_event = await data.findOne({_id: new ObjectId(eventId)});
    if (!reported_event) throw 'Error: Event not found';
    if(reported_event.reportedBy?.some((id) => id.toString() === userId)) {
        throw 'Error: User already reported this event';
    }

    const eventCollection = await events();
    const event = await eventCollection.findOne({_id: new ObjectId(eventId)});
    if (!event) throw 'Error: Event not found';

    await eventCollection.updateOne({ _id: new ObjectId(eventId) },{ $inc: { totalReports: 1 }, $push: { reportedBy: new ObjectId(userId) }  });

    if (event.totalReports + 1 >= 3 && !event.reviewedByAdmin) {
        await eventCollection.updateOne({ _id: new ObjectId(eventId) },{ $set: { reviewedByAdmin: false} }
        );
    }
}

async function reviewEvent(eventId) {
    if (typeof eventId !== 'string') {
        throw 'Error: eventId must be a string';
    }
    eventId = eventId.trim();
    if (!ObjectId.isValid(eventId)) {
        throw 'Error: Invalid event id';
    }
    const data = await events();
    const reviewed_event = await data.findOne({_id: new ObjectId(eventId)});
    if (!reviewed_event) throw 'Error: Event not found';

    const eventCollection = await events();
    await eventCollection.updateOne({ _id: new ObjectId(eventId) },{ $set: {totalReports: 0, reportedBy: [] } });
    await eventCollection.updateOne({ _id: new ObjectId(eventId) },{ $unset: { reviewedByAdmin: "" } }
    );
}

async function searchEvents(keyword) {
    if (!keyword || typeof keyword !== 'string') {
        throw 'keyword must be a valid string';
    }
    const eventCollection = await events();

    const filtered = {
    $and: [
        {
            $or: [
                { title: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } },
                // ...rest of your search fields
            ]
        },
        // exclude cancelled events
        { title: { $not: { $regex: 'cancel', $options: 'i' } } },
        { description: { $not: { $regex: 'cancel', $options: 'i' } } }
    ]
};

    const results = await eventCollection.find(filtered).toArray();
    return results;
}

async function getSortedEvents({sortBy = 'startDate', order = 'asc', borough, eventType} = {}) {

    const sortOrder = order === 'desc' ? -1 : 1;
    const eventCollection = await events();

    let filter = {
        title: { $not: { $regex: 'cancel', $options: 'i' } },
        description: { $not: { $regex: 'cancel', $options: 'i' } }
    };

    if (borough) {
        filter['location.location'] = { $regex: borough, $options: 'i' };
    }

    if (eventType) {
        filter.eventType = eventType; 
    }

    let sortQuery = {};

    switch (sortBy) {
        case 'startDate': sortQuery = { startDate: sortOrder, startTime: sortOrder };
            break;

        case 'endDate': sortQuery = { endDate: sortOrder, endTime: sortOrder };
            break;

        case 'cost': sortQuery = { cost: sortOrder };
            break;

        case 'likeCount': sortQuery = { likeCount: sortOrder };
            break;

        case 'title': sortQuery = { title: sortOrder };
            break;

        default:
            throw 'invalid sort type';
    }

    const finalResults = await eventCollection.find(filter).sort(sortQuery).toArray();
    return finalResults;
}

async function checkInEvent(eventId, userId) {
    if (typeof eventId !== 'string' || typeof userId !== 'string') {
        throw 'Error: eventId and userId must be strings';
    }
    eventId = eventId.trim();
    userId = userId.trim();
    if (!ObjectId.isValid(eventId)) {
        throw 'Error: Invalid event id';
    }
    if (!ObjectId.isValid(userId)) {
        throw 'Error: Invalid user id';
    }

    const eventCollection = await events();
    const event = await eventCollection.findOne({_id: new ObjectId(eventId)});
    if (!event) throw 'Error: Event not found';

    if (event.checkedInList?.some((id) => id.toString() === userId)) {
        throw 'Error: User already checked in to this event';
    }

    await eventCollection.updateOne(
        { _id: new ObjectId(eventId) },
        {
            $push: { checkedInList: new ObjectId(userId) }
        }
    );
}

async function findTodayEvents() {
    //get all events from today and finds the boroughs via mapbox location api via the built in latitude longitude identifier. separates it into 5 borough lists for the day, saved into mongo.
    //mongo collection items have {date : today date, boroughs:  {Manhattan: event1, event2}, Brooklyn: {event1}} etc
    //note that this probably isnt 100% accurate its just wherever mapbox decided where the boundaries were
    const eventCollection = await events();
    const todayEventsCollection = await todayEvent();
    const today = new Date().toISOString().split('T')[0];

    const todaysEvents = await eventCollection.find({startDate: today}).toArray();

    for (const event of todaysEvents) {
        if (event.location?.borough) continue;
        try {
            if (!event.location?.coordinates) continue;

            const parts = event.location.coordinates.split(',');
            const lat = parseFloat(parts[0]);
            const lng = parseFloat(parts[1]);
            const borough = await getBorough(lat, lng);
            if (borough) {
                await eventCollection.updateOne({_id: event._id}, {$set:{'location.borough': borough}});
                event.location.borough = borough;
            }
        } catch(e) {
            event.location.borough = null;
        }
    }

    const boroughs = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx',  'Staten Island'];
    const grouped = {};

    for (const borough of boroughs) {
        grouped[borough] = todaysEvents.filter(e => e.location?.borough?.toLowerCase() === borough.toLowerCase());
    }

    const doc = {date: today, boroughs: grouped};
    await todayEventsCollection.deleteMany({});
    await todayEventsCollection.insertOne(doc);

    return doc;
}

async function getEventsByBorough(targetBorough) {
    //gets current date and sees if it already exists in the database. if it does, no need to api call again.
    //if the date is different, then make a new mongo item in that collection 4 the current date's events and save that
    if (!targetBorough || typeof targetBorough !== 'string') {
        throw 'targetBorough must be a valid string';
    }

    const todayEventsCollection = await todayEvent();
    const today = new Date().toISOString().split('T')[0];

    let eventList = await todayEventsCollection.findOne({ date: today });

    if (!eventList) {
        eventList = await findTodayEvents();
    }

    const match = Object.keys(eventList.boroughs).find(b => b.toLowerCase() === targetBorough.toLowerCase());

    if (!match) throw 'Borough not found';
    return eventList.boroughs[match];
}

export {getAllEvents, getEventById, createEvent, updateEvent, deleteEvent, addComment, likeComment, likeEvent, unlikeEvent, undislikeEvent, dislikeEvent, addReview, searchEvents, getSortedEvents, reportEvent, reviewEvent, findTodayEvents,getEventsByBorough,checkInEvent};