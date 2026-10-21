const $$ = s => [...document.querySelectorAll(s)];
const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;
const root = document.documentElement;

// Dark / light mode
const themeBtn = document.getElementById("themeBtn");
function setTheme(t) {
    root.dataset.theme = t;
    try { localStorage.setItem("theme", t); } catch (e) {}
    readDot();
}
themeBtn.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    if (document.startViewTransition) document.startViewTransition(() => setTheme(next));
    else setTheme(next);
});

// Mobile menu
const menuBtn = document.getElementById("menuBtn");
const navMenu = document.getElementById("navMenu");

menuBtn.addEventListener("click", () => {
    navMenu.classList.toggle("active");
});

// Close mobile menu after clicking a link
document.querySelectorAll("nav a").forEach(link => {
    link.addEventListener("click", () => {
        navMenu.classList.remove("active");
    });
});

// Split hero name into letters for the 3D fly-in
function split(node) {
    [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
            const t = n.textContent.trim();
            if (!t) return;
            const f = document.createDocumentFragment();
            [...t].forEach((c, i) => {
                const s = document.createElement("i");
                s.className = "ch";
                s.textContent = c === " " ? "\u00A0" : c;
                s.style.setProperty("--i", i);
                f.append(s);
            });
            n.replaceWith(f);
        } else split(n);
    });
}
$$(".hero h1").forEach(split);

// Count up numbers (03, 05+) in stats
function countUp(el) {
    const txt = el.textContent, num = parseInt(txt);
    if (isNaN(num)) return;
    const suffix = txt.replace(/[0-9]/g, ""), len = String(num).length === 1 ? 2 : String(num).length;
    let n = 0;
    const tick = () => {
        n += 1;
        el.textContent = String(Math.min(n, num)).padStart(len, "0") + suffix;
        if (n < num) setTimeout(tick, 150);
    };
    tick();
}

// Scroll reveal animation (staggered)
const revealObserver = new IntersectionObserver(
    (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
                entry.target.querySelectorAll(".stats strong").forEach(countUp);
                observer.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.12 }
);
$$(".reveal").forEach((el, i) => {
    el.style.setProperty("--d", (i % 4) * 0.1 + "s");
    revealObserver.observe(el);
});

// Navbar shadow on scroll + progress bar + parallax variable
const navbar = document.querySelector(".navbar");
const bar = document.querySelector(".progress");
window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 30);
    bar.style.width = (root.scrollTop / (root.scrollHeight - root.clientHeight)) * 100 + "%";
    root.style.setProperty("--sy", window.scrollY);
}, { passive: true });

// Interactive particle network background (follows the theme colour)
const cv = document.getElementById("bg"), ctx = cv.getContext("2d");
let W, H, dots = [], rgb = "25,227,177";
const mouse = { x: -999, y: -999 };
function readDot() { rgb = getComputedStyle(root).getPropertyValue("--dot").trim() || rgb; }
function resize() {
    W = cv.width = innerWidth; H = cv.height = innerHeight;
    dots = Array.from({ length: innerWidth < 700 ? 32 : 70 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5
    }));
}
function draw() {
    ctx.clearRect(0, 0, W, H);
    dots.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < 130) { p.x += dx / d * 1.6; p.y += dy / d * 1.6; }
        ctx.fillStyle = `rgba(${rgb},.7)`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, 7); ctx.fill();
        for (let j = i + 1; j < dots.length; j++) {
            const q = dots[j], l = Math.hypot(p.x - q.x, p.y - q.y);
            if (l < 125) {
                ctx.strokeStyle = `rgba(${rgb},${0.22 * (1 - l / 125)})`;
                ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
            }
        }
    });
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) requestAnimationFrame(draw);
}
readDot(); resize(); draw();
addEventListener("resize", resize);

if (fine) {
    addEventListener("mousemove", e => {
        mouse.x = e.clientX; mouse.y = e.clientY;
        root.style.setProperty("--mx", (e.clientX / innerWidth - 0.5).toFixed(3));
        root.style.setProperty("--mx2", (e.clientY / innerHeight - 0.5).toFixed(3));
    });

    // 3D tilt + spotlight on cards
    $$(".hero-card,.service-card,.work-card,.stats>div").forEach(card => {
        const img = card.querySelector(".work-image img");
        const max = card.classList.contains("hero-card") ? 14 : 8;
        card.addEventListener("mousemove", e => {
            const r = card.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
            card.style.transform = `perspective(900px) rotateY(${(px - 0.5) * max * 2}deg) rotateX(${(0.5 - py) * max * 2}deg) translateY(-6px)`;
            card.style.setProperty("--mx", px * 100 + "%");
            card.style.setProperty("--my", py * 100 + "%");
            if (img) img.style.translate = `${(0.5 - px) * 28}px ${(0.5 - py) * 18}px`;
        });
        card.addEventListener("mouseleave", () => {
            card.style.transform = "";
            if (img) img.style.translate = "";
        });
    });

    // Magnetic buttons
    $$(".magnetic").forEach(el => {
        el.addEventListener("mousemove", e => {
            const r = el.getBoundingClientRect();
            el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
        });
        el.addEventListener("mouseleave", () => el.style.transform = "");
    });
}
