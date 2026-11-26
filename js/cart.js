// ===== cart.js : FAKE cart and checkout (no server; data is saved in the browser with localStorage) =====
var DELIVERY_FEE = 20; // fixed delivery fee in dollars
var GST_RATE = 0.09; // GST is 9%

// ---- small helper functions ----
function formatMoney(amount) { // turns a number like 1166.3 into the text "$1,166.30"
  return "$" + amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); // always 2 decimal places and commas
} // end of formatMoney

function getCart() { // reads the cart from the browser's storage
  return JSON.parse(localStorage.getItem("cart")) || []; // turn the saved text back into a list; use an empty list if nothing is saved
} // end of getCart

function saveCart(cart) { // saves the cart in the browser's storage
  localStorage.setItem("cart", JSON.stringify(cart)); // turn the list into text and save it under the name "cart"
} // end of saveCart

function calcTotals(items) { // works out all the money amounts for a list of items
  var boxes = 0; // total number of boxes
  var subtotal = 0; // total price of the boxes
  items.forEach(function (item) { // go through every item
    boxes += item.qty; // add its quantity to the box count
    subtotal += item.price * item.qty; // add price x quantity to the subtotal
  }); // end of the loop
  var delivery = items.length > 0 ? DELIVERY_FEE : 0; // no delivery fee for an empty cart
  var gst = Math.round((subtotal + delivery) * GST_RATE * 100) / 100; // GST on items + delivery, rounded to cents
  return { boxes: boxes, subtotal: subtotal, delivery: delivery, gst: gst, total: subtotal + delivery + gst }; // give all the amounts back together
} // end of calcTotals

// ---- adding to the cart ----
function addToCart(item) { // adds one Bento Box to the cart; gives back true if it worked
  var cart = getCart(); // read the current cart
  if (cart.length > 0 && cart[0].caterer !== item.caterer) { // rule: one caterer per order
    var ok = confirm("Your cart has boxes from " + cart[0].caterer + ". Start a new cart with " + item.caterer + "?"); // ask the visitor
    if (!ok) { return false; } // the visitor said no, so do nothing
    cart = []; // the visitor said yes, so empty the cart first
  } // end of the caterer rule
  var existing = cart.find(function (line) { return line.id === item.id; }); // is this box already in the cart?
  if (existing) { existing.qty += item.qty; } else { cart.push(item); } // add to the quantity, or add a new line
  saveCart(cart); // save the cart
  return true; // tell the caller it worked
} // end of addToCart

function itemFromData(el, qty) { // builds a cart item from the data- attributes on an HTML element
  return { // the item object
    id: el.dataset.id, // box number
    name: el.dataset.name, // box name
    price: parseFloat(el.dataset.price), // price per box as a number
    kcal: el.dataset.kcal, // calories
    caterer: el.dataset.caterer, // caterer name
    img: el.dataset.img, // picture file name
    min: parseInt(el.dataset.min, 10), // minimum order quantity
    qty: qty // how many boxes
  }; // end of the item object
} // end of itemFromData

function setupAddToCartButtons() { // the "Add to Cart" buttons on the Compare page
  document.querySelectorAll(".add-to-cart").forEach(function (button) { // find every such button
    button.addEventListener("click", function (event) { // when it is clicked
      event.preventDefault(); // stop the link from opening straight away
      var item = itemFromData(button, parseInt(button.dataset.min, 10)); // quantity starts at the minimum order
      if (addToCart(item)) { window.location.href = "checkout.html"; } // if it worked, go to the cart
    }); // end of click
  }); // end of loop
} // end of setupAddToCartButtons

