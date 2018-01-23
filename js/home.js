// Assign email to heading
var nameHeading = $('#heading-name');

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.
    console.log("User signed in!");
    nameHeading.text(user.displayName);
  }
  else {
    // User is signed out.
    console.log("User signed out!");
    window.location.href = "login.html";
  }
});

// Logout listener
$('#btn-logout').click(function() {
  firebase.auth().signOut().catch(function (error) {
    console.log(error);
  });
});

// View profile listener
$('#btn-view-profile').click(function() {
  window.location.href = "profile.html";
});

// Load maps
var map;

function initMap() {

  // Start from default position
  var uluru = {lat: -25.363, lng: 131.044};

  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 4,
    center: uluru
  });

  // Close windows when clicked away from them
  map.addListener('click', function() {
    console.log("CLICK!");

    if (openWindow != null) {
      openWindow.close();
      openWindow = null;
      popupWindow.css('visibility', 'hidden');
    }
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
var locations2Ref = database.ref('locations_2')
var geofire = new GeoFire(locationsRef);
var geofire2 = new GeoFire(locations2Ref);

var headingField = $('#name');
var coverPhoto = $('#image').find('img');
var hasChangingField = $('#hasChanging');
var hasFeedingField = $('#hasFeeding');
var hasWarmingField = $('#hasWarming');

var cleanlinessRatingField = $('#rating-cleanliness');
var facilitiesRatingField = $('#rating-facilities');
var privacyRatingField = $('#rating-privacy');

var emptyStar = '<i class="fa fa-star-o" aria-hidden="true"></i>';
var fullStar = '<i class="fa fa-star" aria-hidden="true"></i>';

var commentSection = $('#comments');
var noCommentsText = $('#text-no-comments');

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

facilitiesRef.limitToFirst(100).once('value', function(snapshot) {
  snapshot.forEach(function (childsnapshot) {

    var key = childsnapshot.key;

    // Get facility location
    geofire.get(key).then(function(location) {

      // Place marker
      var childData = childsnapshot.val();

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

      // Load the facility information when its marker is clicked
      marker.addListener('click', function() {
        map.panTo(marker.position);

        infowindow.open(map, marker);

        noCommentsText.css('display', 'none');

        // On InfoWindow Close
        google.maps.event.addListener(infowindow,'closeclick',function() {
          openWindow = null;
          popupWindow.css('visibility', 'hidden');
        });

        // Close existing info windows that are open
        if (openWindow != null && openWindow != infowindow) {
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

        // Display comments
        firebase.database().ref('comments/' + key).once('value', function(snapshot) {

          if (snapshot.val() == null) {
            console.log("No comments found");
            noCommentsText.css('display', 'block');
          }
          else {
            noCommentsText.css('display', 'none');
            commentSection.html('');

            snapshot.forEach(function (childsnapshot) {
              var val = childsnapshot.val();

              var datetime = convertToDate(val.createdAt);

              // Get the user's name
              var userId = val.user;

              for (var i = 0; i < 5; i++) {
                firebase.database().ref('users/' + userId + '/name').once('value', function(snapshot) {
                  var name = snapshot.val();
                  var comment = $('<p class="comment">"' + val.text + '" <br>' + name + ', ' + datetime + '</p>');
                  commentSection.prepend(comment);
                });
              }
            });
          }
        });

        // Show pop-up
        popupWindow.css('visibility', 'visible');
      });

    });
  });
});

function convertToDate(timestamp) {
  var datetime = new Date(timestamp);

  var date = datetime.toLocaleDateString();
  var time = datetime.getHours() + ':' + datetime.getMinutes();

  var isToday = (new Date().toDateString() == datetime.toDateString());

  if (isToday) {
    return time;
  }
  else {
    return date;;
  }
}
