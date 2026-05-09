import { getApiData } from "../getData.js";

export async function geocodeLocation(address) {
    if (!address || typeof address !== "string") {
        throw "Invalid address";
    }

    const token = process.env.MAPBOX_TOKEN;
    const url =`https://api.mapbox.com/geocoding/v5/mapbox.places/` +`${encodeURIComponent(address)}.json?access_token=${token}`;
    const data = await getApiData(url);

    if (!data.features || data.features.length === 0) {
        throw "Invalid location";
    }

    const [lng, lat] = data.features[0].center;
    return {lat, lng};
}