// ---------- 1. Get the elements from the HTML ----------
var searchForm = document.querySelector(".search-box form");
var destinationInput = document.getElementById("search-destination");
var checkinInput = document.getElementById("search-checkin");
var checkoutInput = document.getElementById("search-checkout");
var header = document.querySelector(".site-header");
var hotelCards = document.querySelectorAll("#popular-stays .destination-card");
var hotelGrid = document.querySelector("#popular-stays .cards-grid");


// ---------- 2. Small helper functions ----------

// Convert a Date object to "yyyy-mm-dd" (the format <input type="date"> needs)
function formatDate(date) {
  var year = date.getFullYear();
  var month = String(date.getMonth() + 1).padStart(2, "0");
  var day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

// Add some days to today's date
function daysFromToday(days) {
  var d = new Date();
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

// Number of nights between two date strings
function countNights(checkin, checkout) {
  var start = new Date(checkin);
  var end = new Date(checkout);
  var milliseconds = end - start;
  return Math.round(milliseconds / (1000 * 60 * 60 * 24));
}

// Scroll smoothly to a section using its id
function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({ behavior: "smooth" });
}


// ---------- 3. Set default dates ----------
// The dates written in the HTML are old, so we set new ones from today.
checkinInput.min = daysFromToday(0);
checkinInput.value = daysFromToday(7);
checkoutInput.min = daysFromToday(1);
checkoutInput.value = daysFromToday(11);

// When check-in changes, check-out must be at least 1 day later
checkinInput.addEventListener("change", function () {
  var nextDay = new Date(checkinInput.value);
  nextDay.setDate(nextDay.getDate() + 1);
  checkoutInput.min = formatDate(nextDay);

  if (checkoutInput.value <= checkinInput.value) {
    checkoutInput.value = formatDate(nextDay);
  }
});


// ---------- 4. "No hotels found" message ----------
var noResultMessage = document.createElement("p");
noResultMessage.textContent = "No hotels found for this destination. Try Kyoto, Amalfi or Aspen.";
noResultMessage.style.textAlign = "center";
noResultMessage.style.gridColumn = "1 / -1";
noResultMessage.style.display = "none"; // hidden at the start
hotelGrid.appendChild(noResultMessage);


// ---------- 5. Filter hotels by destination ----------
function filterHotels(searchText) {
  // use only the city name (text before the comma), in lowercase
  var city = searchText.split(",")[0].trim().toLowerCase();
  var found = 0;

  for (var i = 0; i < hotelCards.length; i++) {
    var card = hotelCards[i];
    // the first <span> inside the card body holds the location (e.g. "Kyoto, Japan")
    var location = card.querySelector(".destination-card-body span").textContent.toLowerCase();

    if (city === "" || location.includes(city)) {
      card.style.display = "flex";
      found++;
    } else {
      card.style.display = "none";
    }
  }

  // show or hide the "no hotels" message
  if (found === 0) {
    noResultMessage.style.display = "block";
  } else {
    noResultMessage.style.display = "none";
  }

  return found;
}


// ---------- 6. Search form ----------
searchForm.addEventListener("submit", function (event) {
  event.preventDefault(); // stop the page from going to results.html

  var destination = destinationInput.value.trim();

  // Validation
  if (destination === "") {
    alert("Please enter a destination.");
    return;
  }
  if (checkoutInput.value <= checkinInput.value) {
    alert("Check-out date must be after the check-in date.");
    return;
  }

  var found = filterHotels(destination);
  scrollToSection("popular-stays");

  if (found > 0) {
    var nights = countNights(checkinInput.value, checkoutInput.value);
    alert(found + " hotel(s) found for " + nights + " night(s).");
  }
});


// ---------- 7. Handle all links ----------
// Our project has only ONE html page, so links to the old pages
// (results.html, hotel.html ...) should do something useful instead.
var allLinks = document.querySelectorAll("a");

allLinks.forEach(function (link) {
  var href = link.getAttribute("href");

  // (a) Links to results.html
  if (href === "results.html") {
    link.addEventListener("click", function (event) {
      event.preventDefault();

      // If the link is inside a destination card, filter by that city
      var destinationCard = link.closest(".cards-grid-4 .destination-card");
      if (destinationCard) {
        var cityName = destinationCard.querySelector("h3").textContent;
        destinationInput.value = cityName;
        filterHotels(cityName);
      } else {
        // otherwise show all hotels
        filterHotels("");
      }
      scrollToSection("popular-stays");
    });
  }

  // (b) "View Hotel" buttons -> simple booking
  else if (href === "hotel.html" && link.closest("#popular-stays")) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      bookHotel(link.closest(".destination-card"));
    });
  }

  // (c) Other old pages (footer links) -> go to hotels section
  else if (href === "hotel.html" || href === "reservation.html" || href === "confirmation.html") {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      scrollToSection("popular-stays");
    });
  }

  // (d) Sign in link
  else if (href === "#signin") {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      var email = prompt("Enter your email to sign in:");
      if (email && email.includes("@")) {
        link.textContent = "Hi, " + email.split("@")[0];
      } else if (email !== null) {
        alert("Please enter a valid email address.");
      }
    });
  }

  // (e) Footer links with no section (#help, #privacy ...)
  else if (href && href.startsWith("#") && href.length > 1) {
    var targetId = href.substring(1);
    if (document.getElementById(targetId) === null) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        alert("This page is not available in the demo.");
      });
    }
  }
});


// ---------- 8. Booking function ----------
function bookHotel(card) {
  var hotelName = card.querySelector("h3").textContent;
  var priceText = card.querySelector(".avg-price strong").textContent; // e.g. "$340"
  var price = Number(priceText.replace("$", ""));
  var nights = countNights(checkinInput.value, checkoutInput.value);
  var total = price * nights;

  var guestName = prompt("Booking: " + hotelName + "\nEnter your full name:");
  if (guestName === null) {
    return; // user pressed Cancel
  }
  if (guestName.trim() === "") {
    alert("Name is required to book.");
    return;
  }

  // make a random booking id like SE-4821
  var bookingId = "SE-" + Math.floor(1000 + Math.random() * 9000);

  alert(
    "Reservation confirmed!\n\n" +
    "Booking ID: " + bookingId + "\n" +
    "Guest: " + guestName + "\n" +
    "Hotel: " + hotelName + "\n" +
    "Check-in: " + checkinInput.value + "\n" +
    "Check-out: " + checkoutInput.value + "\n" +
    "Nights: " + nights + "\n" +
    "Total: $" + total
  );
}


// ---------- 9. Header shadow when scrolling ----------
window.addEventListener("scroll", function () {
  if (window.scrollY > 10) {
    header.style.boxShadow = "0 6px 20px rgba(19, 38, 35, 0.12)";
  } else {
    header.style.boxShadow = "none";
  }
});