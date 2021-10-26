const searchForm = document.getElementById("search-location");
const searchPlacesBtn = document.querySelector("#search-places");
const closeBtn = document.querySelector(".close-btn");
const weatherNavMobileEl = document.querySelector(".weather-nav-mobile");
const searchedLocationsEl = document.querySelector(".searched-locations");
const weatherTodayImg = document.querySelector("#weatherTodayImg");
const todayTemp = document.getElementById("todayTemp");
const todaysConditions = document.getElementById("todayConditions");
const todayDate = document.getElementById("todayDate");
const cityName = document.getElementById("cityName");
const weeklyForecast = document.querySelector(".weekly-forecast ul");
const todaysHighlights = document.querySelector(".todays-highlights");
const geoLocationIcon = document.querySelector(".geo-location");
const progressBar = document.querySelector("#progressbar > div");

let citySearches;

if (JSON.parse(localStorage.getItem("citiesSearched") === null)) {
  citySearches = [];
} else {
  citySearches = JSON.parse(localStorage.getItem("citiesSearched"));
}

const populateUI = (cityData) => {
  // update city name
  cityName.textContent = cityData.cityInfo.title;
  const today = cityData.weatherData[0];
  // set todays weather image
  const weatherTodayImgName = today.weather_state_name.replace(/\s/g, "");
  let weatherTodayImgSrc = `./assets/${weatherTodayImgName}.png`;
  weatherTodayImg.setAttribute("src", weatherTodayImgSrc);
  // set todays temperature
  todayTemp.textContent = Math.floor(today.the_temp);
  todaysConditions.textContent = today.weather_state_name;
  todayDate.textContent = new Date(today.applicable_date).toDateString();

  weeklyForecast.innerHTML = "";

  cityData.weatherData.forEach((day, index) => {
    if (index === 0) {
      return;
    }
    let weatherTodayImg = day.weather_state_name.replace(/\s/g, "");
    let dayHTML = `
            <li>
                <h4>${
                  index === 1
                    ? "Tomorrow"
                    : new Date(day.applicable_date).toDateString()
                }</h4>
                <img src="./assets/${day.weather_state_name.replace(
                  /\s/g,
                  ""
                )}.png" />
                <div class="temps">
                    <div>
                        <span>${Math.floor(day.max_temp)}</span>
                        <span>°C</span>
                    </div>
                    <div>
                        <span>${Math.floor(day.min_temp)}</span>
                        <span>°C</span>
                    </div>
                </div>
            </li>
        `;
    weeklyForecast.innerHTML += dayHTML;
  });

  todaysHighlights.querySelector(".wind-speed").textContent = Math.floor(
    today.wind_speed
  );
  todaysHighlights.querySelector(".humidity").textContent = today.humidity;

  // update progress bar
  progressBar.style.width = today.humidity + "%";

  todaysHighlights.querySelector(".visibility").textContent = today.visibility
    .toFixed(1)
    .replace(".", ",");
  todaysHighlights.querySelector(".air-pressure").textContent = Math.floor(
    today.air_pressure
  );
};

const getCityData = async (woeid, cityInfo) => {
  let cityData = [];
  try {
    const res = await fetch(
      `https://cors-anywhere.herokuapp.com/https://www.metaweather.com/api/location/${woeid}/`
    );
    const data = await res.json();
    cityData = {
      weatherData: data.consolidated_weather,
      cityInfo: cityInfo,
    };
    populateUI(cityData);
    return cityData;
  } catch (err) {
    console.log(err.message);
  }
};

const getCityWeather = async (city) => {
  try {
    const res = await fetch(
      `https://cors-anywhere.herokuapp.com/https://www.metaweather.com/api/location/search/?query=${city}`
    );
    const data = await res.json();
    await getCityData(data[0].woeid, data[0]);
  } catch (err) {
    console.log(err.message);
  }
};

const getCityByLat = async (position) => {
  try {
    const res = await fetch(
      `https://cors-anywhere.herokuapp.com/https://www.metaweather.com/api/location/search/?lattlong=${position.coords.latitude},${position.coords.longitude}`
    );
    const data = await res.json();
    await getCityData(data[0].woeid, data[0]);
  } catch (err) {
    console.log(err.message);
  }
};

geoLocationIcon.addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(getCityByLat);
  } else {
    console.log("Geolocation is not supported by this browser.");
  }
});

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const searchTerm = searchForm
    .querySelector(".search-location")
    .value.trim("")
    .toLowerCase();

  if (searchTerm !== "") {
    getCityWeather(searchTerm);
    citySearches = JSON.parse(localStorage.getItem("citiesSearched")) || [];
    if (citySearches.length < 4 && !citySearches.includes(searchTerm)) {
      localStorage.setItem(
        "citiesSearched",
        JSON.stringify([...citySearches, searchTerm])
      );
    }
    searchForm.querySelector(".search-location").value = "";
    weatherNavMobileEl.style.transform = "translateX(-100%)";
  }
});

if (citySearches.length !== 0) {
  citySearches.forEach((city) => {
    const searchItem = document.createElement("li");
    searchItem.classList.add("searched-item");
    searchItem.innerHTML = `
          <span>${
            city.split("")[0].toUpperCase() + city.slice(1).toLowerCase()
          }</span>
          <i class="fas fa-chevron-right right-icon"></i>
        `;
    searchedLocationsEl.appendChild(searchItem);
  });
}

searchPlacesBtn.addEventListener("click", () => {
  weatherNavMobileEl.classList.add("active");
  weatherNavMobileEl.style.transform = "translateX(0)";
});

closeBtn.addEventListener("click", () => {
  weatherNavMobileEl.classList.remove("active");
  weatherNavMobileEl.style.transform = "translateX(-100%)";
});

// loop through items and add event listner for each item
searchedLocationsEl.addEventListener("click", (e) => {
  if (e.target.classList.contains("searched-item")) {
    Array.from(searchedLocationsEl.children).forEach((item) => {
      item.classList.remove("active");
    });
    e.target.classList.add("active");
    const citySearch = e.target.textContent.toLowerCase().trim();
    getCityWeather(citySearch);
    weatherNavMobileEl.style.transform = "translateX(-100%)";
  }
});

window.addEventListener("load", () => {
  if (citySearches.length !== 0) {
    getCityWeather(citySearches[citySearches.length - 1]);
  }
});
