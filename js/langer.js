document.addEventListener('DOMContentLoaded', () => {
      const urlParams = new URLSearchParams(window.location.search);
      const lang = urlParams.get("lang") || "en";
      document.querySelectorAll("[data-lang]").forEach(el => {
        el.style.display = (el.getAttribute("data-lang") === lang) ? "block" : "none";
      });
      document.querySelector('.multi-lang').style.display = 'block';
    });