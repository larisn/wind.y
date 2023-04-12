
'use strict';

import { fetchData, url } from './api.js';
import * as module from './module.js';



// add event on multiple elements
// * elements node array
// * event type: 'click', 'mouseover'
// * callback function
 
const addEventOnElements = function(elements, eventType, callback) {
   for (const element of elements) element.addEventListener(eventType, callback);
}



// toggle search in mobile devices

const searchView = document.querySelector('[data-search-view]');
const searchTogglers = document.querySelectorAll('[data-search-toggler]');

const toggleSearch = () => searchView.classList.toggle('active');
addEventOnElements(searchTogglers, 'click', toggleSearch);



// search integration

const searchField = document.querySelector("[data-search-field]");
const searchResult = document.querySelector("[data-search-result]");

let searchTimeout = null;
const searchTimeoutDuration = 500;

searchField.addEventListener("input", function () {

  searchTimeout ?? clearTimeout(searchTimeout);

  if (!searchField.value) {
   searchResult.classList.remove("active");
   searchResult.innerHTML = "";
   searchField.classList.remove("searching");
   } else {
      searchField.classList.add("searching");
   }

  if (searchField.value) {
   searchTimeout = setTimeout(() => {
      fetchData(url.geo(searchField.value), function (locations) {
        searchField.classList.remove("searching");
        searchResult.classList.add("active");
        searchResult.innerHTML = `
         <ul class="view-list" data-search-list></ul>
        `;

        const items = [];

        for (const { name, lat, lon, country, state } of locations) {
         const searchItem = document.createElement("li");
         searchItem.classList.add("view-item");

         searchItem.innerHTML = `
            <span class="m-icon1">location_on</span>

            <div>
               <p>${name}</p>
               <p class="item-subtitle">${state || ""} ${country}</p>
            </div>

            <a href="#/weather?lat=${lat}&lon=${lon}" aria-label="${name} weather" data-search-toggler></a>
         `;

            searchResult.querySelector("[data-search-list]").appendChild(searchItem);
            items.push(searchItem.querySelector("[data-search-toggler]"));
         }

            addEventOnElements(items, "click", function () {
            toggleSearch();
               searchResult.classList.remove("active");
            })
         });
      }, searchTimeoutDuration);
   }
});

const container = document.querySelector('[data-container]');
const loading = document.querySelector('[data-loading]');
const currentLocationBtn = document.querySelector('[data-current-location-btn]');
const errorContent = document.querySelector('[data-error-content]');
 
// render all weather data in html page
// * latitude
// * longitude

