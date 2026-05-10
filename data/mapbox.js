import { getApiData } from "../getData.js";

export async function getBorough(address) {
    //for obtaining borough
    if (!address || typeof address !== "string") {
        throw "Invalid address";
    }

    const token = process.env.MAPBOX_TOKEN;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/` + `${encodeURIComponent(address)}.json?access_token=${token}`;
    const data = await getApiData(url);

    if (!data.features || data.features.length === 0) {
        throw "Invalid location";
    }

    const district = data.features[0].context?.find(c => c.id.startsWith("district"));

    if (!district) {
        throw "Borough not found";
    }

    return district.text;
}

