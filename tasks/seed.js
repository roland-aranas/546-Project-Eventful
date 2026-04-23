import {dbConnection, closeConnection} from '../config/mongoConnections.js';
import {initializeCollections} from '../config/mongoCollections.js';
import {getApiData} from '../getData.js';
import {events, users} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';

const seed = async () => {
    try {
        const db = await dbConnection();
        await db.dropDatabase();
        await initializeCollections();

        const eventCollection = await events();
        const userCollection = await users();
        const data = await getApiData();

        if(!Array.isArray(data)) throw 'Could not get API event data';

        if(data.length > 0) {
            for (let i of data) {
                i.cost = 0;
                i.eventType = null;
                i.comments = [];
                i.likeCount = 0;
                i.reviewList = [];
                i.checkedInList = [];
                i.registeredList = [];
            }

            await eventCollection.deleteMany({});
            const insertInfo = await eventCollection.insertMany(data);
            console.log(`Seed complete: inserted ${insertInfo.insertedCount} events into database.`);
        } else {
            console.log('Seed complete: API returned 0 events, nothing was inserted.');
        }

        const usersData = [
            {
                _id: new ObjectId(),
                isAdmin: false,
                firstName: 'John',
                lastName: 'Apple',
                age: 30,
                email: 'john@example.com',
                username: 'john.apple',
                passwordHash: 'password123!',
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
                passwordHash: 'password456!',
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
                passwordHash: 'password789!',
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
                passwordHash: 'password012!',
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