// app.js — cleaned & unified

document.addEventListener("DOMContentLoaded", () => {
  // ====== DOM refs ======
  const newArrivalsContainer = document.getElementById("new-arrivals");
  const promoContainer       = document.getElementById("promotions");

  // header / search / cart
  const searchInput = document.getElementById("searchInput");
  const cartCountEl = document.getElementById("cartCount");

  // side menu
  const hamburger     = document.getElementById("hamburger");
  const sideMenu      = document.getElementById("sideMenu");
  const sideOverlay   = document.getElementById("sideOverlay");
  const sideCategories= document.getElementById("sideCategories");

  // layout bits (guarded – לא חובה שיקיימו בכל עמוד)
  const hero              = document.querySelector(".hero");
  const bottomMenu        = document.querySelector(".bottom-menu");
  const categoryBar       = document.getElementById("categoryBar");
  const categoryBreadcrumb= document.getElementById("categoryBreadcrumb");

  // ====== small helpers ======
  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  const renderProducts = (products, container) => {
    if (!container || !Array.isArray(products)) return;
    container.innerHTML = "";
    products.forEach(p => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="${p.thumbnail}" alt="${escapeHtml(p.title)}" />
        <h3>${escapeHtml(p.title)}</h3>
        <p>$${Number(p.price).toFixed(2)}</p>
        <a class="btn" href="product.html?id=${p.id}">פרטים</a>
      `;
      container.appendChild(card);
    });
  };

  const productsTitle = document.getElementById('productsTitle');
function setProductsTitle(mode) {
  if (!productsTitle) return;
  productsTitle.textContent = (mode === 'browse') ? 'מוצרים חדשים' : 'מוצרים';
}


  // ====== CART COUNT (from localStorage) ======
  try {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    cartCountEl && (cartCountEl.textContent = cart.reduce((s,i)=>s+(i.quantity||1),0));
  } catch {}

  // ====== SIDE MENU open / close ======
  const openMenu  = () => { sideMenu?.classList.add("open"); sideOverlay?.classList.add("open"); sideMenu?.setAttribute("aria-hidden","false"); };
  const closeMenu = () => { sideMenu?.classList.remove("open"); sideOverlay?.classList.remove("open"); sideMenu?.setAttribute("aria-hidden","true"); };

  hamburger?.addEventListener("click", openMenu);
  sideOverlay?.addEventListener("click", closeMenu);
  document.addEventListener("keydown", (e)=>{ if(e.key === "Escape") closeMenu(); });

  // ====== LOAD CATEGORIES to side menu ======
  if (sideCategories) {
    fetch("https://dummyjson.com/products/categories")
      .then(r=>r.json())
      .then(categories=>{
        sideCategories.innerHTML = "";
        categories.forEach(cat=>{
          const name = (typeof cat === "string") ? cat : (cat.name || cat.category || "unknown");
          const li = document.createElement("li");
          const a  = document.createElement("a");
          a.href = "#";
          a.textContent = name;
          a.addEventListener("click",(e)=>{
            setProductsTitle('category');
            e.preventDefault();
            // כאן את יכולה לעשות ניתוב לעמוד קטגוריה ייעודי אם יש לך:
            // window.location.href = `category.html?name=${encodeURIComponent(name)}`;
            showCategory(name);
          });
          li.appendChild(a);
          sideCategories.appendChild(li);
        });
      })
      .catch(console.error);
  }

  // ====== SEARCH (Enter) ======
  const doSearch = () => {
    const q = (searchInput?.value || "").trim();
    if (!q) return;
    setProductsTitle('search');
    fetch(`https://dummyjson.com/products/search?q=${encodeURIComponent(q)}`)
      .then(res=>res.json())
      .then(data => renderProducts(data.products, newArrivalsContainer))
      .catch(console.error);
  };
  searchInput?.addEventListener("keydown", (e)=>{ if(e.key === "Enter") doSearch(); });

  // ====== HOMEPAGE LOADS ======
  // מוצרים חדשים
  if (newArrivalsContainer) {
    fetch("https://dummyjson.com/products?limit=8")
      .then(res=>res.json())
      .then(data => renderProducts(data.products, newArrivalsContainer))
      .catch(console.error);
  }

  // קידומי מכירות – שתי קטגוריות לדוגמה
  if (promoContainer) {
    const promoCategories = ["smartphones", "laptops"];
    Promise.all(
      promoCategories.map(cat =>
        fetch(`https://dummyjson.com/products/category/${cat}?limit=4`)
          .then(r=>r.json())
          .catch(()=>({products:[]}))
      )
    ).then(results => {
      results.forEach(({products}) => renderProducts(products, promoContainer));
    });
  }

  // ====== CATEGORY VIEW (optional inline loader) ======
  function showCategory(name){
    hero && (hero.style.display = "none");
    bottomMenu && (bottomMenu.style.display = "none");
    if (categoryBar) categoryBar.hidden = false;
    if (categoryBreadcrumb) categoryBreadcrumb.textContent = name;

    newArrivalsContainer && (newArrivalsContainer.innerHTML = "");
    fetch(`https://dummyjson.com/products/category/${encodeURIComponent(name)}`)
      .then(res=>res.json())
      .then(data=>{
        renderProducts(data.products, newArrivalsContainer || promoContainer);
        window.scrollTo({ top: 0, behavior: "smooth" });
        // לשמור ב‑URL כדי שאפשר לרענן/לשתף
        const url = new URL(window.location);
        url.searchParams.set("category", name);
        history.replaceState({}, "", url);
        closeMenu();
      })
      .catch(console.error);
  }

  // אם הגעתי עם ?category= ב‑URL – נטען אותה אוטומטית
  try {
    const url = new URL(window.location);
    const cat = url.searchParams.get("category");
    if (cat) showCategory(cat);
  } catch {}

  // ====== AUTH in header: show user name + logout ======
  const loginLink = document.getElementById("loginLink");
  let   userArea  = document.getElementById("userArea");

  // אם אין span מוכן בהדר – ניצור אחד (כדי שיעבוד גם בעמודים אחרים)
  if (!userArea) {
    const host = document.querySelector(".zh-right .zh-left");
    if (host) {
      userArea = document.createElement("span");
      userArea.id = "userArea";
      host.appendChild(userArea);
    }
  }

  let currentUser = null;
  try { currentUser = JSON.parse(localStorage.getItem("currentUser") || "null"); } catch {}

  if (currentUser && currentUser.email) {
    const displayName =
      currentUser.name ||
      [currentUser.firstName, currentUser.lastName].filter(Boolean).join(" ") ||
      currentUser.email.split("@")[0];

    if (loginLink) loginLink.style.display = "none";
    if (userArea) {
      userArea.innerHTML = `
      <a href="profile.html" class="hello-user"> ${escapeHtml(displayName)}</a>
      <button id="logoutBtn" class="linklike">התנתקות</button>
    `;    
      const logoutBtn = document.getElementById("logoutBtn");
      logoutBtn?.addEventListener("click", () => {
        localStorage.removeItem("currentUser");
        window.location.href = "index.html";
      });
    }
  } else {
    if (loginLink) loginLink.style.display = "";
    if (userArea) userArea.textContent = "";
  }

  // ====== (optional) react to storage changes from other tabs ======
  window.addEventListener("storage", (e) => {
    if (e.key === "currentUser") location.reload();
    if (e.key === "cart") {
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        cartCountEl && (cartCountEl.textContent = cart.reduce((s,i)=>s+(i.quantity||1),0));
      } catch {}
    }
  });
});
