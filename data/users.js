import {users} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';
import bcrypt from 'bcrypt';

let exportedMethods = {
    async getAllUsers() {
        const userCollection = await users();
        return await userCollection.find({}).toArray();
    },
    async getUserById(id) {
        if (typeof id !== 'string') {
            throw 'Error: You must provide a valid user id';
        }
        id = id.trim();
        if (id === '' || !ObjectId.isValid(id)) {
            throw 'Error: User id cannot be an empty string';
        }

        const userCollection = await users();
        const user = await userCollection.findOne({_id: new ObjectId(id)});
        if (!user) throw 'Error: User not found';

        return user;
    },
    async getUserByEmail(email) {
        let email_regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (typeof email !== 'string') throw 'Error: You must provide a valid email';
        email = email.trim().toLowerCase();
        if (email === '') {
            throw 'Error: Email cannot be an empty string';
        }
        if (!email_regex.test(email)) {
            throw 'Error: You must provide a valid email';
        }
        let user_data = await users();
        let user = await user_data.findOne({email:email});
        if (!user) throw `User with email ${email} not found`;
        return user;
    },
    async getUserByUsername(username){
        if(!username || typeof username !== 'string'){
            throw 'Error: You must provide a valid username string';
        }
        username = username.trim();
        if(username === ''){
            throw 'Error: Username cannot be an empty string';
        }
        let user_data = await users();
        let user = await user_data.findOne({username: username});
        if (!user) throw `User with username ${username} not found`;
        return user;
    },
    async createUser({
        isAdmin = false,
        firstName,
        lastName,
        age,
        email,
        username,
        password,
        borough,
        favoriteLocations = [],
        createdEvents = [],
        savedEvents = []
    }) {
        if (typeof firstName !== 'string' || !firstName.trim()) throw 'Error: Invalid firstName';
        if (typeof lastName !== 'string' || !lastName.trim()) throw 'Error: Invalid lastName';
        if (!Number.isInteger(age) || age < 0) throw 'Error: Invalid age';
        if (typeof email !== 'string') throw 'Error: Invalid email';
        if (typeof username !== 'string' || !username.trim()) throw 'Error: Invalid username';
        if (typeof password !== 'string' || !password.trim()) throw 'Error: Invalid password';
        if (typeof borough !== 'string' || !borough.trim()) throw 'Error: Invalid borough';
        if (typeof isAdmin !== 'boolean') throw 'Error: Invalid isAdmin';
        if (!Array.isArray(favoriteLocations)) throw 'Error: Invalid favoriteLocations';
        if (!Array.isArray(createdEvents)) throw 'Error: Invalid createdEvents';
        if (!Array.isArray(savedEvents)) throw 'Error: Invalid savedEvents';

        firstName = firstName.trim();
        lastName = lastName.trim();
        email = email.trim().toLowerCase();
        username = username.trim();
        password = password.trim();
        borough = borough.trim();
        if (firstName === '' || lastName === '' || email === '' || username === '' || password === '' || borough === '') {
            throw 'Error: All fields must be non-empty strings';
        }

        const userCollection = await users();

        const existingEmail = await userCollection.findOne({ email });
        if (existingEmail) throw 'Error: A user with this email already exists';

        const existingUsername = await userCollection.findOne({ username });
        if (existingUsername) throw 'Error: A user with this username already exists';

        const passwordHash = await bcrypt.hash(password, 16);

        const newUser = {
            isAdmin,
            firstName,
            lastName,
            age,
            email,
            username,
            passwordHash,
            borough,
            favoriteLocations,
            createdEvents,
            savedEvents,
            createdAt: new Date().toISOString()
        };

        const newUserInfo = await userCollection.insertOne(newUser);
        if (!newUserInfo.acknowledged || !newUserInfo.insertedId) {
            throw 'Error: Could not create user';
        }

        return await userCollection.findOne({ _id: newUserInfo.insertedId });
    },
    async deleteUserById(id) {
        if (typeof id !== 'string') {
            throw 'Error: You must provide a valid user id';
        }
        id = id.trim();
        if (id === '' || !ObjectId.isValid(id)) {
            throw 'Error: User id cannot be an empty string';
        }

        let user_data = await users();
        let user = await user_data.findOne({_id: new ObjectId(id)});
        if (!user) throw 'Error: User not found';
        await user_data.deleteOne({_id: new ObjectId(id)});
        return user;
    },
    async updateUser(id, updates) {
        if (typeof id !== 'string') {
            throw 'Error: You must provide a valid user id';
        }
        id = id.trim();
        if (id === '' || !ObjectId.isValid(id)) {
            throw 'Error: User id cannot be an empty string';
        }
        if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
            throw 'Error: You must provide a valid updates object';
        }
        let user_data = await users();
        const user = await user_data.findOne({_id: new ObjectId(id)});
        if (!user){
            throw 'Error: User not found';
        }
        if(user.isAdmin && updates.isAdmin === false){
            throw 'Error: Cannot change isAdmin status of an admin user';
        }
        if(!user.isAdmin && updates.isAdmin === true){
            throw 'Error: Cannot change isAdmin status of a non-admin user';
        }
        const allowedUpdateFields = new Set([
            'isAdmin',
            'firstName',
            'lastName',
            'age',
            'email',
            'username',
            'password',
            'passwordHash',
            'borough',
            'favoriteLocations',
            'createdEvents',
            'savedEvents'
        ]);

        for(let key of Object.keys(updates)){
            const trimmedKey = key.trim();
            if (trimmedKey !== key) {
                updates[trimmedKey] = updates[key];
                delete updates[key];
            }

            if (!allowedUpdateFields.has(trimmedKey)) {
                throw `Error: ${trimmedKey} is not an updatable field`;
            }

            if(typeof updates[trimmedKey] !== 'string' && trimmedKey !== 'isAdmin' && trimmedKey !== 'age' && trimmedKey !== 'favoriteLocations' && trimmedKey !== 'createdEvents' && trimmedKey !== 'savedEvents') {
                throw `Error: Update value for ${trimmedKey} must be a string`;
            }
            if(trimmedKey === 'isAdmin' && typeof updates[trimmedKey] !== 'boolean') {
                throw `Error: Update value for ${trimmedKey} must be a boolean`;
            }
            if(trimmedKey === 'age' && (typeof updates[trimmedKey] !== 'number' || updates[trimmedKey] < 0)) {
                throw `Error: Update value for ${trimmedKey} must be a non-negative number`;
            }
            if((trimmedKey === 'favoriteLocations' || trimmedKey === 'createdEvents' || trimmedKey === 'savedEvents') && !Array.isArray(updates[trimmedKey])) {
                throw `Error: Update value for ${trimmedKey} must be an array`;
            }
            if(trimmedKey === 'email') {
                updates[trimmedKey] = updates[trimmedKey].trim().toLowerCase();
                let email_regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                if (!email_regex.test(updates[trimmedKey])) {
                    throw 'Error: You must provide a valid email';
                }
                const existingUser = await user_data.findOne({email: updates[trimmedKey]});
                if (existingUser && existingUser._id.toString() !== id) {
                    throw 'Error: A user with this email already exists';
                }
            }
            if(trimmedKey === 'username') {
                updates[trimmedKey] = updates[trimmedKey].trim();
                let username_regex = /^[a-zA-Z][a-zA-Z0-9_]{2,15}$/;
                if (!username_regex.test(updates[trimmedKey])) {
                    throw 'Error: You must provide a valid username';
                }
                const existingUser = await user_data.findOne({username: updates[trimmedKey]});
                if (existingUser && existingUser._id.toString() !== id) {
                    throw 'Error: A user with this username already exists';
                }
            }
            if (trimmedKey === 'password' || trimmedKey === 'passwordHash') {
                if (updates[trimmedKey].trim() === '') throw 'Error: Password cannot be empty';
                updates.passwordHash = await bcrypt.hash(updates[trimmedKey].trim(), 16);
                if (trimmedKey === 'password') {
                    delete updates.password;
                }
            }
        }
        let update_data = {...updates};
        const updateInfo = await user_data.updateOne({_id: new ObjectId(id)}, {$set: update_data});
        if (updateInfo.matchedCount === 0) {
            throw 'Error: Could not update user';
        }
        return await user_data.findOne({_id: new ObjectId(id)});
    },
    async addSavedEvent(userId, eventId) {
        if (typeof userId !== 'string' || typeof eventId !== 'string') {
            throw 'Error: ids must be strings';
        }
        userId = userId.trim();
        eventId = eventId.trim();

        if (!ObjectId.isValid(userId)) throw 'Error: invalid user id';
        if (!ObjectId.isValid(eventId)) throw 'Error: invalid event id';

        const userCollection = await users();
        const eventObjectId = new ObjectId(eventId);

        const updateInfo = await userCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $addToSet: { savedEvents: eventObjectId } }
        );

        if (updateInfo.matchedCount === 0) throw 'Error: User not found';
        return await userCollection.findOne({ _id: new ObjectId(userId) });
    },
    async addCreatedEvent(userId, eventId) {
        if (typeof userId !== 'string' || typeof eventId !== 'string') {
            throw 'Error: ids must be strings';
        }
        userId = userId.trim();
        eventId = eventId.trim();

        if (!ObjectId.isValid(userId)) throw 'Error: invalid user id';
        if (!ObjectId.isValid(eventId)) throw 'Error: invalid event id';

        const userCollection = await users();
        const eventObjectId = new ObjectId(eventId);

        const updateInfo = await userCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $addToSet: { createdEvents: eventObjectId } }
        );

        if (updateInfo.matchedCount === 0) throw 'Error: User not found';
        return await userCollection.findOne({ _id: new ObjectId(userId) });
    },
    async removeSavedEvent(userId, eventId) {
        if (typeof userId !== 'string' || typeof eventId !== 'string') {
            throw 'Error: ids must be strings';
        }
        userId = userId.trim();
        eventId = eventId.trim();

        if (!ObjectId.isValid(userId)) throw 'Error: invalid user id';
        if (!ObjectId.isValid(eventId)) throw 'Error: invalid event id';

        const userCollection = await users();
        const eventObjectId = new ObjectId(eventId);

        const updateInfo = await userCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $pull: { savedEvents: eventObjectId } }
        );

        if (updateInfo.matchedCount === 0) throw 'Error: User not found';
        return await userCollection.findOne({ _id: new ObjectId(userId) });
    },
    async removeCreatedEvent(userId, eventId) {
        if (typeof userId !== 'string' || typeof eventId !== 'string') {
            throw 'Error: ids must be strings';
        }
        userId = userId.trim();
        eventId = eventId.trim();

        if (!ObjectId.isValid(userId)) throw 'Error: invalid user id';
        if (!ObjectId.isValid(eventId)) throw 'Error: invalid event id';

        const userCollection = await users();
        const eventObjectId = new ObjectId(eventId);

        const updateInfo = await userCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $pull: { createdEvents: eventObjectId } }
        );

        if (updateInfo.matchedCount === 0) throw 'Error: User not found';
        return await userCollection.findOne({ _id: new ObjectId(userId) });
    }
};

export default exportedMethds;