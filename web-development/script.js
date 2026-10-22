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


/* ===== accent colour picker ===== */
const root = document.documentElement;
const accentWrap = document.querySelector(".accent-wrap");
const swatches = [...document.querySelectorAll(".accent-pop button")];
function setAccent(a) {
    root.dataset.accent = a;
    try { localStorage.setItem("accent", a); } catch (e) {}
    swatches.forEach(b => b.classList.toggle("on", b.dataset.accent === a));
}
swatches.forEach(b => b.addEventListener("click", () => setAccent(b.dataset.accent)));
document.getElementById("accentBtn").addEventListener("click", e => { e.stopPropagation(); accentWrap.classList.toggle("open"); });
document.addEventListener("click", e => { if (!accentWrap.contains(e.target)) accentWrap.classList.remove("open"); });
setAccent(root.dataset.accent || "aurora");


/* ===== projects: favourites, search and filters ===== */
const cards = [...document.querySelectorAll(".project-card")];
const chips = [...document.querySelectorAll(".chip")];
const searchEl = document.getElementById("search");
const infoEl = document.getElementById("resultInfo");
const emptyEl = document.getElementById("empty");
let favs = [], filter = "all", query = "";
try { favs = JSON.parse(localStorage.getItem("favs") || "[]"); } catch (e) {}

cards.forEach(card => {
    const title = card.querySelector("h2").textContent.trim();
    const type = card.querySelector(".project-type").textContent;
    card.dataset.cat = /JAVASCRIPT/i.test(type) ? "js" : "web";
    card.dataset.text = (title + " " + card.querySelector("p").textContent + " " + type).toLowerCase();
    card._title = title;
    const fav = document.createElement("button");
    fav.className = "fav"; fav.type = "button";
    fav.setAttribute("aria-label", "Save " + title + " to favorites");
    fav.textContent = "♥";
    fav.classList.toggle("on", favs.includes(title));
    fav.addEventListener("click", e => {
        e.preventDefault(); e.stopPropagation();
        const on = !fav.classList.contains("on");
        fav.classList.toggle("on", on);
        favs = on ? [...new Set([...favs, title])] : favs.filter(t => t !== title);
        try { localStorage.setItem("favs", JSON.stringify(favs)); } catch (e) {}
        applyFilters();
    });
    card.querySelector(".project-image").append(fav);
});

function matches(c) {
    if (filter === "web" && c.dataset.cat !== "web") return false;
    if (filter === "js" && c.dataset.cat !== "js") return false;
    if (filter === "fav" && !favs.includes(c._title)) return false;
    return !query || c.dataset.text.includes(query);
}
function applyFilters() {
    let shown = 0;
    cards.forEach(c => {
        const show = matches(c), wasHidden = c.classList.contains("is-hidden");
        c.classList.toggle("is-hidden", !show);
        if (show) {
            shown++;
            if (wasHidden) { c.classList.remove("pop"); void c.offsetWidth; c.classList.add("pop"); }
        }
    });
    const n = { all: cards.length, web: 0, js: 0, fav: 0 };
    cards.forEach(c => { n[c.dataset.cat]++; if (favs.includes(c._title)) n.fav++; });
    chips.forEach(ch => ch.querySelector("b").textContent = n[ch.dataset.filter]);
    infoEl.textContent = `Showing ${shown} of ${cards.length} projects`;
    emptyEl.hidden = shown > 0;
    emptyEl.textContent = filter === "fav" && !query
        ? "No favorites yet. Tap the ♥ on any project to save it here."
        : "No projects match your search.";
}
chips.forEach(ch => ch.addEventListener("click", () => {
    filter = ch.dataset.filter;
    chips.forEach(c => c.classList.toggle("on", c === ch));
    applyFilters();
}));
searchEl.addEventListener("input", () => { query = searchEl.value.trim().toLowerCase(); applyFilters(); });
applyFilters();


/* ===== back to top ===== */
const toTop = document.getElementById("toTop");
addEventListener("scroll", () => toTop.classList.toggle("show", scrollY > 700), { passive: true });
toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));


/* ===== keyboard shortcuts:  /  search   T  theme   Esc  clear ===== */
addEventListener("keydown", e => {
    const typing = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
    if (e.key === "/" && !typing) { e.preventDefault(); searchEl.focus(); }
    else if (e.key === "Escape") {
        accentWrap.classList.remove("open");
        if (typing || query) { searchEl.value = ""; query = ""; applyFilters(); searchEl.blur(); }
    }
    else if ((e.key === "t" || e.key === "T") && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) themeBtn.click();
});
