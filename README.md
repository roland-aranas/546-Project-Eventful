# 546-Project-ParkParty
546 Web Programming project

ParkParty is a web application that helps users discover public events happening in NYC parks. Users can browse events by borough, save events to a personal calendar, check into events, leave reviews, interact with other users through comments and reactions, and create their own community events.


## Members

* Roland Aranas
* Elizabeth Kirstein
* Kyle Michael Pingue
* Anna Tolmanov 


## Features

### User Features
- Create an account and log in securely
- Password strength validation
- Browse public NYC park events
- Search and filter events by borough
- Save and unsave events to a personal calendar
- Check into attended events
- Leave reviews for attended events
- Like/dislike events
- Comment on events
- Report inappropriate events
- View upcoming, past, and created events on profile page

### Event Features
- Create custom community events
- Edit/delete events created by the logged-in user
- View event details including:
  - Description
  - Time/date
  - Location
  - Registration links
  - Cost
  - Weather
  - Interactive map

### Additional Features
- Interactive Mapbox maps
- Weather integration using Open-Meteo
  

## Technologies Used

### APIs
- Mapbox  
  Used to display interactive map with location of each event  
  https://www.mapbox.com/

- Open-Meteo  
  Used to display live weather based on where user has set their location and where event is
  https://open-meteo.com/


## Setup Instructions

1. Clone the Repository

```bash
git clone <repo-url>
cd 546-Project-ParkParty
```

2. Install Dependencies

```bash
npm install
```

3. Create Environment File

Create a `.env` file in the root directory:

```env
MAPBOX_TOKEN=YOUR_MAPBOX_TOKEN
```

To obtain a Mapbox token:
1. Create an account at https://www.mapbox.com/
2. Navigate to:
   - Account -> Tokens
3. Copy your default public token

---

## Running the Application

Seed the Database

```bash
npm run seed
```

Start the Server

```bash
npm start
```

Then open:

```txt
http://localhost:3000
```


## Demo Credentials

You can log in as an admin with the following credentials:

* Username: jane.doe
* Password: password456!

Alternatively, you can create a new account or log in as a normal user with the following credentials:

* Username: bob.smith
* Password: password789!


## Dataset

NYC Parks Public Events Dataset:
https://opendata.cityofnewyork.us/
