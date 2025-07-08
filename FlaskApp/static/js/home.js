// static/js/home.js
document.addEventListener("DOMContentLoaded", () => {
  const texts = document.querySelectorAll(".home-text");
  const cta   = document.querySelector(".home-cta");
  if (!texts.length || !cta) return;

  // 1) set initial states
  gsap.set(texts, { opacity: 0, y: 20 });
  gsap.set(cta,   { opacity: 0, scale: 0.8 });

  // 2) build timeline
  const tl = gsap.timeline({ defaults: { duration: 0.8, ease: "power2.out" } });
  tl.to(texts, { opacity: 1, y: 0, stagger: 0.4 })
    .to(cta,   { opacity: 1, scale: 1 }, "-=0.4");
});
