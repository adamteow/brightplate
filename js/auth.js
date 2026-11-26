// ===== auth.js : FAKE login (demo only; nothing is secure and nothing goes to a server) =====
function getAllUsers() { // the sample users plus anyone who registered in this browser
  var registered = JSON.parse(localStorage.getItem("registeredUsers")) || []; // users saved by the register form
  return sampleUsers.concat(registered); // join the two lists (sampleUsers comes from users.js)
} // end of getAllUsers

function getCurrentUser() { // who is logged in right now (or null)
  return JSON.parse(localStorage.getItem("loggedInUser")); // read the saved login
} // end of getCurrentUser

function logIn(user) { // remembers the login and opens the right section
  localStorage.setItem("loggedInUser", JSON.stringify({ name: user.name, email: user.email, role: user.role, company: user.company })); // save the details but NEVER the password
  window.location.href = user.role === "caterer" ? "vendor-dashboard.html" : "account.html"; // caterers go to their dashboard, customers to My Account
} // end of logIn

function logOut() { // ends the login
  localStorage.removeItem("loggedInUser"); // forget who was logged in
  window.location.href = "index.html"; // go back to the Home page
} // end of logOut

function showMessage(id, text) { // shows or hides a message line
  var line = document.getElementById(id); // find the message line
  if (!line) { return; } // nothing to do if it is not on this page
  line.textContent = text; // put the text in
  line.hidden = (text === ""); // hide the line when there is no text
} // end of showMessage

function guardPage() { // sends visitors away from pages they are not allowed to open
  var needed = document.body.dataset.access || "public"; // what the page needs: public, customer or caterer
  if (needed === "public") { return; } // anyone may open public pages
  var user = getCurrentUser(); // who is logged in
  var role = (needed === "caterer") ? "caterer" : "customer"; // the role the page needs
  if (!user || user.role !== role) { window.location.href = "login.html"; } // wrong or no login: go to the Login page
} // end of guardPage

function updateHeader() { // changes the header buttons to match who is logged in
  var box = document.querySelector(".nav-buttons"); // the button area in the header
  if (!box) { return; } // no header buttons on this page
  var user = getCurrentUser(); // who is logged in
  if (document.body.dataset.access === "caterer") { // caterer pages have their own header
    var name = document.getElementById("vendor-name"); // the caterer name in the header
    if (name && user) { name.textContent = user.company; } // show the business name
    return; // nothing else to change
  } // end of caterer header
  if (!user) { // nobody is logged in
    box.innerHTML = '<a href="login.html" class="btn btn-text">Log in</a><a href="login.html" class="btn btn-primary btn-small">Register</a>'; // Log in and Register
  } else if (user.role === "caterer") { // a caterer is logged in
    box.innerHTML = '<a href="vendor-dashboard.html" class="btn btn-text">Dashboard</a><a href="#" class="btn btn-primary btn-small" data-logout>Log out</a>'; // Dashboard and Log out
  } else { // a customer is logged in
    box.innerHTML = '<a href="account.html" class="btn btn-text">My Account</a><a href="checkout.html" class="btn btn-primary btn-small">Cart (' + getCart().length + ')</a><a href="#" class="btn btn-text" data-logout>Log out</a>'; // My Account, Cart and Log out
  } // end of the choices
  setupLogout(); // connect the new Log out button
} // end of updateHeader

function setupLogout() { // connects every Log out button
  document.querySelectorAll("[data-logout]").forEach(function (link) { // find every Log out button
    link.onclick = function (event) { event.preventDefault(); logOut(); }; // when clicked, stop the link and log out
  }); // end of loop
} // end of setupLogout

function setupLogin() { // the Log in form
  var form = document.getElementById("login-form"); // find the form
  if (!form) { return; } // not the login page
  form.addEventListener("submit", function (event) { // when the form is sent
    event.preventDefault(); // stop the normal form sending
    var email = document.getElementById("login-email").value.trim().toLowerCase(); // typed email
    var password = document.getElementById("login-password").value; // typed password
    var found = getAllUsers().find(function (u) { return u.email.toLowerCase() === email && u.password === password; }); // look for a matching user
    if (!found) { showMessage("login-message", "Incorrect email or password."); return; } // no match: show an error
    logIn(found); // match: log in
  }); // end of submit
} // end of setupLogin

function setupRegister() { // the Register form
  var form = document.getElementById("register-form"); // find the form
  if (!form) { return; } // not the login page
  form.addEventListener("submit", function (event) { // when the form is sent
    event.preventDefault(); // stop the normal form sending
    var email = document.getElementById("reg-email").value.trim().toLowerCase(); // typed email
    var password = document.getElementById("reg-password").value; // typed password
    if (password.length < 8) { showMessage("register-message", "Password must be at least 8 characters."); return; } // too short
    if (password !== document.getElementById("reg-confirm").value) { showMessage("register-message", "The two passwords do not match."); return; } // not the same
    if (getAllUsers().some(function (u) { return u.email.toLowerCase() === email; })) { showMessage("register-message", "That email is already registered."); return; } // already used
    var name = document.getElementById("reg-name").value.trim(); // typed name
    var company = document.getElementById("reg-company").value.trim() || name; // business name (or the name if left empty)
    var user = { name: name, email: email, password: password, role: form.elements["role"].value, company: company }; // the new user
    var registered = JSON.parse(localStorage.getItem("registeredUsers")) || []; // users saved so far
    registered.push(user); // add the new user
    localStorage.setItem("registeredUsers", JSON.stringify(registered)); // save the list
    logIn(user); // log the new user in straight away
  }); // end of submit
} // end of setupRegister

function setupReset() { // the "Reset demo data" link on the Login page
  var link = document.getElementById("reset-demo"); // find the link
  if (!link) { return; } // not the login page
  link.addEventListener("click", function (event) { // when clicked
    event.preventDefault(); // stop the link from jumping
    localStorage.clear(); // delete everything this demo saved (carts, orders, new users, logins)
    showMessage("login-message", "Demo data has been reset."); // tell the visitor
  }); // end of click
} // end of setupReset

document.addEventListener("DOMContentLoaded", function () { // run these when the page has finished loading
  guardPage(); // 1. check the visitor may open this page
  updateHeader(); // 2. fix the header buttons
  setupLogout(); // 3. connect Log out buttons
  setupLogin(); // 4. Login form
  setupRegister(); // 5. Register form
  setupReset(); // 6. reset link
  var nameBox = document.getElementById("account-name"); // the name on the My Account menu
  var user = getCurrentUser(); // who is logged in
  if (nameBox && user) { nameBox.textContent = user.name; } // show the logged-in name
  if (document.getElementById("p-name") && user) { document.getElementById("p-name").value = user.name; document.getElementById("p-email").value = user.email; document.getElementById("p-company").value = user.company; } // fill the profile form
  if (document.getElementById("contact-name") && user) { document.getElementById("contact-name").value = user.name; document.getElementById("bill-name").value = user.company; } // fill the checkout form
}); // end of page-load code
