// ===== orders.js : FAKE orders (saved in the browser with localStorage) =====
// The same list of orders is used by the customer pages (My Account) and the caterer pages (Orders, Dashboard).
var PLATFORM_FEE = 0.08; // the platform keeps 8% of the box prices; the caterer gets the rest

function makeOrder(no, placed, email, customer, caterer, items, deliveryDate, status) { // builds one sample order from a few details
  var t = calcTotals(items); // the money amounts (calcTotals comes from cart.js)
  return { // the order object
    no: no, placed: placed, email: email, customer: customer, caterer: caterer, items: items, // basic details
    subtotal: t.subtotal, delivery: t.delivery, gst: t.gst, total: t.total, // money amounts
    deliveryDate: deliveryDate, deliveryTime: "12:00", // when to deliver
    contact: customer + ", +65 9000 0000", // sample contact
    notes: "", // no special requests
    deliveryAddress: "Level 5, Example Tower, 1 Sample Street, #05-01, 000000", // sample delivery address
    billingAddress: "88 Finance Road, #12-03, 111111", // sample billing address
    payment: "Card (demo)", // demo payment
    status: status // New, Confirmed, Delivered or Cancelled
  }; // end of the order
} // end of makeOrder

var sampleOrders = [ // the sample orders that exist when the demo starts
  makeOrder("BP-2026-0098", "2026-10-28", "aisha.r@example.com", "Aisha Rahman", "Fresh Tiers Catering", [{ name: "Quinoa & Roasted Veg Salad Box", price: 12.5, qty: 24 }], "2026-11-06", "Delivered"), // sample order 1
  makeOrder("BP-2026-0109", "2026-11-09", "daniel@example.com", "Acme Office Co. (Daniel Lim)", "Heritage Spice Kitchen", [{ name: "Vegetarian Briyani Box", price: 12, qty: 40 }], "2026-11-20", "Cancelled"), // sample order 2
  makeOrder("BP-2026-0112", "2026-11-12", "aaron@brightdental.example", "Bright Dental Clinic (Aaron Goh)", "Lean Plate Catering", [{ name: "Grilled Fish & Brown Rice Box", price: 13.5, qty: 30 }], "2026-11-26", "Confirmed"), // sample order 3
  makeOrder("BP-2026-0117", "2026-11-16", "daniel@example.com", "Acme Office Co. (Daniel Lim)", "Daily Bowl Kitchen", [{ name: "Nasi Lemak (Light) Box", price: 10.5, qty: 100 }], "2026-11-27", "Confirmed"), // sample order 4
  makeOrder("BP-2026-0119", "2026-11-18", "priya.n@example.com", "Priya Nair (Individual)", "Lean Plate Catering", [{ name: "Grilled Fish & Brown Rice Box", price: 13.5, qty: 24 }], "2026-11-28", "New"), // sample order 5
  makeOrder("BP-2026-0121", "2026-11-20", "meiling@harbour.example", "Harbour Events (Mei Ling)", "Lean Plate Catering", [{ name: "Grilled Fish & Brown Rice Box", price: 13.5, qty: 120 }], "2026-12-01", "New"), // sample order 6
  makeOrder("BP-2026-0124", "2026-11-23", "daniel@example.com", "Acme Office Co. (Daniel Lim)", "Lean Plate Catering", [{ name: "Grilled Fish & Brown Rice Box", price: 13.5, qty: 40 }, { name: "Lean Chicken & Quinoa Box", price: 14, qty: 20 }], "2026-12-04", "New") // sample order 7
]; // end of the sample orders

function getOrders() { // reads all orders (saves the samples the first time)
  var saved = localStorage.getItem("orders"); // look in the browser's storage
  if (!saved) { localStorage.setItem("orders", JSON.stringify(sampleOrders)); return sampleOrders.slice(); } // first visit: save and use the samples
  return JSON.parse(saved); // otherwise turn the saved text back into a list
} // end of getOrders

function saveOrders(orders) { // saves all orders
  localStorage.setItem("orders", JSON.stringify(orders)); // list -> text -> storage
} // end of saveOrders

function formatDate(iso) { // turns 2026-12-04 into "4 Dec 2026"
  var d = new Date(iso + "T00:00:00"); // make a date object
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); // format it
} // end of formatDate

function payoutOf(order) { // what the caterer receives for an order
  return order.subtotal - Math.round(order.subtotal * PLATFORM_FEE * 100) / 100; // box prices minus the 8% platform fee
} // end of payoutOf

