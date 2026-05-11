import {dbConnection, closeConnection} from '../config/mongoConnections.js';
import {initializeCollections} from '../config/mongoCollections.js';
import {getApiData} from '../getData.js';
import {events, users} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';
import bcrypt from 'bcrypt';
import he from 'he'; // for decoding special characters!

const seed = async () => {
    try {
        const db = await dbConnection();
        await db.dropDatabase();
        await initializeCollections();

        const eventCollection = await events();
        const userCollection = await users();
        const data = await getApiData();

        if(!Array.isArray(data)) throw 'Could not get API event data';

        let cleanedEvents = [];

        for (const event of data) {
            let newEvent = {
                title: he.decode(event.title),
                link: event.link,
                description: he.decode(event.description),
                registrationUrl: event.registration_url ?? null,
                registrationDescription: event.registration_description ?? null,
                startDate: event.startdate,
                endDate: event.enddate,
                startTime: event.starttime,
                endTime: event.endtime,
                contactPhone: event.contact_phone ?? null,
                location: {
                    parkNames: event.parknames ?? null,
                    location: event.location ?? null,
                    coordinates: event.coordinates ?? null
                },
                image: event.image ?? null,
                cost: event.cost ?? 0,
                eventType: event.categories ? event.categories.split(' | ')[0].trim() : null,
                comments: [],
                likeCount: 0,
                likedBy: [],
                dislikeCount: 0,
                dislikedBy: [],
                reviewList: [],
                checkedInList: [],
                registeredList: [],
                totalReports: 0,
                reportedBy: []
            };

            cleanedEvents.push(newEvent);
        }

        let reportedEvents = {
            title: 'NY Yankees Watch Party',
            link: 'https://www.nyyankees.com',
            description: 'Join us for a watch party of the NY Yankees game at Central Park! Food and drinks will be provided.',
            registrationUrl: null,
            registrationDescription: null,
            startDate: '2024-07-01',
            endDate: '2024-07-01',
            startTime: '7:00 PM',
            endTime: '11:00 PM',
            contactPhone: '555-123-4567',
            location: {
                parkNames: 'Central Park',
                location: 'Central Park, New York, NY',
                coordinates: "40.785091,-73.968285"
            },
            image: null,
            cost: 0,
            eventType: 'Sports',
            comments: [],
            likeCount: 5,
            likedBy: [new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId()],
            dislikeCount: 12,
            dislikedBy: [new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId()],
            reviewList: [],
            checkedInList: [],
            registeredList: [],
            totalReports: 3,
            reportedBy: [new ObjectId(), new ObjectId(), new ObjectId()]
        };

        cleanedEvents.push(reportedEvents);

        reportedEvents = {
            title: 'Brooklyn Bridge Yoga',
            link: 'https://www.brooklynbridgeyoga.com',
            description: 'Start your day with a refreshing yoga session on the Brooklyn Bridge! All levels welcome.',
            registrationUrl: null,
            registrationDescription: null,
            startDate: '2024-07-02',
            endDate: '2024-07-02',
            startTime: '07:00 AM',
            endTime: '08:00 AM',
            contactPhone: '555-987-6543',
            location: {
                parkNames: 'Brooklyn Bridge Park',
                location: 'Brooklyn Bridge Park, Brooklyn, NY',
                coordinates: "40.700291,-73.996689"
            },
            image: null,
            cost: 15,
            eventType: 'Fitness',
            comments: [{_id: new ObjectId(), userId: new ObjectId(), comment: 'This was a great event!'}, {_id: new ObjectId(), userId: new ObjectId(), comment: 'Loved the view during yoga!'}],
            likeCount: 2,
            likedBy: [new ObjectId(), new ObjectId()],
            dislikeCount: 8,
            dislikedBy: [new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId()],
            reviewList: [],
            checkedInList: [],
            registeredList: [],
            totalReports: 4,
            reportedBy: [new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId()]
        };

        cleanedEvents.push(reportedEvents);

        reportedEvents = {
            title: 'Brooklyn Art Festival',
            link: 'https://www.brooklynartfestival.com',
            description: 'Experience the vibrant art scene of Brooklyn at our annual art festival! Featuring local artists, live music, and food vendors.',
            registrationUrl: null,
            registrationDescription: null,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            startTime: '12:00 PM',
            endTime: '6:00 PM',
            contactPhone: '555-555-5555',
            location: {
                parkNames: 'Prospect Park',
                location: 'Prospect Park, Brooklyn, NY',
                coordinates: "40.658003, -73.970438"
            },
            image: null,
            cost: 20,
            eventType: 'Art',
            comments: [{_id: new ObjectId(), userId: new ObjectId(), comment: 'Amazing art and atmosphere!'}, {_id: new ObjectId(), userId: new ObjectId(), comment: 'Had a fantastic time at the festival!'}],
            likeCount: 10,
            likedBy: [new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId()],
            dislikeCount: 3,
            dislikedBy: [new ObjectId(), new ObjectId(), new ObjectId()],
            reviewList: [{_id: new ObjectId(), userId: new ObjectId(), username: 'John Doe', rating: 5, textContent: 'Incredible event with so much talent!'}, {_id: new ObjectId(), userId: new ObjectId(), username: 'Jane Smith', rating: 4, textContent: 'Great event but a bit crowded.'}],
            checkedInList: [],
            registeredList: [],
            totalReports: 5,
            reportedBy: [new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId()]
        }

        cleanedEvents.push(reportedEvents);

        console.log('Inserting cleaned events...');
        const insertInfo = await eventCollection.insertMany(cleanedEvents);

        console.log(`Inserted ${insertInfo.insertedCount} events`);


        // if(data.length > 0) {
        //     for (let i of data) {
        //         i.cost = 0;
        //         i.eventType = null;
        //         i.comments = [];
        //         i.likeCount = 0;
        //         i.reviewList = [];
        //         i.checkedInList = [];
        //         i.registeredList = [];
        //         delete i.guid;
        //         delete i.parkids;
        //         delete i.instructor;
        //         delete i.categories;
        //         delete i.pubDate;
        //     }

        //     for (const event of data) {
        //         const location = {
        //             parkNames: event.parknames ?? null,
        //             location: event.location ?? null,
        //             coordinates: event.coordinates ?? null
        //         };

        //         event.location = location;
        //         delete event.parknames;
        //         delete event.coordinates;
        //     }

        //     await eventCollection.deleteMany({});
        //     const insertInfo = await eventCollection.insertMany(data);
        //     console.log(`Seed complete: inserted ${insertInfo.insertedCount} events into database.`);
        // } else {
        //     console.log('Seed complete: API returned 0 events, nothing was inserted.');
        // }
        console.log("Inserting users, hashing passwords may take a moment...")

        const usersData = [
            {
                _id: new ObjectId(),
                isAdmin: false,
                firstName: 'John',
                lastName: 'Apple',
                age: 30,
                email: 'john@example.com',
                username: 'john.apple',
                passwordHash: await bcrypt.hash('password123!',16),
                borough: 'Manhattan',
                favoriteLocations: [],
                createdEvents: [],
                savedEvents: [],
                createdAt: new Date()
            },
            {
                _id: new ObjectId(),
                isAdmin: true,
                firstName: 'Jane',
                lastName: 'Doe',
                age: 25,
                email: 'jane@example.com',
                username: 'jane.doe',
                passwordHash: await bcrypt.hash('password456!',16),
                borough: 'Brooklyn',
                favoriteLocations: [],
                createdEvents: [],
                savedEvents: [],
                createdAt: new Date()
            },
            {
                _id: new ObjectId(),
                isAdmin: false,
                firstName: 'Bob',
                lastName: 'Smith',
                age: 35,
                email: 'bob@example.com',
                username: 'bob.smith',
                passwordHash: await bcrypt.hash('password789!',16),
                borough: 'Queens',
                favoriteLocations: [],
                createdEvents: [],
                savedEvents: [],
                createdAt: new Date()
            },
            {
                _id: new ObjectId(),
                isAdmin: false,
                firstName: 'Alice',
                lastName: 'Johnson',
                age: 28,
                email: 'alice@example.com',
                username: 'alice.johnson',
                passwordHash: await bcrypt.hash('password012!',16),
                borough: 'Bronx',
                favoriteLocations: [],
                createdEvents: [],
                savedEvents: [],
                createdAt: new Date()
            },
            {
                _id: new ObjectId(),
                isAdmin: false,
                firstName: 'Charlie',
                lastName: 'Brown',
                age: 22,
                email: 'charlie@example.com',
                username: 'charlie.brown',
                passwordHash: await bcrypt.hash('password345!',16),
                borough: 'Staten Island',
                favoriteLocations: [],
                createdEvents: [],
                savedEvents: [],
                createdAt: new Date()
            },
            {
                _id: new ObjectId(),
                isAdmin: false,
                firstName: 'Eve',
                lastName: 'Davis',
                age: 27,
                email: 'eve@example.com',
                username: 'eve.davis',
                passwordHash: await bcrypt.hash('password678!',16),
                borough: 'Manhattan',
                favoriteLocations: [],
                createdEvents: [],
                savedEvents: [],
                createdAt: new Date()
            }
            //USER PASSWORDS ARE NOT HASHED IN THIS SEED FILE. Hashing to be implemented later
        ];
        await userCollection.deleteMany({});
        const usersInsertInfo = await userCollection.insertMany(usersData);
        console.log(`Seed complete: inserted ${usersInsertInfo.insertedCount} users into database.`);
    } catch (e) {
        console.log(e);
    } 
    await closeConnection();
};

await seed();