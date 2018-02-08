var activityLink = $('#activity-link');
var activitySection = $('#activity-section');
var editProfileLink = $('#edit-profile-link');
var editProfileSection = $('#edit-profile-section');

activityLink.click(function() {
  activityLink.addClass('active');
  editProfileLink.removeClass('active');

  activityLink.next().addClass('active');
  editProfileLink.next().removeClass('active');

  editProfileSection.fadeOut('slow', function() {
    activitySection.fadeIn('slow');
  });
});

editProfileLink.click(function() {
  activityLink.removeClass('active');
  editProfileLink.addClass('active');

  activityLink.next().removeClass('active');
  editProfileLink.next().addClass('active');

  activitySection.fadeOut('slow', function() {
    editProfileSection.fadeIn('slow');
  });
});

// Assign email to heading
var nameHeading = $('#user-name');
var profileImage = $('#user-img');
var totalFacilitiesField = $('#stats-facilities');
var totalCommentsField = $('#stats-comments');
var totalRatingsField = $('#stats-ratings');
var activityList = $('#activities');
var noActivityText = $('#text-no-activity');

var nameInputField = $('input[name="name"]');
var emailInputField = $('input[name="email"]');
var photoUrlInputField = $('input[name="photo-url"]');

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.
    console.log("User signed in!");

    // User info
    nameHeading.text(user.displayName);
    nameInputField.attr('value', user.displayName);
    emailInputField.attr('value', user.email);
    photoUrlInputField.attr('value', user.photoURL);

    if (user.photoURL === null) {
      profileImage.attr('src', 'https://www.menon.no/wp-content/uploads/person-placeholder.jpg');
    }
    else {
      profileImage.attr('src', user.photoURL);
    }

    storeCurrentUserData();

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

          if (activities === undefined) {
            noActivityText.css('display', 'flex');
          }
          else {

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
              activityList.prepend(activityListItem);
            }
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

  var datetime = convertToDate(activity.createdAt);

  if (activity.type === 'facility') {
    activityListItem = $('<div class="activity">You created the facility <span class="purple bold">' + activity.name + '</span><div class="datetime">' + datetime + '</div></div>');
  }
  else {
    activityListItem = $('<div class="activity">You created a comment on <span class="purple bold">' + activity.name + '</span> at ' + datetime + '.</div>');
  }

  return activityListItem;
}

function convertToDate(timestamp) {
  var datetime = new Date(timestamp*1000);
  var monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  var date = datetime.toLocaleDateString();

  var dateNum = date.split("/")[0];
  dateNum = getOrdinalNum(dateNum);

  var dateMonth = date.split("/")[1];
  dateMonth = monthNames[Number(dateMonth)];

  var dateYear = date.split("/")[2];

  var minutes = datetime.getMinutes();
  if (String(minutes).length === 1) {
    minutes = "0" + minutes;
  }

  var time = datetime.getHours() + ':' + minutes;
  console.log(time);

  var isToday = (new Date().toDateString() == datetime.toDateString());

  if (isToday) {
    return time + ' today';
  }
  else {
    return dateNum + ' ' + dateMonth + ' ' + dateYear;
  }
}

function getOrdinalNum(n) {
  return n + (n > 0 ? ['th', 'st', 'nd', 'rd'][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10] : '');
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

function storeCurrentUserData() {
  var user = firebase.auth().currentUser;

  // Get existing values
  currentName = user.displayName;
  currentEmail = user.email;
  currentPhotoUrl = user.photoURL;
}

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
    $('#popup-saved-changes').animate({
      top: '0'
    }, 750, function() {
      setTimeout(function() {
        $('#popup-saved-changes').animate({
          top: '-70px'
        }, 750);
      }, 4000);
    });
  }
}
