// BagBridge website interactions and free US ZIP-code autocomplete.

const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".main-nav");

if (menuButton && nav) {
  menuButton.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    });
  });
}

// Prevent selecting a pickup date in the past.
const dateInputs = document.querySelectorAll('input[type="date"]');
const today = new Date();
const localToday = new Date(
  today.getTime() - today.getTimezoneOffset() * 60000
).toISOString().slice(0, 10);

dateInputs.forEach((input) => {
  input.min = localToday;
});

// Free autocomplete using our locally hosted US ZIP-code dataset.
async function initBagBridgeAutocomplete() {
  const inputs = [
    {
      locationId: "pickup-location",
      zipId: "pickup-zip",
      listId: "pickup-suggestions"
    },
    {
      locationId: "delivery-location",
      zipId: "delivery-zip",
      listId: "delivery-suggestions"
    }
  ];

  let places;

  try {
    const response = await fetch("/static/data/geo-data.csv");

    if (!response.ok) {
      throw new Error("Could not load the ZIP-code dataset.");
    }

    const csv = await response.text();
    const lines = csv.trim().split(/\r?\n/);
    const headers = lines.shift().split(",").map((h) => h.trim());

    const index = {
      zip: headers.indexOf("zipcode"),
      city: headers.indexOf("city"),
      state: headers.indexOf("state"),
      abbreviation: headers.indexOf("state_abbr")
    };

    if (Object.values(index).some((i) => i < 0)) {
      throw new Error("The ZIP-code CSV columns are not as expected.");
    }

    places = lines.map((line) => {
      const columns = line.split(",");
      return {
        zip: (columns[index.zip] || "").trim(),
        city: (columns[index.city] || "").trim(),
        state: (columns[index.state] || "").trim(),
        abbreviation: (columns[index.abbreviation] || "").trim()
      };
    }).filter((place) => place.zip && place.city && place.state);
  } catch (error) {
    console.error("BagBridge autocomplete:", error);
    return;
  }

  inputs.forEach(({ locationId, zipId, listId }) => {
    const locationInput = document.getElementById(locationId);
    const zipInput = document.getElementById(zipId);

    if (!locationInput || !zipInput) return;

    // Add an accessible suggestion list below the location input.
    let list = document.getElementById(listId);


if (!list) {
  list = document.createElement("div");
  list.id = listId;
  list.className = "location-suggestions";
  list.setAttribute("role", "listbox");

  // Position suggestions relative to the location field's container.
  const fieldContainer = locationInput.parentElement;
  fieldContainer.style.position = "relative";

  list.style.position = "absolute";
  list.style.top = "100%";
  list.style.left = "0";
  list.style.right = "0";
  list.style.width = "100%";
  list.style.zIndex = "9999";

  locationInput.insertAdjacentElement("afterend", list);
}
    locationInput.setAttribute("autocomplete", "off");
    locationInput.setAttribute("aria-autocomplete", "list");
    locationInput.setAttribute("aria-controls", listId);

    let matchingPlaces = [];

    function closeSuggestions() {
      list.replaceChildren();
      list.style.display = "none";
      matchingPlaces = [];
    }

    function showSuggestions() {
      const query = locationInput.value.trim().toLowerCase();
      closeSuggestions();

      if (query.length < 2) return;

      matchingPlaces = places.filter((place) => {
        return (
          place.city.toLowerCase().includes(query) ||
          place.state.toLowerCase().includes(query) ||
          place.abbreviation.toLowerCase() === query ||
          place.zip.startsWith(query)
        );
      }).slice(0, 8);

      matchingPlaces.forEach((place) => {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "location-suggestion";
        option.setAttribute("role", "option");
        option.textContent =
          `${place.city}, ${place.abbreviation} ${place.zip}`;

        option.addEventListener("click", () => {
          locationInput.value =
            `${place.city}, ${place.state}`;
          zipInput.value = place.zip;
          closeSuggestions();
          zipInput.dispatchEvent(new Event("change", { bubbles: true }));
        });

        list.appendChild(option);
      });

      list.style.display = matchingPlaces.length ? "block" : "none";
    }

    locationInput.addEventListener("input", showSuggestions);
    locationInput.addEventListener("focus", showSuggestions);

    zipInput.addEventListener("input", () => {
      const zip = zipInput.value.trim();

      if (/^\d{5}$/.test(zip)) {
        const place = places.find((item) => item.zip === zip);

        if (place) {
          locationInput.value = `${place.city}, ${place.state}`;
        }
      }
    });

    document.addEventListener("click", (event) => {
      if (
        event.target !== locationInput &&
        !list.contains(event.target)
      ) {
        closeSuggestions();
      }
    });
  });
}

initBagBridgeAutocomplete();

// Validate required pickup and delivery fields.
const form = document.querySelector("#quote-form");

if (form) {
  form.addEventListener("submit", (event) => {
    const requiredFields = [
      "pickup_location",
      "pickup_zip",
      "delivery_location",
      "delivery_zip"
    ];

    for (const name of requiredFields) {
      const field = form.elements[name];

      if (!field || !field.value.trim()) {
        event.preventDefault();

        if (field) field.focus();

        alert(
          "Please enter both pickup and delivery locations and their ZIP codes."
        );
        return;
      }
    }
  });
}