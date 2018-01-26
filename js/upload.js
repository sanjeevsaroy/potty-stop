var lat;
var lon;
var marker;
var london;

$('#btn-back').click(function() {
  window.location.href = "home.html";
});

function initMap() {

  // Start from default position
  london = {lat: 51.5033640, lng: -0.1276250};

  map = new google.maps.Map(document.getElementById('map-small'), {
    zoom: 7,
    center: london
  });

  // Set marker
  marker = new google.maps.Marker({
    position: london,
    map: map,
    icon: 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|193',
    draggable: true
  });

  lat = london.lat;
  lng = london.lng;

  marker.addListener('dragend', function() {
    lat = marker.position.lat();
    lng = marker.position.lng();
  })
}

$('#btn-upload').click(function() {
  var nameField = $('input:text');
  var name = nameField.val();
  var checked = $('input:checkbox:checked');

  var hasChanging = false;
  var hasFeeding = false;
  var hasWarming = false;

  checked.each(function() {
    if (this.value === 'hasChanging') {
      hasChanging = true;
    }
    else if (this.value === 'hasFeeding') {
      hasFeeding = true;
    }
    else if (this.value === 'hasWarming') {
      hasWarming = true;
    }
  });

  if (name.length === 0) {
    alert('Please enter a name for the facility');
  }
  else {
    var ts = Math.round((new Date()).getTime() / 1000);

    var facility = {
      name: name,
      facilities: {
        hasChanging: hasChanging,
        hasFeeding: hasFeeding,
        hasWarming: hasWarming,
      },
      updatedAt: ts
    }

    var activity = {
      name: name,
      type: "facility",
      createdAt: ts
    };

    // Upload facility to facilities list
    var facilityKey = firebase.database().ref('facilities').push().key;
    console.log(facilityKey);
    firebase.database().ref('facilities/' + facilityKey).set(facility);

    // Upload location to locations list
    var locationsRef = firebase.database().ref('locations');
    var geofire = new GeoFire(locationsRef);
    geofire.set(facilityKey, [lat, lng]);

    // Upload facility key to user's list of facilities
    var userId = firebase.auth().currentUser.uid;
    firebase.database().ref('users/' + userId + '/facilities/' + facilityKey).set(true);

    // Add to list of user's activity
    firebase.database().ref('users/' + userId + '/activity/' + facilityKey).set(activity);

    alert(name + ' has been uploaded successfully!');

    nameField.val('');
    marker.setPosition(new google.maps.LatLng(london.lat,london.lng));
  }
});