function setupDetailForm() { // the order form on the Detail page
  var form = document.getElementById("add-to-cart-form"); // find the form
  if (!form) { return; } // this page has no such form, so stop
  var qtyInput = document.getElementById("quantity"); // the quantity box
  var subtotal = document.getElementById("detail-subtotal"); // the subtotal text
  function updateSubtotal() { // recalculates the subtotal
    var qty = parseInt(qtyInput.value, 10) || 0; // quantity as a number (0 if empty)
    subtotal.textContent = formatMoney(qty * parseFloat(form.dataset.price)); // show quantity x price
  } // end of updateSubtotal
  qtyInput.addEventListener("input", updateSubtotal); // update every time the quantity changes
  updateSubtotal(); // also update once when the page opens
  form.addEventListener("submit", function (event) { // when "Add to Cart" is pressed (the browser checks the minimum first)
    event.preventDefault(); // stop the normal form sending
    var item = itemFromData(form, parseInt(qtyInput.value, 10)); // build the item with the typed quantity
    if (addToCart(item)) { window.location.href = "checkout.html"; } // go to the cart if it worked
  }); // end of submit
} // end of setupDetailForm

// ---- the cart section of the checkout page ----
function renderCheckout() { // draws the cart items and the order summary
  var holder = document.getElementById("cart-items"); // the empty box that will hold the items
  if (!holder) { return; } // this is not the checkout page, so stop
  var cart = getCart(); // read the cart
  var html = ""; // the HTML text we will build
  cart.forEach(function (item, index) { // go through every item (index = its position)
    html += '<div class="cart-item">' // start of one cart row
      + '<img src="images/' + item.img + '" alt="' + item.name + '">' // placeholder picture
      + '<div class="grow"><p class="row-title">' + item.name + '</p>' // name
      + '<p class="note">' + item.kcal + ' kcal per box &middot; ' + formatMoney(item.price) + ' / box &middot; Min. ' + item.min + '</p></div>' // small details
      + '<input type="number" min="' + item.min + '" value="' + item.qty + '" data-index="' + index + '" aria-label="Quantity">' // quantity box
      + '<strong>' + formatMoney(item.price * item.qty) + '</strong>' // line total
      + '<a href="#" class="link-danger" data-remove="' + index + '">Remove</a>' // remove link
      + '</div>'; // end of one cart row
  }); // end of loop
  holder.innerHTML = html; // put the rows on the page
  document.getElementById("cart-empty").hidden = cart.length > 0; // show the "cart is empty" message only when it is empty
  document.getElementById("cart-caterer").textContent = cart.length > 0 ? cart[0].caterer + " (one caterer per order)" : ""; // caterer name
  var t = calcTotals(cart); // work out the money
  document.getElementById("sum-label").textContent = "Subtotal (" + t.boxes + " boxes)"; // summary label
  document.getElementById("sum-subtotal").textContent = formatMoney(t.subtotal); // summary subtotal
  document.getElementById("sum-delivery").textContent = formatMoney(t.delivery); // summary delivery fee
  document.getElementById("sum-gst").textContent = formatMoney(t.gst); // summary GST
  document.getElementById("sum-total").textContent = formatMoney(t.total); // summary total
  document.getElementById("place-order").textContent = "Place Order · " + formatMoney(t.total); // button text with the total
} // end of renderCheckout

function setupCartEvents() { // handles changing a quantity or removing an item
  var holder = document.getElementById("cart-items"); // the box that holds the items
  if (!holder) { return; } // not the checkout page
  holder.addEventListener("change", function (event) { // when a quantity box changes
    var index = event.target.dataset.index; // which item it belongs to
    if (index === undefined) { return; } // not a quantity box
    var cart = getCart(); // read the cart
    var qty = parseInt(event.target.value, 10); // the new quantity
    cart[index].qty = (qty >= cart[index].min) ? qty : cart[index].min; // never go below the minimum order
    saveCart(cart); // save it
    renderCheckout(); // redraw
    if (typeof updateHeader === "function") { updateHeader(); } // refresh the Cart count in the header
  }); // end of change
  holder.addEventListener("click", function (event) { // when something inside is clicked
    var index = event.target.dataset.remove; // is it a Remove link?
    if (index === undefined) { return; } // no
    event.preventDefault(); // stop the link from jumping
    var cart = getCart(); // read the cart
    cart.splice(index, 1); // remove that item
    saveCart(cart); // save it
    renderCheckout(); // redraw
    if (typeof updateHeader === "function") { updateHeader(); } // refresh the Cart count in the header
  }); // end of click
} // end of setupCartEvents

