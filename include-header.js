document.addEventListener('DOMContentLoaded', async () => {
    const headerContainer = document.querySelector('[data-include="header"]');
    try {
      const res = await fetch('header.html');
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      headerContainer.innerHTML = await res.text();
    } catch (e) {
      console.error("שגיאה בטעינת ההדר:", e);
    }
  });
  