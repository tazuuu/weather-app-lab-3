const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const errorBox = document.getElementById("error");
const loadingBox = document.getElementById("loading");
const weatherBox = document.getElementById("weather");

const DATA_URL = "weather-data.json";

function ajax(method, url) {
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.responseText);
      } else {
        let message = "Request failed with status " + xhr.status;
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.error) message = data.error;
        } catch (e) {}
        reject(new Error(message));
      }
    };
    xhr.onerror = function () {
      reject(new Error("Network error. Make sure the server is running."));
    };
    xhr.send();
  });
}

let storeCache = null;

async function loadWeatherStore() {
  if (storeCache) return storeCache;
  const text = await ajax("GET", DATA_URL);
  storeCache = JSON.parse(text);
  return storeCache;
}

async function getWeatherJson(cityName) {
  const store = await loadWeatherStore();
  const key = cityName.trim().toLowerCase();
  const data = store.cities[key];
  if (!data) {
    throw new Error('No weather data found for "' + cityName.trim() + '". Try another city.');
  }
  return data;
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

function renderCurrent(data) {
  const c = data.current;

  document.getElementById("city-name").textContent = data.city;
  document.getElementById("country-name").textContent = data.country;
  document.getElementById("local-date").textContent = c.localDate;
  document.getElementById("temperature").textContent = c.temperature + "\u00B0C";
  document.getElementById("description").textContent = c.icon + " " + c.description;
}

function renderForecast(data) {
  const box = document.getElementById("forecast-list");
  box.innerHTML = "";

  data.forecast.forEach(function (day) {
    const el = document.createElement("div");
    el.className = "forecast-day";

    const label = document.createElement("div");
    label.className = "day";
    label.textContent = day.day;

    const icon = document.createElement("div");
    icon.className = "icon";
    icon.textContent = day.icon;

    const temp = document.createElement("div");
    temp.className = "temp";
    temp.innerHTML =
      Math.round(day.max) + "\u00B0 " +
      '<span class="min">' + Math.round(day.min) + "\u00B0</span>";

    el.appendChild(label);
    el.appendChild(icon);
    el.appendChild(temp);
    box.appendChild(el);
  });
}

async function searchWeather(location) {
  if (!location.trim()) return;
  clearError();
  showLoading();

  try {
    const data = await getWeatherJson(location);
    renderCurrent(data);
    renderForecast(data);
    hideLoading(true);
  } catch (err) {
    hideLoading(false);
    showError(err.message || "Failed to load weather.");
  }
}

searchBtn.addEventListener("click", function () {
  searchWeather(cityInput.value);
});

cityInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") searchWeather(cityInput.value);
});

window.addEventListener("load", function () {
  searchWeather("Puducherry");
});
