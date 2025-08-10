// product.js
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("product-details");
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  if (!productId) {
    container.innerHTML = "<p>מוצר לא נמצא.</p>";
    return;
  }

  // לוודא שיש window.addToCart (למקרה ש-cart.js טרם נטען)
  if (typeof window.addToCart !== "function") {
    window.addToCart = function (p) {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const existing = cart.find(i => i.id === p.id);
      existing ? existing.quantity++ : cart.push({ ...p, quantity: 1 });
      localStorage.setItem("cart", JSON.stringify(cart));
      alert("המוצר נוסף לסל ✅");
      const el = document.getElementById("cart-count");
      if (el) el.textContent = cart.reduce((s,i)=>s+i.quantity,0);
    };
  }

  fetch(`https://dummyjson.com/products/${productId}`)
    .then(res => res.json())
    .then(product => {
      container.innerHTML = `
        <div class="product-page">
          <section class="product-gallery">
            <img id="mainImage" src="${product.thumbnail}" alt="${product.title}">
            <div class="thumbs">
              ${product.images.map(img => `<img src="${img}" alt="${product.title}">`).join("")}
            </div>
          </section>

          <section class="product-info">
            <h1>${product.title}</h1>
            <div class="product-price">$${product.price}</div>
            <p class="product-desc">${product.description}</p>
            <button class="btn-primary" id="addToCartBtn">הוספה לסל</button>
          </section>
        </div>
      `;

      // החלפת התמונה הראשית
      container.querySelectorAll(".thumbs img").forEach(img => {
        img.addEventListener("click", () => {
          container.querySelector("#mainImage").src = img.src;
        });
      });

      // הוספה לסל
      container.querySelector("#addToCartBtn").addEventListener("click", () => {
        window.addToCart({
          id: product.id,
          title: product.title,
          price: product.price,
          thumbnail: product.thumbnail,
          quantity: 1,
        });
      });
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = "<p>שגיאה בטעינה</p>";
    });
});
