document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const categoryName = params.get("name");
  
    const titleEl = document.getElementById("categoryTitle");
    const container = document.getElementById("categoryProducts");

    setProductsTitle('category'); 

  
    if (!categoryName) {
      titleEl.textContent = "קטגוריה לא נמצאה";
      return;
    }
  
    titleEl.textContent = categoryName;
  
    fetch(`https://dummyjson.com/products/category/${encodeURIComponent(categoryName)}`)
      .then(res => res.json())
      .then(data => {
        data.products.forEach(product => {
          const card = document.createElement("div");
          card.className = "product-card";
          card.innerHTML = `
            <img src="${product.thumbnail}" alt="${product.title}">
            <h3>${product.title}</h3>
            <p>$${Number(product.price).toFixed(2)}</p>
            <a href="product.html?id=${product.id}" class="btn">פרטים</a>
          `;
          container.appendChild(card);
        });
      });
  });
  