function changeStatus(no, newStatus) { // changes the status of one order and saves it
  var orders = getOrders(); // read all orders
  orders.forEach(function (o) { if (o.no === no) { o.status = newStatus; } }); // find the order and change it
  saveOrders(orders); // save
} // end of changeStatus

function statusLabel(status) { // the coloured status label
  return '<span class="status status-' + status.toLowerCase() + '">' + status + '</span>'; // e.g. status-new, status-confirmed
} // end of statusLabel

function itemsList(order) { // the items of an order as list lines
  return order.items.map(function (i) { return '<li>' + i.qty + ' &times; ' + i.name + ' (' + formatMoney(i.price) + ')</li>'; }).join(""); // one <li> per item
} // end of itemsList

function buildTabs(orders, active, onSelect) { // draws the status tabs with counts
  var box = document.getElementById("order-tabs"); // the empty tabs box
  var names = ["All", "New", "Confirmed", "Delivered", "Cancelled"]; // the tab names
  box.innerHTML = names.map(function (n) { // one link per tab
    var count = orders.filter(function (o) { return n === "All" || o.status === n; }).length; // how many orders in this tab
    return '<a href="#" data-tab="' + n + '"' + (n === active ? ' class="active"' : '') + '>' + n + ' (' + count + ')</a>'; // the tab link
  }).join(""); // join them into one text
  box.onclick = function (event) { // when a tab is clicked
    var tab = event.target.dataset.tab; // which tab
    if (!tab) { return; } // not a tab
    event.preventDefault(); // stop the link from jumping
    onSelect(tab); // show that tab
  }; // end of click
} // end of buildTabs

// ---- customer: My Account page ----
function renderCustomerOrders(active) { // draws the customer's orders
  var list = document.getElementById("orders-list"); // the empty box for the order cards
  if (!list) { return; } // not the account page
  var user = getCurrentUser(); // who is logged in
  var mine = getOrders().filter(function (o) { return o.email === user.email; }).reverse(); // only this customer's orders, newest first
  active = active || "All"; // default tab
  buildTabs(mine, active, renderCustomerOrders); // draw the tabs
  var shown = mine.filter(function (o) { return active === "All" || o.status === active; }); // orders for the chosen tab
  if (shown.length === 0) { list.innerHTML = '<p class="note">No orders here yet.</p>'; return; } // friendly empty message
  list.innerHTML = shown.map(function (o) { // one card per order
    return '<article class="order-card">' // start of the card
      + '<div class="order-head"><strong>' + o.no + '</strong>' + statusLabel(o.status) + '</div>' // number and status
      + '<p class="order-meta"><span>' + o.caterer + '</span><span>Total ' + formatMoney(o.total) + '</span><span>Delivery ' + formatDate(o.deliveryDate) + '</span></p>' // short facts
      + '<details><summary>View order details</summary><div class="order-details">' // open/close section
      + '<div><strong>Items</strong><ul class="order-items">' + itemsList(o) + '</ul></div>' // items
      + '<div><strong>Delivery &amp; billing</strong><p>Deliver to: ' + o.deliveryAddress + '</p><p>Bill to: ' + o.billingAddress + '</p></div>' // addresses
      + '<div><strong>Payment</strong><p>' + o.payment + '</p><p>Subtotal ' + formatMoney(o.subtotal) + '<br>Delivery ' + formatMoney(o.delivery) + '<br>GST ' + formatMoney(o.gst) + '</p></div>' // payment and money
      + '</div></details>' // end of open/close section
      + (o.status === "New" ? '<div class="form-actions"><button type="button" class="btn btn-outline btn-small" data-action="Cancelled" data-no="' + o.no + '">Cancel order (full refund)</button></div>' : '') // cancel button only for New orders
      + '</article>'; // end of the card
  }).join(""); // join all cards
  list.onclick = function (event) { // when a button inside is clicked
    var action = event.target.dataset.action; // which action
    if (!action) { return; } // not an action button
    changeStatus(event.target.dataset.no, action); // change the order status
    renderCustomerOrders(active); // redraw
  }; // end of click
} // end of renderCustomerOrders

