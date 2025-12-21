const menuToggle = document.querySelector(".menu-toggle");
const sidebar = document.querySelector(".sidebar");
const links = document.querySelectorAll(".nav-list a");
const sections = document.querySelectorAll("section");
const themeToggle = document.querySelector(".theme-toggle");
const body = document.body;

menuToggle.addEventListener("click", () => sidebar.classList.toggle("active"));

links.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    links.forEach((l) => l.parentElement.classList.remove("active"));
    link.parentElement.classList.add("active");
    const target = link.getAttribute("href").replace("#", "");
    sections.forEach((sec) => sec.classList.remove("active"));
    document.getElementById(target).classList.add("active");
    sidebar.classList.remove("active");
  });
});

// themeToggle.addEventListener("click", () => {
//   if (body.getAttribute("data-theme") === "dark") {
//     body.setAttribute("data-theme", "light");
//     themeToggle.textContent = "🌙 Dark Mode";
//   } else {
//     body.setAttribute("data-theme", "dark");
//     themeToggle.textContent = "☀️ Light Mode";
//   }
// });

// about page
// Animate counters when they come into view
const stats = document.querySelectorAll(".stat");
const easeOut = (t) => --t * t * t + 1;

function formatNumber(n, el) {
  const fmt = el.dataset.format;
  if (fmt === "k") {
    if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "k";
  }
  return Math.floor(n).toLocaleString();
}

function animateCount(el) {
  const target = +el.dataset.target;
  const duration = 1400 + Math.min(1200, target / 2);
  const start = performance.now();
  const numEl = el.querySelector(".num");
  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = easeOut(t);
    const current = Math.floor(eased * target);
    numEl.textContent = formatNumber(current, el) + (el.dataset.suffix || "");
    if (t < 1) requestAnimationFrame(tick);
    else
      numEl.textContent = formatNumber(target, el) + (el.dataset.suffix || "");
  }
  requestAnimationFrame(tick);
}

const io = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        if (!el.classList.contains("counted")) {
          animateCount(el);
          el.classList.add("counted");
        }
      }
    });
  },
  { threshold: 0.4 }
);

stats.forEach((s) => io.observe(s));

// entrance animations for left items
window.addEventListener("load", () => {
  document.querySelectorAll(".fade-in").forEach((el, i) => {
    el.style.animationDelay = 0.08 * i + "s";
    el.classList.add("appear");
  });
});

// small interactive hover for nav
document.querySelectorAll(".nav a").forEach((a) => {
  a.addEventListener("mouseenter", () => (a.style.opacity = 1));
  a.addEventListener("mouseleave", () => (a.style.opacity = "0.9"));
});
