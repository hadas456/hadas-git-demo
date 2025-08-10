// cart.js

// === מונה סל בראש האתר ===
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const el1 = document.getElementById("cartCount");
    const el2 = document.getElementById("cart-count");
    if (el1) el1.textContent = count;
    if (el2) el2.textContent = count;
  }
  
  // === הוספה לסל (גלובאלי לכל הדפים) ===
  function addToCart(product) {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + (product.quantity || 1);
    } else {
      cart.push({ ...product, quantity: product.quantity || 1 });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    alert("המוצר נוסף לסל ✅");
  }
  window.addToCart = addToCart;       // זמינות גלובלית
  window.updateCartCount = updateCartCount;
  
  // === רינדור עמוד הסל ===
  document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
  
    const cartItemsContainer = document.getElementById("cart-items");
    const cartSummary        = document.getElementById("cart-summary");
    const checkoutContainer  = document.getElementById("checkout-form");
  
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  
    // סל ריק
    if (!cart.length) {
      if (cartItemsContainer) cartItemsContainer.innerHTML = "<p>הסל שלך ריק.</p>";
      if (cartSummary) cartSummary.innerHTML = "";
      if (checkoutContainer) checkoutContainer.innerHTML = "";
      return;
    }
  
    // רינדור פריטים
    let total = 0;
    if (cartItemsContainer) cartItemsContainer.innerHTML = "";
    cart.forEach((item, index) => {
      total += Number(item.price) * (item.quantity || 1);
  
      const div = document.createElement("div");
      div.className = "cart-line";
      div.innerHTML = `
        <div style="border:1px solid #ccc; margin:1rem 0; padding:1rem; display:flex; align-items:center; gap:12px;">
          <img src="${item.thumbnail || ""}" style="width:80px; height:80px; object-fit:cover;">
          <div style="flex:1;">
            <div><strong>${item.title}</strong></div>
            <div>$${Number(item.price).toFixed(2)}</div>
          </div>
          <label>כמות:
            <input type="number" value="${item.quantity || 1}" min="1" data-index="${index}" class="qty-input" style="width:64px; margin-inline-start:6px;">
          </label>
          <button data-index="${index}" class="remove-btn">הסר</button>
        </div>
      `;
      cartItemsContainer?.appendChild(div);
    });
  
    // סיכום + כפתור לרכישה
    if (cartSummary) {
      cartSummary.innerHTML = `
        <h3>סה"כ לתשלום: $${total.toFixed(2)}</h3>
        <button id="checkoutBtn" class="btn">לרכישה</button>
      `;
    }
  
    // שינוי כמות (על האינפוטים שכבר קיימים)
    cartItemsContainer?.querySelectorAll(".qty-input").forEach(input => {
      input.addEventListener("change", (e) => {
        const idx = Number(e.target.dataset.index);
        const val = Math.max(1, parseInt(e.target.value || "1", 10));
        cart[idx].quantity = val;
        localStorage.setItem("cart", JSON.stringify(cart));
        location.reload(); // לרענן סכום וממשק
      });
    });
  
    // הסרה מהסל
    cartItemsContainer?.querySelectorAll(".remove-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = Number(e.target.dataset.index);
        cart.splice(idx, 1);
        localStorage.setItem("cart", JSON.stringify(cart));
        location.reload();
      });
    });
  
    // === Delegation לכפתורים הדינאמיים ===
    document.addEventListener("click", async (e) => {
      // יצירת טופס התשלום
      if (e.target && e.target.id === "checkoutBtn") {
        if (checkoutContainer) {
          checkoutContainer.innerHTML = `
            <h3>פרטי משלוח ותשלום</h3>
            <form id="checkoutForm">
              <label>כתובת למשלוח:<br><input type="text" required></label><br><br>
              <label>מספר כרטיס אשראי:<br><input type="text" required></label><br><br>
              <button type="submit" id="placeOrderBtn" class="btn">אישור רכישה</button>
            </form>
          `;
        }
      }
  
      // ביצוע ההזמנה (הכפתור נוצר דינאמית – זה נתפס כי זה delegation)
      if (e.target && e.target.id === "placeOrderBtn") {
        e.preventDefault();
        try {
          // placeOrderFromCart מוגדר ב-user.js
          const order = await (typeof placeOrderFromCart === "function"
            ? placeOrderFromCart()
            : (async () => {
                // fallback ללא user.js – רק מנקה סל מקומי
                const c = JSON.parse(localStorage.getItem("cart") || "[]");
                if (!c.length) return null;
                localStorage.setItem("cart", "[]");
                updateCartCount();
                return { id: "local_" + Date.now(), items: c, total: c.reduce((s,i)=>s+i.price*(i.quantity||1),0) };
              })());
  
          if (order) {
            alert("תודה! ההזמנה נשמרה");
            window.location.href = "profile.html";
          }
        } catch (err) {
          console.error("Checkout failed:", err);
          alert("הייתה בעיה בביצוע ההזמנה. נסי שוב.");
        }
      }
    });
  });
  