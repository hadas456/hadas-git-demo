document.addEventListener("DOMContentLoaded", () => {
  const userInfoEl = document.getElementById("userInfo");
  const ordersEl   = document.getElementById("orders");

  const showError = (msg) => {
    if (ordersEl) ordersEl.innerHTML = `<p style="color:#d66;background:#2a1b1b;border:1px solid #5a2e2e;padding:10px;border-radius:8px;">${msg}</p>`;
  };

  const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleString('he-IL'); } catch { return iso || ""; }
  };
  const money = (n) => `$${Number(n||0).toFixed(2)}`;

  (async function init() {
    // 1) לוודא שיש משתמש מחובר
    let cu = null;
    try { cu = JSON.parse(localStorage.getItem("currentUser") || "null"); } catch {}
    if (!cu || !cu.email) {
      alert("יש להתחבר כדי לצפות בפרופיל");
      location.href = "login.html";
      return;
    }

    // 2) למשוך משתמש מלא מהענן (JSONBin)
    let user = null;
    try {
      if (typeof getUserByEmail !== "function") throw new Error("user.js לא נטען");
      user = await getUserByEmail(cu.email);
      if (!user) { showError("משתמש לא נמצא"); return; }
    } catch (err) {
      console.error(err);
      showError("שגיאה בטעינת נתוני המשתמש");
      return;
    }

    // 3) פרטי משתמש
    if (userInfoEl) {
      userInfoEl.innerHTML = `
        <div class="pi-row"><b>שם:</b> ${user.name || ""}</div>
        <div class="pi-row"><b>אימייל:</b> ${user.email || ""}</div>
        ${user.address ? `<div class="pi-row"><b>כתובת:</b> ${user.address}</div>` : ""}
      `;
    }

    // 4) רכישות קודמות (מפורט)
    const orders = Array.isArray(user.purchases) ? user.purchases.slice().reverse() : [];
    if (!orders.length) {
      if (ordersEl) ordersEl.innerHTML = "<p>אין רכישות עדיין.</p>";
      return;
    }

    if (ordersEl) {
      ordersEl.innerHTML = orders.map(o => `
        <div class="order-card">
          <div class="order-head">
            <div><b>מס' הזמנה:</b> ${o.id || ""}</div>
            <div><b>תאריך:</b> ${fmtDate(o.date)}</div>
            <div><b>סה"כ:</b> ${money(o.total)}</div>
          </div>
          <div class="order-items">
            ${(o.items||[]).map(it => `
              <div class="order-item">
                ${it.thumbnail ? `<img src="${it.thumbnail}" alt="">` : ""}
                <div class="oi-title">${it.title || ""}</div>
                <div class="oi-qty">x${it.quantity || 1}</div>
                <div class="oi-price">${money((it.price||0) * (it.quantity||1))}</div>
              </div>
            `).join("")}
          </div>
        </div>
      `).join("");
    }
  })();
});
