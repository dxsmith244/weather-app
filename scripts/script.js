const apiKey = "5fc804f7398743c082d144151241911"; // Replace with your WeatherAPI key

// DOM Elements
const form = document.getElementById("city-form");
const searchInput = document.getElementById("search-input");
const weatherDiv = document.querySelector(".weather");
const errorDiv = document.querySelector(".error");
const loadingDiv = document.querySelector(".loading");
const locationButton = document.getElementById("current-location-btn"); // Geolocation button
const searchButton = document.getElementById("search-btn");
const recentSearchList = document.getElementById("recent-search-list");
const citySuggestionsDatalist = document.getElementById("city-suggestions");

// Weather Elements
const behaviorElem = document.getElementById("behavior");
const tempElem = document.getElementById("temp");
const feelslikeElem = document.getElementById("feelslike");
const weatherIconElem = document.getElementById("weather-icon");
const humidityElem = document.getElementById("humidity");
const windSpeedElem = document.getElementById("wind-speed");
const cityElem = document.getElementById("city");
const rainElem = document.getElementById("chance-rain");
const snowElem = document.getElementById("chance-snow");

// Persistent Recent Searches
let recentSearches = JSON.parse(localStorage.getItem("recentSearches")) || [];

// Updates the UI with recent searches in the datalist
function updateRecentSearches(city) {
  if (city && !recentSearches.includes(city)) {
    recentSearches.unshift(city);
    if (recentSearches.length > 5) recentSearches.pop();
  }
  localStorage.setItem("recentSearches", JSON.stringify(recentSearches));

  citySuggestionsDatalist.innerHTML = "";

  recentSearches.forEach((search) => {
    const option = document.createElement("option");
    option.value = search;
    citySuggestionsDatalist.appendChild(option);
  });
}

// Fetches weather data from the API
async function fetchWeather(city) {
  try {
    loadingDiv.hidden = false;
    errorDiv.hidden = true;
    weatherDiv.hidden = true;
    document.querySelector(".forecast").hidden = true;

    const apiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=7&aqi=no&alerts=no`;
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Failed to fetch weather data.");

    const data = await response.json();
    updateWeatherUI(data);
    updateForecastUI(data.forecast.forecastday);
  } catch (error) {
    errorDiv.hidden = false;
  } finally {
    loadingDiv.hidden = true;
  }
}

// Updates the current weather UI
function updateWeatherUI(data) {
  const { name, country, region } = data.location;
  const { temp_f, condition, humidity, wind_mph, feelslike_f } = data.current;
  const chanceOfRain = data.forecast.forecastday[0].day.daily_chance_of_rain || 0;
  const chanceOfSnow = data.forecast.forecastday[0].day.daily_chance_of_snow || 0;

  behaviorElem.textContent = condition.text;
  tempElem.textContent = temp_f;
  feelslikeElem.textContent = feelslike_f;
  weatherIconElem.src = `https:${condition.icon}`;
  weatherIconElem.alt = condition.text;
  humidityElem.textContent = humidity;
  windSpeedElem.textContent = Math.round(wind_mph);
  cityElem.textContent = `${name}, ${region}, ${country}`;
  rainElem.textContent = `${chanceOfRain}%`;
  snowElem.textContent = `${chanceOfSnow}%`;

  weatherDiv.hidden = false;
}

// Updates the forecast cards UI
function updateForecastUI(forecast) {
  const forecastCards = document.getElementById("forecast-cards");
  forecastCards.innerHTML = "";

  forecast.forEach((day) => {
    const { date, day: dayData } = day;
    const { condition, maxtemp_f, mintemp_f, daily_chance_of_rain, daily_chance_of_snow } = dayData;

    // Parse the date correctly
    const localDate = new Date(date + "T00:00:00");

    const card = document.createElement("div");
    card.className = "forecast-card";

    card.innerHTML = `
      <h3>${localDate.toLocaleDateString("en-US", { weekday: "long" })}</h3>
      <p class="date">${localDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
      <img src="https:${condition.icon}" alt="${condition.text}">
      <p>${condition.text}</p>
      <p>High: ${Math.round(maxtemp_f)}°F</p>
      <p>Low: ${Math.round(mintemp_f)}°F</p>
      <p>Chance of Rain: ${daily_chance_of_rain || 0}%</p>
      <p>Chance of Snow: ${daily_chance_of_snow || 0}%</p>
    `;
    forecastCards.appendChild(card);
  });

  document.querySelector(".forecast").hidden = false;
}

// Fetches weather for the current location
function getCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => fetchWeather(`${latitude},${longitude}`),
      () => alert("Unable to retrieve your location.")
    );
  } else {
    alert("Geolocation is not supported by this browser.");
  }
}

// Fetches city suggestions from the Weather API based on the user's input
async function fetchCitySuggestions(query) {
  try {
    if (!query) return;

    const apiUrl = `https://api.weatherapi.com/v1/search.json?key=${apiKey}&q=${query}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    citySuggestionsDatalist.innerHTML = "";

    data.forEach((city) => {
      const option = document.createElement("option");
      option.value = `${city.name}, ${city.region}, ${city.country}`;
      citySuggestionsDatalist.appendChild(option);
    });
  } catch (error) {
    console.error("Error fetching city suggestions:", error);
  }
}

// Event Listeners
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const city = searchInput.value.trim();
  if (city) {
    fetchWeather(city);
    updateRecentSearches(city);
  } else {
    alert("Please enter a city name.");
  }
});

locationButton.addEventListener("click", (e) => {
  e.preventDefault();
  if (!searchInput.value.trim()) {
    getCurrentLocation();
  } else {
    alert("Clear the city field to use current location.");
  }
});

searchInput.addEventListener("input", () => {
  locationButton.disabled = !!searchInput.value.trim();
  const query = searchInput.value.trim();
  fetchCitySuggestions(query);
});

document.addEventListener("DOMContentLoaded", () => updateRecentSearches(""));
