# 546-Project-ParkParty
546 Web Programming project

## Members

* Roland Aranas
* Elizabeth Kirstein
* Kyle Michael Pingue
* Anna Tolmanov 

## Set up

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
