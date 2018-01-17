// Auth listener
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.
    console.log("User signed in!");
    window.location.href = "home.html";
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
  });
}


// Login Form
var emailInput = $('#input-email');
var pwdInput = $('#input-pwd');
var formSubmit = $('#form-submit');

formSubmit.click( function() {

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
