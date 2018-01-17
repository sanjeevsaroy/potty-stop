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
