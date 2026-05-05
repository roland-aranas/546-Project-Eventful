import {ObjectId} from 'mongodb';
import {events} from '../config/mongoCollections.js';
import * as validation from '../helper.js';


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
    createdBy
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
    location = validation.checkLocation(location);
    image = validation.checkOptionalString(image, 'Image');
    cost = validation.checkCost(cost);
    eventType = validation.checkOptionalString(eventType, 'Event type');
    createdBy = validation.checkString(hostedBy, 'Hosted By');

    title = title.trim();
    description = description.trim();
    startDate = startDate.trim();
    endDate = endDate.trim();
    startTime = startTime.trim();
    endTime = endTime.trim();
    location.parkNames = location.parkNames.trim();
    location.location = location.location.trim();
    location.coordinates = location.coordinates.trim();
    
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
            coordinates: location.coordinates
        },
        image,
        cost,
        eventType,
        createdBy: new ObjectId(createdBy),
        comments: [],
        likeCount: 0,
        reviewList: [],
        checkedInList: [],
        registeredList: []
    };

    const eventCollection = await events();
    const result = await eventCollection.insertOne(newEvent);
    
    //autogenerates link to event within app 
    const generatedLink = `/events/${id}`;
    await eventCollection.updateOne(
        { _id: id },
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
        'eventType'
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

                update_data[`location.${locKey}`] =
                    validation.checkString(updates.location[locKey], `Location ${locKey}`);
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

    const newComment = {
        _id: new ObjectId(),
        userID: new ObjectId(userId),
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

    const checkedIn = event.checkedInList?.some(
        (id) => id.toString() === userId
    );

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
        numLikes: 0,
        rating,
        likedBy: []
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

async function likeReview(eventId, reviewId, userId) {
    if (typeof eventId !== 'string' || typeof reviewId !== 'string' || typeof userId !== 'string') {
        throw 'Error: eventId, reviewId, and userId must be strings';
    }
    eventId = eventId.trim();
    reviewId = reviewId.trim();
    userId = userId.trim();
    if (!ObjectId.isValid(eventId)) {
        throw 'Error: Invalid event id';
    }
    if (!ObjectId.isValid(reviewId)) {
        throw 'Error: Invalid review id';
    }
    if (!ObjectId.isValid(userId)) {
        throw 'Error: Invalid user id';
    }

    const eventCollection = await events();
    const event = await eventCollection.findOne({_id: new ObjectId(eventId)});
    if (!event) throw 'Error: Event not found';

    const review = event.reviewList?.find((r) => r._id.toString() === reviewId);
    if (!review) throw 'Error: Review not found';

    if (review.likedBy?.some((id) => id.toString() === userId)) {
        throw 'Error: User already liked this review';
    }

    await eventCollection.updateOne(
        {
            _id: new ObjectId(eventId),
            "reviewList._id": new ObjectId(reviewId)
        },
        {
            $inc: { "reviewList.$.numLikes": 1 },
            $push: { "reviewList.$.likedBy": new ObjectId(userId) }
        }
    );
}

async function likeEvent(eventId, userId) {
    console.log("like and event");
}

async function searchEvents(keyword) {
    if (!keyword || typeof keyword !== 'string') {
        throw 'keyword must be a valid string';
    }
    const eventCollection = await events();

    const filtered = {
        $or: 
        [
            { title: { $regex: keyword, $options: 'i' } },
            { description: { $regex: keyword, $options: 'i' } },
            { eventType: { $regex: keyword, $options: 'i' } },
            { hostedBy: { $regex: keyword, $options: 'i' } },
            { 'location.location': { $regex: keyword, $options: 'i' } },
            { 'location.parkNames': { $regex: keyword, $options: 'i' } },
        ]
    };

    const results = await eventCollection.find(filtered).toArray();
    return results;
}

async function getSortedEvents({sortBy = 'startDate', order = 'asc', borough, eventType} = {}) {

    const sortOrder = order === 'desc' ? -1 : 1;
    const eventCollection = await events();

    let filter = {};

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

    return await eventCollection.find(filter).sort(sortQuery).toArray();
}

export {getAllEvents, getEventById, createEvent, updateEvent, deleteEvent, addComment, likeComment, addReview, likeReview, searchEvents, getSortedEvents};