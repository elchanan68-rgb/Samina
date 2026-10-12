document.addEventListener("DOMContentLoaded", () => {
  const brand = document.querySelector(".brand");

  if (brand) {
    brand.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
});
