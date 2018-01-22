var registeringUser;

// Auth listener
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.
    console.log("User signed in!");

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

// Login Form
$('#btn-login').click( function() {
  registeringUser = false;

  var loginForm = $('#form-login');
  var emailInput = loginForm.find('.input-email');
  var pwdInput = loginForm.find('.input-pwd');

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

// Register Form
$('#btn-register').click( function() {
  registeringUser = true;

  var missingFields = [];

  var registerForm = $('#form-register');
  var nameInput = registerForm.find('.input-name');
  var emailInput = registerForm.find('.input-email');
  var pwdInput = registerForm.find('.input-pwd');
  var confirmPwdInput = registerForm.find('.input-confirm-pwd');

  var name = nameInput.val();
  var email = emailInput.val();
  var pwd = pwdInput.val();
  var confirmPwd = confirmPwdInput.val();

  // Check if all fields aren't empty
  if (name.length === 0) {
    missingFields.push("\n• Name");
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

  if (missingFields.length !== 0) {
    alert('The following fields are missing: ' + missingFields.join(""));
  }
  else {
    // Check if passwords match
    if (pwd !== confirmPwd) {
      alert('The passwords do not match. Please enter two passwords that do.');
    }
    else {
      // Register user
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
      console.log("GRAT SUKSESS!");

      // Register other user's details
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
          window.location.href = "home.html";
        });
      });
    }
  });
}
