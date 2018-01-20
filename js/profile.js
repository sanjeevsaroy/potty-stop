// Assign email to heading
var nameHeading = $('#heading-name');
var profileImage = $('#img-profile');
var totalFacilitiesField = $('#total-facilities');
var totalCommentsField = $('#total-comments');
var totalRatingsField = $('#total-ratings');

var nameInputField = $('#input-name');
var emailInputField = $('#input-email');
var photoUrlInputField = $('#input-photo-url');

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.
    console.log("User signed in!");

    nameHeading.text(user.displayName);
    profileImage.attr('src', user.photoURL);
    nameInputField.attr('value', user.displayName);
    emailInputField.attr('value', user.email);
    photoUrlInputField.attr('value', user.photoURL);

    // Get user actions
    firebase.database().ref('users/' + user.uid).once('value')
      .then(function(snapshot) {

          var val = snapshot.val();
          var numOfFacilities = Object.keys(val.facilities).length;
          var numOfComments = Object.keys(val.comments).length;
          var numOfRatings = val.ratings;

          totalFacilitiesField.text(numOfFacilities);
          totalCommentsField.text(numOfComments);
          totalRatingsField.text(numOfRatings);

          console.log(numOfFacilities, numOfComments, numOfRatings);
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
      profileImage.attr('src', photoUrl);
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
