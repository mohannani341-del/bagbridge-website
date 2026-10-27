const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".main-nav");
if (menuButton && nav) {
  menuButton.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
  }));
}
const dateInputs = document.querySelectorAll('input[type="date"]');
const today = new Date();
const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
dateInputs.forEach((input) => input.min = localToday);

function initBagBridgeAutocomplete() {
  if (!window.google || !google.maps || !google.maps.places) return;
  const setup = (locationId, zipId) => {
    const locationInput = document.getElementById(locationId);
    const zipInput = document.getElementById(zipId);
    if (!locationInput || !zipInput) return;
    const autocomplete = new google.maps.places.Autocomplete(locationInput, {
      types: ["geocode"],
      fields: ["formatted_address", "address_components", "geometry", "name"]
    });
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place || !place.geometry) return;
      locationInput.value = place.formatted_address || place.name || locationInput.value;
      const components = place.address_components || [];
      const postal = components.find((component) => component.types.includes("postal_code"));
      if (postal && !zipInput.value.trim()) zipInput.value = postal.long_name;
    });
  };
  setup("pickup-location", "pickup-zip");
  setup("delivery-location", "delivery-zip");
}
window.initBagBridgeAutocomplete = initBagBridgeAutocomplete;

const form = document.querySelector("#quote-form");
if (form) {
  form.addEventListener("submit", (event) => {
    const requiredFields = ["pickup_location", "pickup_zip", "delivery_location", "delivery_zip"];
    for (const name of requiredFields) {
      if (!form.elements[name].value.trim()) {
        event.preventDefault();
        form.elements[name].focus();
        alert("Please enter both pickup and delivery areas and their ZIP/postal codes.");
        return;
      }
    }
  });
}
