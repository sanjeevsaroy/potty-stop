var
  registerSection = $('#register-section'),
  loginSection = $('#login-section');

// Hide the login section and show the registration section
$('#btn-register-link').click(function() {
  loginSection.fadeOut('slow', function() {
    registerSection.fadeIn();
  });
});

// Hide the registration section and show the login section
$('#btn-login-link').click(function() {
  registerSection.fadeOut('slow', function() {
    loginSection.fadeIn();
  });
});

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

var registeringUser;

// Auth listener for when the user signs in or out
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.
    console.log("User signed in!");

    // If the user has logged in and was not registering, redirect
    if (!registeringUser) {
      window.location.href = "home.html";
    }
  }
  else {
    // User is signed out.
    console.log("User signed out!");
  }
});

// Login firebase
function login (email, pwd) {
  firebase.auth().signInWithEmailAndPassword(email, pwd).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;

    console.log(errorCode, errorMessage);

    alert(errorMessage);
  });
}

// Log the user in
$('#btn-login').click(function() {
  registeringUser = false;

  var emailInput = loginSection.find('input[name="email"]');
  var pwdInput = loginSection.find('input[name="pwd"]');

  var email = emailInput.val();
  var pwd = pwdInput.val();

  if (email.length > 0) {
    if (pwd.length > 0) {
      // Sign in
        login(email, pwd);
    }
    else {
      alert("Please enter a password.");
    }
  }
  else {
    alert("Please enter an email address.");
  }
});

// Prompt the user for the account's email address they want to reset the password for
$('#btn-forgot-pwd').click(function() {
  var emailAddress = prompt('Please enter your email address to reset your password');

  firebase.auth().sendPasswordResetEmail(emailAddress).then(function() {
    alert('A password reset link has been sent to ' + emailAddress + '.');
  })
  .catch(function(error) {
    alert(error.message);
    console.log(error);
  });
});

// Register the user
$('#btn-register').click( function() {
  registeringUser = true;

  var missingFields = [];

  var nameInput = registerSection.find('input[name="name"]');
  var emailInput = registerSection.find('input[name="email"]');
  var pwdInput = registerSection.find('input[name="pwd"]');
  var confirmPwdInput = registerSection.find('input[name="confirm-pwd"]');

  var name = nameInput.val();
  var email = emailInput.val();
  var pwd = pwdInput.val();
  var confirmPwd = confirmPwdInput.val();

  // Check if all fields aren't empty and alert if any missing
  if (name.length === 0) {
    missingFields.push("\n• Full name");
  }
  if (email.length === 0) {
    missingFields.push("\n• Email");
  }
  if (pwd.length === 0) {
    missingFields.push("\n• Password");
  }
  if (confirmPwd.length === 0) {
    missingFields.push("\n• Confirm password");
  }

  // Register the user if the required information is present
  if (missingFields.length !== 0) {
    alert('The following fields are missing: ' + missingFields.join(""));
  }
  else {
    // Check if passwords match
    if (pwd !== confirmPwd) {
      alert('The passwords do not match. Please enter two passwords that do.');
    }
    else {
      registerUser(name, email, pwd);
    }
  }
});

function registerUser(name, email, pwd) {
  var hasError;

  firebase.auth().createUserWithEmailAndPassword(email, pwd)
  .catch(function(error) {
    console.log(error.code, error.message);

    alert(error.message);
    hasError = true;
  })
  .then(function() {
    if (!hasError) {
      console.log("User registered!");

      // Register other user's details before redirecting
      var user = firebase.auth().currentUser;

      user.updateProfile({
        displayName: name
      })
      .catch(function(error) {
        console.log(error);
      })
      .then(function() {
        var millis = new Date().getTime();

        // Save user details
        firebase.database().ref('users/' + user.uid).set({
            createdAt: millis
        })
        .then(function() {
          // Redirect to home screen
          window.location.href = "home.html";
        });
      });
    }
  });
}