// ---- caterer: Orders page ----
function renderVendorOrders(active) { // draws the caterer's orders
  var list = document.getElementById("vendor-orders-list"); // the empty box for the order cards
  if (!list) { return; } // not the orders page
  var user = getCurrentUser(); // who is logged in
  var mine = getOrders().filter(function (o) { return o.caterer === user.company; }).reverse(); // only this caterer's orders, newest first
  active = active || "New"; // default tab is New
  buildTabs(mine, active, renderVendorOrders); // draw the tabs
  var shown = mine.filter(function (o) { return active === "All" || o.status === active; }); // orders for the chosen tab
  if (shown.length === 0) { list.innerHTML = '<p class="note">No orders here yet.</p>'; return; } // friendly empty message
  list.innerHTML = shown.map(function (o) { // one card per order
    var buttons = ""; // the action buttons (depend on the status)
    if (o.status === "New") { buttons = '<button type="button" class="btn btn-primary" data-action="Confirmed" data-no="' + o.no + '">Confirm order</button><button type="button" class="btn btn-outline" data-action="Cancelled" data-no="' + o.no + '">Decline &amp; refund</button>'; } // new orders: confirm or decline
    if (o.status === "Confirmed") { buttons = '<button type="button" class="btn btn-primary" data-action="Delivered" data-no="' + o.no + '">Mark as delivered</button>'; } // confirmed orders: mark delivered
    return '<article class="card order-card">' // start of the card
      + '<div class="order-head"><strong>' + o.no + '</strong><span>' + statusLabel(o.status) + ' <span class="status status-paid">Paid</span></span></div>' // number, status and paid label
      + '<p class="order-meta"><span>' + o.customer + '</span><span>Delivery ' + formatDate(o.deliveryDate) + ', ' + o.deliveryTime + '</span><span>Your payout ' + formatMoney(payoutOf(o)) + '</span></p>' // short facts
      + '<ul class="order-items">' + itemsList(o) + '</ul>' // items
      + '<p class="note">Deliver to: ' + o.deliveryAddress + '</p>' // where to deliver
      + (o.notes ? '<p class="note">Customer note: ' + o.notes + '</p>' : '') // special requests (only if there are any)
      + (buttons ? '<div class="form-actions">' + buttons + '</div>' : '') // the buttons (only if there are any)
      + '</article>'; // end of the card
  }).join(""); // join all cards
  list.onclick = function (event) { // when a button inside is clicked
    var action = event.target.dataset.action; // which action
    if (!action) { return; } // not an action button
    changeStatus(event.target.dataset.no, action); // change the order status
    renderVendorOrders(active); // redraw
  }; // end of click
} // end of renderVendorOrders

// ---- caterer: Dashboard page ----
function renderDashboard() { // fills in the dashboard numbers and recent orders
  var box = document.getElementById("recent-orders"); // the empty box for recent orders
  if (!box) { return; } // not the dashboard
  var user = getCurrentUser(); // who is logged in
  var mine = getOrders().filter(function (o) { return o.caterer === user.company; }).reverse(); // this caterer's orders, newest first
  var counted = mine.filter(function (o) { return o.status !== "Cancelled"; }); // cancelled orders do not count as sales
  var sales = counted.reduce(function (sum, o) { return sum + o.subtotal; }, 0); // total box prices
  var payout = counted.reduce(function (sum, o) { return sum + payoutOf(o); }, 0); // total payout
  document.getElementById("stat-new").textContent = mine.filter(function (o) { return o.status === "New"; }).length; // number of New orders
  document.getElementById("stat-sales").textContent = formatMoney(sales); // sales
  document.getElementById("stat-payout").textContent = formatMoney(payout); // payout
  if (mine.length === 0) { box.innerHTML = '<p class="note">No orders yet.</p>'; return; } // friendly empty message
  box.innerHTML = mine.slice(0, 4).map(function (o) { // the latest 4 orders
    var boxes = o.items.reduce(function (n, i) { return n + i.qty; }, 0); // number of boxes in the order
    return '<div class="list-row"><div class="grow"><p class="row-title">' + o.no + '</p><p class="note">' + o.customer + '</p></div>' // number and customer
      + '<span>' + boxes + ' boxes</span><span>' + formatDate(o.deliveryDate) + '</span><strong>' + formatMoney(o.subtotal) + '</strong>' + statusLabel(o.status) + '</div>'; // boxes, date, amount, status
  }).join(""); // join all rows
} // end of renderDashboard

document.addEventListener("DOMContentLoaded", function () { // run these when the page has finished loading
  if (!getCurrentUser()) { return; } // nobody logged in: auth.js will redirect, so do nothing
  renderCustomerOrders(); // My Account page
  renderVendorOrders(); // caterer Orders page
  renderDashboard(); // caterer Dashboard page
}); // end of page-load code
