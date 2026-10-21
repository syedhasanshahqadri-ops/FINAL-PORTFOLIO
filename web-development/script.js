/* dark / light mode */
const themeBtn = document.getElementById("themeBtn");
function setTheme(t) {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem("theme", t); } catch (e) {}
}
themeBtn.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    if (document.startViewTransition) document.startViewTransition(() => setTheme(next));
    else setTheme(next);
});

const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;

/* scroll reveal (staggered) + counters */
const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add("show");
        e.target.querySelectorAll("[data-count]").forEach(countUp);
        io.unobserve(e.target);
    });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((el, i) => {
    if (!el.classList.contains("project-card")) el.style.setProperty("--d", (i % 4) * 0.1 + "s");
    io.observe(el);
});

function countUp(el) {
    const end = +el.dataset.count, suffix = el.dataset.suffix || "";
    let n = 0;
    const step = () => {
        n += Math.max(1, end / 50);
        if (n >= end) { el.textContent = end + suffix; return; }
        el.textContent = Math.floor(n) + suffix;
        requestAnimationFrame(step);
    };
    step();
}

/* scroll progress + orb parallax */
const bar = document.querySelector(".progress");
const orbs = document.querySelectorAll(".orb");
addEventListener("scroll", () => {
    const h = document.documentElement;
    bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100 + "%";
    orbs.forEach((o, i) => o.style.translate = `0 ${scrollY * (0.08 + i * 0.05)}px`);
}, { passive: true });

if (fine) {
    /* cursor glow */
    const glow = document.querySelector(".cursor-glow");
    addEventListener("mousemove", e => {
        glow.style.left = e.clientX + "px";
        glow.style.top = e.clientY + "px";
    });

    /* hero 3D scene follows mouse */
    const scene = document.querySelector(".scene");
    addEventListener("mousemove", e => {
        const x = (e.clientX / innerWidth - 0.5) * 24;
        const y = (e.clientY / innerHeight - 0.5) * -24;
        scene.style.transform = `rotateX(${y}deg) rotateY(${x}deg)`;
    });

    /* 3D tilt + glare on cards */
    document.querySelectorAll("[data-tilt]").forEach(card => {
        const img = card.querySelector(".project-image");
        card.addEventListener("mousemove", e => {
            const r = card.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width;
            const py = (e.clientY - r.top) / r.height;
            card.style.transform = `rotateY(${(px - 0.5) * 14}deg) rotateX(${(0.5 - py) * 14}deg) translateZ(14px)`;
            const ir = img.getBoundingClientRect();
            img.style.setProperty("--gx", ((e.clientX - ir.left) / ir.width) * 100 + "%");
            img.style.setProperty("--gy", ((e.clientY - ir.top) / ir.height) * 100 + "%");
        });
        card.addEventListener("mouseleave", () => card.style.transform = "");
    });

    /* magnetic buttons */
    document.querySelectorAll(".magnetic").forEach(el => {
        el.addEventListener("mousemove", e => {
            const r = el.getBoundingClientRect();
            el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
        });
        el.addEventListener("mouseleave", () => el.style.transform = "");
    });
}
