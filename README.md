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
  Used to display live weather based on where user has set their location and where event is:
  https://open-meteo.com/


## Setup Instructions

1. Download the project or clone the repository and run `npm install` to install all dependencies. 
2. Run `npm run seed` to populate database with events and users
3. Create a `.env` file with the following:
* MAPBOX_TOKEN={API_KEY_1}

Grab API_KEY_1 from https://www.mapbox.com/ by signing up for an account. Replace {API_KEY_1} with the given api key under admin -> tokens -> default public token

5. Run `npm run start` to start localhost and navigate to http://localhost:3000 (or default localhost)

## Credentials

You can log in as an admin with the following credentials:

* Username: jane.doe
* Password: password456!

Alternatively, you can create a new account or log in as a normal user with the following credentials:

* Username: bob.smith
* Password: password789!

## Technologies Used

- Mapbox used to display an interactive map with location of each event: https://www.mapbox.com/
- Meteo used to display live weather based on where user has set their location and where event is: https://open-meteo.com/