export const updateWeather = function(lat, lon) {
   // loading.style.display = 'grid';
   container.style.overflowY = 'hidden';
   container.classList.remove('fade-in');
   errorContent.style.display = 'none';

   const currentWeatherSection = document.querySelector('[data-current-weather]');
   const highlightSection = document.querySelector('[data-highlights]');
   const hourlySection = document.querySelector('[data-hourly-forecast]');
   const forecastSection = document.querySelector('[data-5-day-forecast]');

   currentWeatherSection.innerHTML = "";
   highlightSection.innerHTML = "";
   hourlySection.innerHTML = "";
   forecastSection.innerHTML = "";

   if (window.location.hash === '#/current-location') {
      currentLocationBtn.setAttribute('disabled', "");
   } else {
      currentLocationBtn.removeAttribute('disabled');
   }



   // current weather section

   fetchData(url.currentWeather(lat, lon), function(currentWeather) {
      const { // objects json api
         weather,
         dt: dateUnix,
         sys: { sunrise: sunriseUnixUTC, sunset: sunsetUnixUTC },
         main: { temp, feels_like, pressure, humidity },
         visibility,
         timezone
      } = currentWeather
      const [{ description, icon }] = weather;

      const card = document.createElement('div');
      card.classList.add('current-weather-card');

      card.innerHTML = `
         <h2>Now</h2>
         <div>
            <p>${parseInt(temp)}<span>&deg;</span><sup>c</sup></p>
            <img src="assets/img/weather-icons/${icon}.png" alt="${description}">
         </div>

         <div>
            <p>${description}</p>
         </div>
         
         <ul>
            <li>
               <span class="m-icon1">calendar_today</span>
               <p>${module.getDate(dateUnix, timezone)}</p>
            </li>
               
            <li>
               <span class="m-icon1">location_on</span>
               <p data-location></p>
            </li>
         </ul>
      `;

      fetchData(url.reverseGeo(lat, lon), function([{ name, country }]) {
         card.querySelector('[data-location]').innerHTML = `${name}, ${country}`
      });

      currentWeatherSection.appendChild(card);



      // today's highlights section

      fetchData(url.airPollution(lat, lon), function (airPollution) {
         const [{
            main: { aqi },
            components: { no2, o3, so2, pm2_5 }
         }] = airPollution.list;

         const card = document.createElement('div');
         card.classList.add('card');
         
         card.innerHTML = `
            <h2>Today's Highlights</h2>
            <div class="highlights-list">
               <div class="card-highlights one">
                  <h3>Air Quality Index</h3>
                  <div>
                     <span class="m-icon2">air</span>
                     
                     <ul>
                        <li>
                           <p>${pm2_5.toFixed(2)}</p>
                           <p>PM<span>2.5</span></p>
                        </li>

                        <li>
                           <p>${so2.toFixed(2)}</p>
                           <p>SO<span>2</span></p>
                        </li>

                        <li>
                           <p>${no2.toFixed(2)}</p>
                           <p>NO<span>2</span></p>
                        </li>

                        <li>
                           <p>${o3.toFixed(2)}</p>
                           <p>O<span>3</span></p>
                        </li>
                     </ul>
                  </div>

                  <span class="badge aqi-${aqi}" title="${module.aqiText[aqi].message}">
                     ${module.aqiText[aqi].level}
                  </span>
               </div>

               <div class="card-highlights two">
                  <h3>Sunrise & Sunset</h3>
                  <div>
                     <div>
                        <span class="m-icon2">clear_day</span>
                        <div class="time">
                           <p>Sunrise</p>
                           <p>${module.getTime(sunriseUnixUTC, timezone)}</p>
                        </div>
                     </div>

                     <div>
                        <span class="m-icon2">clear_night</span>
                        <div class="time">
                           <p>Sunset</p>
                           <p>${module.getTime(sunsetUnixUTC, timezone)}</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div class="card-highlights card-title">
                  <h3>Pressure</h3>
                  <div>
                     <span class="m-icon2">airwave</span>
                     <p>${pressure}<span>hPa</span></p>
                  </div>
               </div>

               <div class="card-highlights card-title">
                  <h3>Visibility</h3>
                  <div>
                     <span class="m-icon2">visibility</span>
                     <p>${visibility / 1000}<span>km</span></p>
                  </div>
               </div>

               <div class="card-highlights card-title">
                  <h3>Humidity</h3>
                  <div>
                     <span class="m-icon2">humidity_percentage</span>
                     <p>${humidity}<span>%</span></p>
                  </div>
               </div>

               <div class="card-highlights card-title">
                  <h3>Feels Like</h3>
                  <div>
                     <span class="m-icon2">thermostat</span>
                     <p>${parseInt(feels_like)}º<sup>c</sup></p>
                  </div>
               </div>
            </div>
         `;

         highlightSection.appendChild(card);
      });



      // hourly forecast section

      fetchData(url.forecast(lat, lon), function(forecast) {

         const {
            list: forecastList,
            city: { timezone }
         } = forecast;

         hourlySection.innerHTML = `
            <h2>Today at</h2>
            <div>
               <ul class="slider-list" data-temp></ul>

               <ul class="slider-list slider-list2" data-wind></ul>
            </div>
         `;

         for (const [index, data] of forecastList.entries()) {
            if (index > 7) break;

            const { 
               dt: dateTimeUnix,
               main: { temp },
               weather,
               wind: { deg: windDirection, speed: windSpeed }
            } = data
            const [{ icon, description }] = weather

            const tempLi = document.createElement('li');
            tempLi.classList.add('slider-item');

            tempLi.innerHTML = `
               <div>
                  <p>${module.getHours(dateTimeUnix, timezone)}</p>
                  <img src="assets/img/weather-icons/${icon}.png" alt="${description}" width="50px" loading="lazy" title="${description}">
                  <p>${parseInt(temp)}º</p>
               </div>
            `;
            hourlySection.querySelector('[data-temp]').appendChild(tempLi);

            const windLi = document.createElement('li');
            windLi.classList.add('slider-item');

            windLi.innerHTML = `
               <div>
                  <p>${module.getHours(dateTimeUnix, timezone)}</p>
                  <img src="assets/img/icons/direction.png" alt="direction" width="50px" loading="lazy" style="transform: rotate(${windDirection - 180}deg)">
                  <p>${parseInt(module.mpsToKmh(windSpeed))} km/h</p>
               </div>
            `;

            hourlySection.querySelector('[data-wind]').appendChild(windLi);
         }



         // forecast section

         forecastSection.innerHTML = `
            <div class="container-forecast" aria-labelledby="forecast-label" data-5-day-forecast>
               <div>
                  <ul data-forecast-list></ul>
               </div>
            </div>
         `;
         
         for (let i = 7, len = forecastList.length; i < len; i += 8) {
            const {
               main: { temp_max },
               weather,
               dt_txt
            } = forecastList[i];
            const [{ icon, description }] = weather
            const date = new Date(dt_txt);

            const li = document.createElement('li');

            li.innerHTML = `
               <div>
                  <div>
                     <img src="assets/img/weather-icons/${icon}.png" alt="${description}" title="${description}" width="36px">
                     <span>${parseInt(temp_max)}º</span>
                  </div>
               </div>
               <p>${date.getDate()} ${module.monthNames[date.getUTCMonth()]}</p>
               <p>${module.weekDayNames[date.getUTCDay()]}</p>
            `;

            forecastSection.querySelector('[data-forecast-list]').appendChild(li);
         }

         loading.style.display = 'none';
         container.style.overflowY = 'overlay';
         container.classList.add('fade-in');
      });
   });
}

export const error404 = () => errorContent.style.display = 'flex';