// Assign email to heading
var emailHeading = $('#heading-email');

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.
    console.log("User signed in!");

    var email = user.email;
    emailHeading.html(email);
  }
  else {
    // User is signed out.
    console.log("User signed out!");
    window.location.href = "login.html";
  }
});

// Logout listener
var logoutBtn = $('#btn-logout');

logoutBtn.click( function() {
  firebase.auth().signOut().catch(function (error) {
    console.log(error);
  });
});

// Load maps
var map;

function initMap() {

  var uluru = {lat: -25.363, lng: 131.044};

  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 4,
    center: uluru
  });

  // Try and get location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {

      // Center map in found location
      var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      map.setCenter(pos);
      map.setZoom(12);

      // Set marker
      var marker = new google.maps.Marker({
        position: pos,
        map: map,
        icon: 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|193'
      });

      var infowindow = new google.maps.InfoWindow({
        content: 'Your current location'
      });

      // On map click (no marker)
      map.addListener('click', function() {
        console.log("CLICK!");
      });


      // Marker click listener
      marker.addListener('click', function() {
        infowindow.open(map, marker);

        map.panTo(marker.position);

        // Close existing info windows that are open
        if (openWindow != null) {
          openWindow.close();
        }
        openWindow = infowindow;
      });
    }, function() {
      console.log("Unable to get location");
    });
  }
}

// Load facilities
var database = firebase.database();
var facilitiesRef = database.ref('facilities');
var locationsRef = database.ref('locations')
var geofire = new GeoFire(locationsRef);

var headingField = $('#name');
var hasChangingField = $('#hasChanging');
var hasFeedingField = $('#hasFeeding');
var hasWarmingField = $('#hasWarming');

var cleanlinessRatingField = $('#rating-cleanliness');
var facilitiesRatingField = $('#rating-facilities');
var privacyRatingField = $('#rating-privacy');

var emptyStar = '<i class="fa fa-star-o" aria-hidden="true"></i>';
var fullStar = '<i class="fa fa-star" aria-hidden="true"></i>';

var openWindow;
var popupWindow = $('#pop-up-facility');
var closeBtn = $('#btn-close');

closeBtn.click(function() {
  if (openWindow != null) {
    openWindow.close();
    openWindow = null;
    popupWindow.css('visibility', 'hidden');
  }
});

facilitiesRef.limitToFirst(2500).on('value', function(snapshot) {
  snapshot.forEach(function (childsnapshot) {
    var key = childsnapshot.key;

    // Get facility location
    geofire.get(key).then(function(location) {

      // Place marker
      var childData = childsnapshot.val();

      // var contentString =
      // '<img src="https://images.unsplash.com/photo-1504087697492-238a6bf49ce8?auto=format&fit=crop&w=500&q=180" alt="Facility Image">'
      // + '<h1>' + childData.name + '</h1>'
      // + "Changing : " + childData.facilities.changing + '</br>'
      // + "Feeding: " + childData.facilities.feeding + '</br>'
      // + "Warming : " + childData.facilities.warming + '</br>';

      // Create infoWindow
      var infowindow = new google.maps.InfoWindow({
        content: 'Selected'
      });

      // Create a marker
      var pos = {lat: location[0], lng: location[1]};
      var marker = new google.maps.Marker({
        position: pos,
        map: map,
        icon: 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|944'
      });

      // // Add a marker listener
      // marker.addListener('click', function() {
      //   infowindow.open(map, marker);
      //
      //   // Close existing info windows that are open
      //   if (openWindow != null) {
      //     openWindow.close();
      //   }
      //
      //   openWindow = infowindow;
      // });

      // Center map on the selected marker
      marker.addListener('click', function() {
        map.panTo(marker.position);

        infowindow.open(map, marker);

        // On InfoWindow Close
        google.maps.event.addListener(infowindow,'closeclick',function() {
          openWindow = null;
          popupWindow.css('visibility', 'hidden');
        });

        // Close existing info windows that are open
        if (openWindow != null) {
          openWindow.close();
        }
        openWindow = infowindow;

        var name = childData.name;
        if (name.charAt(0) === '"') {
          name = name.substr(1).slice(0, -1);
        }

        headingField.text(name);
        hasChangingField.text(childData.facilities.changing);
        hasFeedingField.text(childData.facilities.feeding);
        hasWarmingField.text(childData.facilities.warming);

        // Display rating stars
        var ratingFields = [cleanlinessRatingField, facilitiesRatingField, privacyRatingField];

        for (var i = 0; i < ratingFields.length; i++) {
          var ratingField = ratingFields[i];
          ratingField.text("");

          // Get random number for rating
          var rating = Math.floor(Math.random() * 5);
          var emptyStars = 5 - rating;

          for (var j = 0; j < rating; j++) {
            ratingField.append(fullStar);
          }

          for (var n = 0; n < emptyStars; n++) {
            ratingField.append(emptyStar);
          }
        }

        // Show pop-up
        popupWindow.css('visibility', 'visible');
      });

    });
  });
});
