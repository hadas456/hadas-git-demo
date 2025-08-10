// user.js — JSONBin-backed implementation
// ----------------------------------------------------
// אם את רואה את זה: הקובץ הזה מחליף את user.js הישן ועובד מול JSONBin.
// ערכים:
const BIN_ID = "6895dd31f7e7a370d1f7497e";   // Bin ID שלך
const MASTER_KEY = "$2a$10$gPU2gr.Ax2Hmtl8LGWyW5.TMxPVb/MRmSdSkEAlW0BobDjjjE3v/u"; // Master Key שלך (Private Bin)

const BIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// מפתחות ל-session מקומית (שומרים רק מי מחובר כרגע וגם סל)
const CURRENT_USER_KEY = "currentUser";
const CART_KEY = "cart";

// ===== JSONBin helpers =====
async function fetchUsers() {
  const res = await fetch(`${BIN_URL}/latest`, {
    headers: { "X-Master-Key": MASTER_KEY }
  });
  if (!res.ok) throw new Error("קריאת משתמשים מהשרת נכשלה");
  const data = await res.json();
  return Array.isArray(data.record) ? data.record : [];
}

async function saveUsers(users) {
  const res = await fetch(`${BIN_URL}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": MASTER_KEY
    },
    body: JSON.stringify(users)
  });
  if (!res.ok) throw new Error("שמירת משתמשים לשרת נכשלה");
  const data = await res.json();
  return data.record;
}

// ===== Session helpers (לוקאלי בלבד) =====
function getCurrentUser() { try { return JSON.parse(localStorage.getItem(CURRENT_USER_KEY)); } catch { return null; } }
function setCurrentUser(u) { localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(u)); }
function clearCart() { localStorage.removeItem(CART_KEY); }

// ===== Auth (מול JSONBin) =====
async function registerUser({ name, email, password, address = "" }) {
  const normEmail = (email||"").trim().toLowerCase();
  let users = await fetchUsers();
  if (users.some(u => (u.email||'').toLowerCase() === normEmail)) throw new Error("האימייל כבר קיים במערכת");
  const newUser = { name: (name||'').trim(), email: normEmail, password, address, purchases: [] };
  users.push(newUser);
  await saveUsers(users);
  setCurrentUser(newUser);
  return newUser;
}

async function loginUser({ email, password }) {
  const normEmail = (email||"").trim().toLowerCase();
  const users = await fetchUsers();
  const user = users.find(u => (u.email||'').toLowerCase() === normEmail && u.password === password);
  if (!user) throw new Error("אימייל או סיסמה שגויים");
  setCurrentUser(user);
  return user;
}

function logoutUser() { localStorage.removeItem(CURRENT_USER_KEY); }

async function getUserByEmail(email) {
  const norm = (email||'').trim().toLowerCase();
  const users = await fetchUsers();
  return users.find(u => (u.email||'').toLowerCase() === norm) || null;
}

// ===== Orders (שומר הזמנה בענן) =====
async function placeOrderFromCart() {
  const cu = getCurrentUser();
  if (!cu) { alert("צריך להתחבר כדי לבצע הזמנה"); return null; }

  const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  if (!cart.length) { alert("הסל ריק"); return null; }

  const total = cart.reduce((s,i)=> s + (i.price||0) * (i.quantity||1), 0);
  const order = {
    id: "ORD-" + Date.now(),
    date: new Date().toISOString(),
    items: cart,
    total: Number(total.toFixed(2))
  };

  let users = await fetchUsers();
  users = users.map(u => {
    if ((u.email||'').toLowerCase() === cu.email.toLowerCase()) {
      const updated = { ...u, purchases: [...(u.purchases||[]), order] };
      setCurrentUser(updated);
      return updated;
    }
    return u;
  });
  await saveUsers(users);
  clearCart();
  return order;
}

// ===== חשיפה לגלובל =====
window.registerUser = registerUser;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.placeOrderFromCart = placeOrderFromCart;
window.getUserByEmail = getUserByEmail;
