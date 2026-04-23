import axios from 'axios';

const getApiData = async () => {
  try {
    let {data} = await axios.get('https://www.nycgovparks.org/xml/events_300_rss.json');
    return data;
  } catch (e) {
    if (e.code === 'ENOTFOUND') throw 'Error: Invalid URL';
    else if (e.response)
      throw `Error: ${e.response.status}: ${e.response.statusText}`;
    else throw `Error: ${e}`;
  }
};

export {getApiData};