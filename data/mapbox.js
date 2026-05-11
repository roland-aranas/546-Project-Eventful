import axios from 'axios';
//not using the getData one lol

export async function getBorough(lat, lng) {
    //for obtaining borough
    if (typeof lat !== 'number' || typeof lng !== 'number') {
        throw 'Invalid coordinates';
    }

    const token = process.env.MAPBOX_TOKEN;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}`;
    const {data} = await axios.get(url);

    if (!data.features || data.features.length === 0) {
        throw "Invalid location";
    }

    const district = data.features[0].context?.find(c => c.id.startsWith("district"));

    if (!district) {
        throw "Borough not found";
    }

    if (district.text === 'New York County') return 'Manhattan';
    if (district.text === 'Kings County') return 'Brooklyn';
    if (district.text === 'Queens County') return 'Queens';
    if (district.text === 'Bronx County') return 'Bronx';
    if (district.text === 'Richmond County') return 'Staten Island';

    throw 'Borough not found';
}

//city coords from https://gottalovenewyork.com/new-york-city-coordinates/ for the center
const boroughCenter = {
    'Manhattan': { lat: 40.7831, lng: -73.9712 },
    'Brooklyn': { lat: 40.6526, lng: -73.9497 },
    'Queens': { lat: 40.7282, lng: -73.7949 },
    'Bronx': { lat: 40.8448, lng: -73.8648 },
    'Staten Island': { lat: 40.5795, lng: -74.1502 }
};

//get weather is by openmeteo. no api key required
export async function getWeather(borough) {
    if (!borough || typeof borough !== 'string') {
        throw 'Invalid borough';
    }
    const coords = boroughCenter[borough];
    if (!coords){
         throw 'Borough not found';
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,precipitation&temperature_unit=fahrenheit&precipitation_unit=inch`;

    const {data} = await axios.get(url);
    return data.current;
}