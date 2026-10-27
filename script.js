const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const errorBox = document.getElementById("error");
const loadingBox = document.getElementById("loading");
const weatherBox = document.getElementById("weather");

const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

const WEATHER_CODES = {
  0:   { text: "Clear sky",            icon: "&#9728;&#65039;" },
  1:   { text: "Mainly clear",         icon: "&#9788;&#65039;" },
  2:   { text: "Partly cloudy",        icon: "&#9925;" },
  3:   { text: "Overcast",             icon: "&#9729;&#65039;" },
  45:  { text: "Foggy",                icon: "&#127787;&#65039;" },
  48:  { text: "Depositing rime fog",  icon: "&#127787;&#65039;" },
  51:  { text: "Light drizzle",        icon: "&#127790;&#65039;" },
  53:  { text: "Drizzle",              icon: "&#127790;&#65039;" },
  55:  { text: "Dense drizzle",        icon: "&#127790;&#65039;" },
  56:  { text: "Freezing drizzle",     icon: "&#127790;&#65039;" },
  57:  { text: "Freezing drizzle",     icon: "&#127790;&#65039;" },
  61:  { text: "Light rain",           icon: "&#127783;&#65039;" },
  63:  { text: "Rain",                 icon: "&#127783;&#65039;" },
  65:  { text: "Heavy rain",           icon: "&#127783;&#65039;" },
  66:  { text: "Freezing rain",        icon: "&#127783;&#65039;" },
  67:  { text: "Freezing rain",        icon: "&#127783;&#65039;" },
  71:  { text: "Light snow",           icon: "&#10052;&#65039;" },
  73:  { text: "Snow",                 icon: "&#10052;&#65039;" },
  75:  { text: "Heavy snow",           icon: "&#10052;&#65039;" },
  77:  { text: "Snow grains",          icon: "&#10052;&#65039;" },
  80:  { text: "Light showers",        icon: "&#127783;&#65039;" },
  81:  { text: "Showers",              icon: "&#127783;&#65039;" },
  82:  { text: "Violent showers",      icon: "&#127783;&#65039;" },
  85:  { text: "Snow showers",         icon: "&#10052;&#65039;" },
  86:  { text: "Heavy snow showers",   icon: "&#10052;&#65039;" },
  95:  { text: "Thunderstorm",         icon: "&#9929;&#65039;" },
  96:  { text: "Thunderstorm w/ hail", icon: "&#9929;&#65039;" },
  99:  { text: "Thunderstorm w/ hail", icon: "&#9929;&#65039;" }
};

function weatherInfo(code) {
  return WEATHER_CODES[code] || { text: "Unknown", icon: "&#9883;&#65039;" };
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

function clearError() {
  errorBox.classList.add("hidden");
  errorBox.textContent = "";
}

function showLoading() {
  loadingBox.classList.remove("hidden");
  weatherBox.classList.add("hidden");
}

function hideLoading(resultsShown) {
  loadingBox.classList.add("hidden");
  if (resultsShown) weatherBox.classList.remove("hidden");
}

// J
async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("HTTP " + response.status);
  return response.json();
}

async function getCity(location) {
  const q = encodeURIComponent(location.trim());
  // JSON: geocoding API returns a JSON results list
  const data = await fetchJSON(`${GEO_URL}?name=${q}&count=1&language=en&format=json`);
  if (!data.results || data.results.length === 0) {
    throw new Error(`No city found for "${location}". Try another name.`);
  }
  return data.results[0];
}

async function getWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,uv_index",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",
    timezone: "auto",
    forecast_days: 7
  });
  // JSON: forecast API returns a JSON object rendered by renderCurrent/renderForecast
  return fetchJSON(`${WEATHER_URL}?${params.toString()}`);
}

function formatDate(dateStr, timezone) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: timezone
  }).format(new Date(dateStr));
}

function windDirection(deg) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

function renderCurrent(city, weather) {
  const current = weather.current;
  const info = weatherInfo(current.weather_code);

  document.getElementById("city-name").textContent = city.name;
  document.getElementById("country-name").textContent =
    (city.country || "") + (city.country_code ? " (" + city.country_code + ")" : "");
  document.getElementById("local-date").textContent =
    formatDate(current.time, weather.timezone);
  document.getElementById("temperature").textContent =
    current.temperature_2m + "°C";
  document.getElementById("description").textContent = info.text;
  document.getElementById("weather-icon").innerHTML = info.icon;

  document.getElementById("feels-like").textContent =
    current.apparent_temperature + "°C";
  document.getElementById("humidity").textContent =
    current.relative_humidity_2m + "%";
  document.getElementById("wind").textContent =
    current.wind_speed_10m + " km/h " + windDirection(current.wind_direction_10m);
  document.getElementById("pressure").textContent =
    current.pressure_msl + " hPa";
  document.getElementById("precipitation").textContent =
    current.precipitation + " mm";
  document.getElementById("uv-index").textContent = current.uv_index;
}

function renderForecast(weather) {
  const list = weather.daily;
  const box = document.getElementById("forecast-list");
  box.innerHTML = "";

  for (let i = 0; i < list.time.length; i++) {
    const day = document.createElement("div");
    day.className = "forecast-day";

    const label = document.createElement("div");
    label.className = "day";
    label.textContent = new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      timeZone: weather.timezone
    }).format(new Date(list.time[i] + "T12:00:00"));

    const icon = document.createElement("div");
    icon.className = "icon";
    icon.innerHTML = weatherInfo(list.weather_code[i]).icon;

    const temp = document.createElement("div");
    temp.className = "temp";
    temp.innerHTML =
      Math.round(list.temperature_2m_max[i]) + "° " +
      '<span class="min">' + Math.round(list.temperature_2m_min[i]) + "°</span>";

    const prob = document.createElement("div");
    prob.className = "day";
    prob.textContent =
      list.precipitation_probability_max[i] != null
        ? "💧 " + list.precipitation_probability_max[i] + "%"
        : "";

    day.appendChild(label);
    day.appendChild(icon);
    day.appendChild(temp);
    if (prob.textContent) day.appendChild(prob);
    box.appendChild(day);
  }
}

async function searchWeather(location) {
  if (!location.trim()) return;
  clearError();
  showLoading();

  try {
    const city = await getCity(location);
    const weather = await getWeather(city.latitude, city.longitude);
    renderCurrent(city, weather);
    renderForecast(weather);
    hideLoading(true);
  } catch (err) {
    hideLoading(false);
    showError(err.message || "Failed to fetch weather. Check your connection.");
  }
}

searchBtn.addEventListener("click", () => searchWeather(cityInput.value));
cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchWeather(cityInput.value);
});

window.addEventListener("load", () => searchWeather("Puducherry"));