// ---- placing the (fake) order ----
function value(id) { // short helper: the text typed in a form box
  return document.getElementById(id).value.trim(); // read the box and remove spaces at the ends
} // end of value

function setupCheckoutForm() { // the whole checkout form
  var form = document.getElementById("checkout-form"); // find the form
  if (!form) { return; } // not the checkout page
  document.getElementById("same-address").addEventListener("change", function (event) { // the "Same as delivery address" tick box
    if (!event.target.checked) { return; } // only copy when it is ticked
    document.getElementById("bill-address").value = value("del-address"); // copy the address line
    document.getElementById("bill-unit").value = value("del-unit"); // copy the unit
    document.getElementById("bill-postal").value = value("del-postal"); // copy the postal code
  }); // end of tick box
  form.addEventListener("submit", function (event) { // when "Place Order" is pressed (the browser checks required boxes first)
    event.preventDefault(); // stop the normal form sending
    var cart = getCart(); // read the cart
    var message = document.getElementById("checkout-message"); // the error message line
    if (cart.length === 0) { message.textContent = "Your cart is empty."; message.hidden = false; return; } // cannot order nothing
    var user = getCurrentUser(); // who is logged in
    var t = calcTotals(cart); // the money amounts
    var orders = getOrders(); // all saved orders
    var number = "BP-2026-" + String(125 + orders.length - sampleOrders.length + 0).padStart(4, "0"); // next order number (the sample orders end at 0124)
    var order = { // the new order
      no: number, // order number
      placed: new Date().toISOString().slice(0, 10), // today's date as 2026-11-26
      email: user.email, // which customer
      customer: user.company + " (" + user.name + ")", // customer name shown to the caterer
      caterer: cart[0].caterer, // which caterer
      items: cart.map(function (i) { return { name: i.name, price: i.price, qty: i.qty }; }), // the boxes ordered
      subtotal: t.subtotal, delivery: t.delivery, gst: t.gst, total: t.total, // the money amounts
      deliveryDate: value("delivery-date"), deliveryTime: value("delivery-time"), // when to deliver
      contact: value("contact-name") + ", " + value("contact-phone"), // contact person and phone
      notes: value("requests"), // special requests
      deliveryAddress: value("del-address") + ", " + value("del-unit") + ", " + value("del-postal"), // where to deliver
      billingAddress: value("bill-name") + ", " + value("bill-address") + ", " + value("bill-unit") + ", " + value("bill-postal"), // where to send the invoice
      payment: form.elements["payment"].value, // payment choice (card numbers are NEVER saved)
      status: "New" // every new order starts as New
    }; // end of the order
    orders.push(order); // add it to the list
    saveOrders(orders); // save the list
    saveCart([]); // empty the cart
    document.getElementById("conf-order-no").textContent = number; // show the order number
    document.getElementById("conf-total").textContent = formatMoney(t.total); // show the total
    document.getElementById("conf-email").textContent = user.email; // show the email
    document.getElementById("confirmation").hidden = false; // show the confirmation panel at the top
    document.getElementById("checkout-content").hidden = true; // hide the cart and forms
    if (typeof updateHeader === "function") { updateHeader(); } // refresh the Cart count in the header
    window.scrollTo(0, 0); // scroll to the top so the visitor sees the confirmation
  }); // end of submit
} // end of setupCheckoutForm

document.addEventListener("DOMContentLoaded", function () { // run these when the page has finished loading
  setupAddToCartButtons(); // Compare page buttons
  setupDetailForm(); // Detail page form
  renderCheckout(); // Checkout page cart
  setupCartEvents(); // quantity and remove
  setupCheckoutForm(); // place order
}); // end of page-load code
