// Assign email to heading
var nameHeading = $('#heading-name');
var profileImage = $('#img-profile');
var totalFacilitiesField = $('#total-facilities');
var totalCommentsField = $('#total-comments');
var totalRatingsField = $('#total-ratings');
var activityList = $('#list-activity');

var nameInputField = $('#input-name');
var emailInputField = $('#input-email');
var photoUrlInputField = $('#input-photo-url');

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.
    console.log("User signed in!");

    // User info
    nameHeading.text(user.displayName);
    profileImage.attr('src', user.photoURL);
    nameInputField.attr('value', user.displayName);
    emailInputField.attr('value', user.email);

    if (user.photoURL === null) {
      profileImage.attr('src', 'https://www.menon.no/wp-content/uploads/person-placeholder.jpg');
    }
    else {
      profileImage.attr('src', user.photoURL);
    }

    // Get user actions
    firebase.database().ref('users/' + user.uid).once('value')
      .then(function(snapshot) {

          // Add activity stats
          var val = snapshot.val();
          var numOfFacilities;
          var numOfComments;
          var numOfRatings;

          if (val.hasOwnProperty('facilities')) {
            numOfFacilities = Object.keys(val.facilities).length;
          }
          else {
            numOfFacilities = 0;
          }

          if (val.hasOwnProperty('comments')) {
            numOfComments = Object.keys(val.comments).length;
          }
          else {
            numOfComments = 0;
          }

          if (val.hasOwnProperty('ratings')) {
            numOfRatings = val.ratings;
          }
          else {
            numOfRatings = 0;
          }

          totalFacilitiesField.text(numOfFacilities);
          totalCommentsField.text(numOfComments);
          totalRatingsField.text(numOfRatings);

          console.log(numOfFacilities, numOfComments, numOfRatings);

          // Add activity list
          var activities = val.activity;

          // Convert into array
          activities = $.map(activities, function(value, index) {
            return [value];
          });

          // Sort in chronological order
          activities.sort(function(a, b){
              return a.createdAt-b.createdAt;
          });

          for (var i = 0; i < activities.length; i++) {
            var obj = activities[i];
            var activity = new Activity(obj.name, obj.type, obj.createdAt);

            // Insert into activity list
            var activityListItem = createActivityListItem(activity);
            activityList.append(activityListItem);
          }
      })
      .catch(function(error) {
        console.log(error);
      });
  }
  else {
    // User is signed out.
    console.log("User signed out!");
    window.location.href = "login.html";
  }
});

function createActivityListItem(activity) {
  var activityListItem;

  var date = convertToDate(activity.createdAt);

  if (activity.type === 'facility') {
    activityListItem = $('<li>You created the facility ' + activity.name + ' at ' + date + '</li>');
  }
  else {
    activityListItem = $('<li>You created a comment on ' + activity.name + ' at ' + date + '</li>');
  }

  return activityListItem;
}

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

function Activity(name, type, createdAt) {
  this.name = name;
  this.type = type;
  this.createdAt = createdAt;
}

// Logout listener
$('#btn-logout').click( function() {
  firebase.auth().signOut().catch(function (error) {
    console.log(error);
  });
});

// Button to go back
$('#btn-back').click(function() {
  parent.history.back();
});

var isEditing;
var form = $('#form-edit-profile');
var saveSuccessNotice = $('#notice-save-successful');
var currentName;
var currentEmail;
var currentPhotoUrl;

function getCurrentUserInfo() {
  var user = firebase.auth().currentUser;

  // Get existing values
  currentName = user.displayName;
  currentEmail = user.email;
  currentPhotoUrl = user.photoURL;
}

// Edit profile button
$('#btn-edit-profile').click(function() {

  getCurrentUserInfo();

  // Remove previous notice of any successfully-saved changes
  showSaveSuccess(false);

  if (isEditing) {
    isEditing = false;
    form.css('visibility', 'hidden');
  }
  else {
    isEditing = true;
    form.css('visibility', 'visible');

    console.log(currentName, currentEmail, currentPhotoUrl);
  }
});

$('#btn-save').click(function() {

  var user = firebase.auth().currentUser;

  // Change information if values aren't the same
  var newName = nameInputField.val();
  var newEmail = emailInputField.val();
  var newPhotoUrl = photoUrlInputField.val();

  var nameUpdated = newName !== currentName;
  var emailUpdated = newEmail !== currentEmail;
  var photoUrlUpdated = newPhotoUrl !== currentPhotoUrl;

  console.log("Name updated", nameUpdated);
  console.log("Email updated", emailUpdated);
  console.log("Photo updated", photoUrlUpdated);

  if (nameUpdated && emailUpdated && photoUrlUpdated) {
    updateName(user, newName);
    promptForPwd(user, newEmail);
    updatePhotoUrl(user, newPhotoUrl);
  }
  else {
    if (nameUpdated) {
      updateName(user, newName);
    }
    if (emailUpdated) {
      promptForPwd(user, newEmail);
    }
    if (photoUrlUpdated) {
      updatePhotoUrl(user, newPhotoUrl);
    }
  }
});

function updateName(user, name) {
  var hasError;

  user.updateProfile({
    displayName: name
  })
  .catch(function(error) {
    // An error happened.
    console.log(error);
    hasError = true;
    showSaveSuccess(false);
  })
  .then(function() {
    // Update successful.
    if (!hasError) {
      showSaveSuccess(true);
      nameHeading.text(name);
      currentName = name;
    }
  });
}

function promptForPwd(user, email) {
  var pwd = prompt("Please enter your password to update your email address");
  var credential = firebase.auth.EmailAuthProvider.credential(user.email, pwd);

  user.reauthenticate(credential)
    .then(function() {
      updateEmail(user, email);
    })
    .catch(function(error) {
      // An error happened.
      console.log(error);
      alert("Incorrect password entered");
    });
}

function updateEmail(user, email) {
  var hasError;

  user.updateEmail(email)
    .catch(function(error) {
      console.log(error);
      hasError = true;
      showSaveSuccess(false);
    })
    .then(function() {
      if (!hasError) {
        showSaveSuccess(true);
        currentEmail = email;
      }
    });
}

function updatePhotoUrl(user, photoUrl) {
  var hasError;

  user.updateProfile({
    photoURL: photoUrl
  })
  .catch(function(error) {
    // An error happened.
    console.log(error);
    hasError = true;
    showSaveSuccess(false);
  })
  .then(function() {
    // Update successful.
    if (!hasError) {

      if (user.photoURL === null) {
        profileImage.attr('src', 'https://www.menon.no/wp-content/uploads/person-placeholder.jpg');
      }
      else {
        profileImage.attr('src', user.photoURL);
      }

      showSaveSuccess(true);
      currentPhotoUrl = photoUrl;
    }
  });
}

function showSaveSuccess(isSuccessful) {
  if (isSuccessful) {
    saveSuccessNotice.css('visibility', 'visible');
  }
  else {
    saveSuccessNotice.css('visibility', 'hidden');
  }
}
