firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.
    console.log("User signed in!");
    // Display the user's name
    $('#heading-name').text(user.displayName);
  }
  else {
    // User is signed out.
    console.log("User signed out!");
    window.location.href = "index.html";
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

// View profile listener
$('#btn-upload-facility').click(function() {
  window.location.href = "upload.html";
});

// Load maps
var map;
var london = {lat: 51.5033640, lng: -0.1276250};

function initMap() {

  // Start from default position
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 7,
    center: london
  });

  // Close windows when clicked away from them
  map.addListener('click', function() {
    console.log("CLICK!");

    if (openWindow != null) {
      openWindow.close();
      openWindow = null;
    }

    if (selectedMarker != null) {
      selectedMarker.setIcon(defaultMarkerIcon);
      selectedMarker = null;
    }

    $('#note-text').css('display', 'flex');
    $('#facility-info').css('display', 'none');
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

var titleField = $('#title');
var facilitiesField = $('#facilities');

var cleanlinessRatingField = $('#rating-cleanliness');
var facilitiesRatingField = $('#rating-facilities');
var privacyRatingField = $('#rating-privacy');

var fullStar = '<i class="fas fa-star"></i>';
var emptyStar = '<i class="far fa-star"></i>';

var commentSection = $('#comments');
var noCommentsText = $('#no-comments-text');

var openWindow;
var selectedMarker = null;
var defaultMarkerIcon = 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|9BDEFA';
var selectedMarkerIcon = 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|9D95F0';

facilitiesRef.once('value', function(snapshot) {

  $('#loading-screen').fadeOut('slow', function() {

    $('#amount-loaded').text(snapshot.numChildren());
    $('#container').css('display', 'flex');

    // Set map camera view
    window.dispatchEvent(new Event('resize'));
    map.setCenter(london);

    $('#container').fadeIn('slow', function() {
      $('#popup-facilities').animate({
        top: '0'
      }, 750, function() {
        setTimeout(function() {
          $('#popup-facilities').animate({
            top: '-70px'
          }, 750);
        }, 4000);
      });
    });
  });

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
        icon: defaultMarkerIcon
      });

      // Load the facility information when its marker is clicked
      marker.addListener('click', function() {
        map.panTo(marker.position);

        // Hide info box note
        $('#note-text').css('display', 'none');
        $('#facility-info').css('display', 'block');

        // Change marker colours
        if (selectedMarker !== null) {
          selectedMarker.setIcon(defaultMarkerIcon);
        }
        selectedMarker = marker;
        marker.setIcon(selectedMarkerIcon);

        infowindow.open(map, marker);

        noCommentsText.css('display', 'none');

        // On InfoWindow Close
        google.maps.event.addListener(infowindow,'closeclick',function() {
          openWindow = null;
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

        titleField.text(name);

        var facilitiesString = '';

        if (childData.facilities.changing) {
          facilitiesString = 'Changing';
        }
        if (childData.facilities.feeding) {
          facilitiesString = ', Feeding';
        }
        if (childData.facilities.warming) {
          facilitiesString = ', Warming';
        }

        if (facilitiesString.length === 0) {
          facilitiesString = 'There are no facilities.';
        }
        facilitiesField.text(facilitiesString);

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

// Hide the placeholder when the user clicks on an input
$('input').on('input', function() {
  var input = $(this).val();
  var placeholder = $(this).prev();

  // Show if no text has been input
  if (input.length === 0) {
    placeholder.css('visibility', 'visible');
  }
  else {
    placeholder.css('visibility', 'hidden');
  }
});

// Hide the placeholde when clicked
$('.placeholder').click(function() {
  var inputField = $(this).next();
  inputField.focus();
});

$('#cancel-btn').click(function() {
  var inputField = $('input[name="comment"]');
  var placeholder = $('.placeholder');
  inputField.val('');
  placeholder.css('visibility', 'visible');
})
