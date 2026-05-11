// helper file for validation of inputs

import {ObjectId} from 'mongodb';

export const checkId = (id, name = 'ID') => {
  if (!id || typeof id !== 'string') throw `Error: ${name} must be a string`;
  id = id.trim();
  if (id.length === 0) throw `Error: ${name} cannot be empty`;
  if (!ObjectId.isValid(id)) throw `Error: ${name} must be a valid ObjectId`;
  return id;
};

export const checkString = (str, name) => {
  if (!str || typeof str !== 'string') throw `Error: ${name} must be a string`;
  str = str.trim();
  if (str.length === 0) throw `Error: ${name} cannot be empty`;
  return str;
};

export const checkOptionalString = (str, name) => {
  if (str === undefined || str === null) return null;
  if (typeof str !== 'string') throw `Error: ${name} must be a string`;
  str = str.trim();
  if (str.length === 0) return null;
  return str;
};

export const checkNumber = (num, name) => {
  if (num === undefined || num === null) throw `Error: ${name} must be provided`;
  if (typeof num !== 'number' || Number.isNaN(num)) throw `Error: ${name} must be a number`;
  if (num < 0) throw `Error: ${name} cannot be negative`;
  return num;
};

export const checkLocation = (location) => {
  if (!location || typeof location !== 'object' || Array.isArray(location)) {
    throw 'Error: Location must be an object';
  }
  if (!location.parkNames || typeof location.parkNames !== 'string') {
    throw 'Error: Park name must be a string';
  }
  if (!location.location || typeof location.location !== 'string') {
    throw 'Error: Location must be a string';
  }
  if (location.borough && typeof location.borough !== 'string') {
    throw 'Error: Borough must be a string';
  }

  return {
    parkNames: location.parkNames.trim(),
    location: location.location.trim(),
    borough: location.borough ? location.borough.trim() : null
  };
};
export const checkLocationString = (location) => {
  if (!location || typeof location !== 'object' || Array.isArray(location)) {
    throw 'Error: Location must be an object';
  }

  if (!location.parkNames || typeof location.parkNames !== 'string') {
    throw 'Error: Park name must be a string';
  }

  if (!location.location || typeof location.location !== 'string') {
    throw 'Error: Location must be a string';
  }

  if (location.borough && typeof location.borough !== 'string') {
    throw 'Error: Borough must be a string';
  }

  return {
    parkNames: location.parkNames.trim(),
    location: location.location.trim(),
    borough: location.borough ? location.borough.trim() : null,
    coordinates: location.coordinates
  };
};

export const checkCost = (cost) => {
  if (cost === null || cost === undefined) {
    throw 'Error: Cost must be provided';
  }

  if (typeof cost === 'string') {
    let trimmed = cost.trim().toLowerCase();
    if (trimmed === '' || trimmed === 'free') {
      return 0;
    }
    let num = Number(trimmed);
    if (isNaN(num) || num < 0) {
      throw 'Error: Cost must be a non-negative number or "free"';
    }
    return num;
  }

  if (typeof cost === 'number') {
    if (isNaN(cost) || cost < 0) {
      throw 'Error: Cost must be a non-negative number';
    }
    return cost;
  }
  throw 'Error: Cost must be a number or "free"';
};

export const checkDate = (date, name) => {
  date = checkString(date, name);
  let parts = date.split('-');
  if (parts.length !== 3) {
    throw `Error: ${name} must be in YYYY-MM-DD format`;
  }

  let year = Number(parts[0]);
  let month = Number(parts[1]);
  let day = Number(parts[2]);
  if (parts[0].length !== 4 || parts[1].length !== 2 || parts[2].length !== 2 || isNaN(year) || isNaN(month) || isNaN(day)) {
    throw `Error: ${name} must be in YYYY-MM-DD format`;
  }

  let dateObj = new Date(year, month - 1, day);
  if (dateObj.getFullYear() !== year || dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day) {
    throw `Error: ${name} must be a real date`;
  }

  return date;
};

export const checkTime = (time, name) => {
  time = checkString(time, name);
  let lowerTime = time.toLowerCase().trim();
  let match = lowerTime.match(/^(0?[1-9]|1[0-2]):([0-5]\d)\s?(am|pm)$/);

  if (!match) {
    throw `Error: ${name} must be in valid AM/PM format (e.g., 5:30 PM)`;
  }

  let hour = Number(match[1]);
  let minute = match[2];
  let period = match[3].toUpperCase();
  return `${hour}:${minute} ${period}`;
};

export const convertTimeTo24Hour = (time) => {
  time = checkTime(time, 'Time');
  let match = time.toLowerCase().match(/^(0?[1-9]|1[0-2]):([0-5]\d)\s?(am|pm)$/);
  let hour = Number(match[1]);
  let minute = match[2];
  let period = match[3];
  if (period === 'pm' && hour !== 12) {
    hour += 12;
  }
  if (period === 'am' && hour === 12) {
    hour = 0;
  }
  let hourString = hour.toString().padStart(2, '0');
  return `${hourString}:${minute}`;
};

export const checkEventDateTime = (startDate, endDate, startTime, endTime) => {
  startDate = checkDate(startDate, 'Start Date');
  endDate = checkDate(endDate, 'End Date');
  startTime = checkTime(startTime, 'Start Time');
  endTime = checkTime(endTime, 'End Time');

  let fixedStartTime = convertTimeTo24Hour(startTime);
  let fixedEndTime = convertTimeTo24Hour(endTime);

  let startDateTime = new Date(`${startDate}T${fixedStartTime}:00`);
  let endDateTime = new Date(`${endDate}T${fixedEndTime}:00`);
  let now = new Date();

  if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
    throw 'Error: Event date and time must be valid';
  }

  if (startDateTime <= now) {
    throw 'Error: Event start date and time must be in the future';
  }

  if (endDateTime < startDateTime) {
    throw 'Error: Event end date and time cannot be before the start date and time';
  }

  return {
    startDate,
    endDate,
    startTime,
    endTime
  };
};

export const attachIsSaved = (events, savedEventIds) => {
  return events.map(event => ({
    ...event,
    isSaved: savedEventIds.includes(event._id.toString())
  }));
};

export const checkRating = (rating) => {
  const num = Number(rating);
  if (typeof num !== 'number' || Number.isNaN(num) || num < 1 || num > 5) {
    throw 'Error: Rating must be a number between 1 and 5';
  }
  return num;
};

export const getSavedEventIds = async (user, userData) => {
  if (!user) return [];
  const fullUser = await userData.getUserById(user._id);
  return fullUser.savedEvents.map(id => id.toString());
};

export const checkPassword = (str) => {
  if (!str || typeof str !== 'string') throw `Password must be supplied`;
  if (str.trim().length === 0) throw `Password cannot be empty`;
  if (/\s/.test(str)) throw `Password cannot contain spaces`;
  if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,}$/.test(str)) {
    throw `Password must be at least 8 characters and contain an uppercase letter, a number, and a special character`;
  }
  return str;
};

export const checkCoords = (lat, lng) => {
  if (isNaN(lat)|| isNaN(lng)|| lat < 40|| lat > 42|| lng < -75|| lng > -72) {
    throw "Invalid coordinates";
  }
}