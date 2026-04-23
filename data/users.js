import {users} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';

let exportedMethds = {
    async getAllUsers() {
        const userCollection = await users();
        return await userCollection.find({}).toArray();
    }
};

export default exportedMethds;