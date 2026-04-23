import {dbConnection} from './mongoConnections.js';

const collectionNames = [
  'events',
  'users'
  // 'location',
  // 'reviewList',
  // 'comments',
  // 'favoriteLocation'
];

/* This will allow you to have one reference to each collection per app */
/* Feel free to copy and paste this this */
const getCollectionFn = (collection) => {
  let _col = undefined;

  return async () => {
    if (!_col) {
      const db = await dbConnection();
      _col = await db.collection(collection);
    }

    return _col;
  };
};

/* Now, you can list your collections here: */
export const events = getCollectionFn('events');
export const users = getCollectionFn('users');
// export const location = getCollectionFn('location');
// export const reviewList = getCollectionFn('reviewList');
// export const comments = getCollectionFn('comments');
// export const favoriteLocation = getCollectionFn('favoriteLocation');

/* Initialize all collections */
export const initializeCollections = async () => {
  const db = await dbConnection();
  const existingCollections = await db.listCollections({}, {nameOnly: true}).toArray();
  const existingNames = new Set(existingCollections.map((c) => c.name));

  for (const name of collectionNames) {
    if (!existingNames.has(name)) {
      await db.createCollection(name);
    }
  }
};