import {dbConnection, closeConnection} from '../config/mongoConnections.js';
import {initializeCollections} from '../config/mongoCollections.js';
import {getApiData} from '../getData.js';
import {events, users} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';
import bcrypt from 'bcrypt';

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
                title: event.title,
                link: event.link,
                description: event.description,
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