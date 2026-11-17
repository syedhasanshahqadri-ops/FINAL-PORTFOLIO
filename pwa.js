/* Install + offline helper, used by both the home page and the web development page */
(function () {
    var here = document.currentScript ? document.currentScript.src : location.href;
    var swUrl = new URL("sw.js", here).href;

    /* tiny styles for the install button and the toast (they follow the page's accent colour) */
    var css = document.createElement("style");
    css.textContent =
        ".install-btn{display:none;align-items:center;gap:8px;height:42px;padding:0 16px;border-radius:30px;border:1px solid var(--border);" +
        "background:color-mix(in srgb,var(--a2,var(--blue)) 14%,transparent);color:var(--text);font:700 12px Inter,sans-serif;cursor:pointer;white-space:nowrap;transition:box-shadow .3s,transform .2s}" +
        ".install-btn.show{display:inline-flex}" +
        ".install-btn:hover{box-shadow:0 0 22px color-mix(in srgb,var(--a2,var(--blue)) 45%,transparent);transform:translateY(-1px)}" +
        ".install-btn i{font-style:normal;font-size:15px;color:var(--a1,var(--cyan))}" +
        ".pwa-toast{position:fixed;left:50%;bottom:26px;translate:-50% 30px;z-index:400;max-width:92vw;padding:13px 20px;border-radius:14px;" +
        "background:#07130f;color:#fff;border:1px solid color-mix(in srgb,var(--a1,var(--cyan)) 55%,transparent);font:600 13px Inter,sans-serif;" +
        "box-shadow:0 18px 50px rgba(0,0,0,.45);opacity:0;pointer-events:none;transition:opacity .35s,translate .35s}" +
        ".pwa-toast.show{opacity:1;translate:-50% 0}" +
        ".pwa-sheet{position:fixed;inset:0;z-index:500;display:none;place-items:center;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);padding:20px}" +
        ".pwa-sheet.show{display:grid}" +
        ".pwa-sheet div{max-width:340px;padding:26px;border-radius:20px;background:#07130f;color:#fff;border:1px solid color-mix(in srgb,var(--a1,var(--cyan)) 50%,transparent);font:500 14px/1.7 Inter,sans-serif}" +
        ".pwa-sheet b{display:block;font:800 18px Manrope,Inter,sans-serif;margin-bottom:8px}" +
        ".pwa-sheet button{margin-top:16px;width:100%;padding:12px;border:0;border-radius:12px;background:var(--a1,var(--cyan));color:#06130f;font:800 13px Inter,sans-serif;cursor:pointer}" +
        "@media(max-width:520px){.install-btn span{display:none}.install-btn{padding:0;width:42px;justify-content:center}}";
    document.head.appendChild(css);

    /* toast */
    var toast = document.createElement("div");
    toast.className = "pwa-toast"; toast.setAttribute("role", "status");
    document.body.appendChild(toast);
    var toastTimer;
    function say(msg, ms) {
        toast.textContent = msg; toast.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toast.classList.remove("show"); }, ms || 3800);
    }

    /* service worker (this is what makes everything work offline) */
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener("message", function (e) {
            if (e.data && e.data.type === "offline-ready") {
                var seen = false;
                try { seen = localStorage.getItem("offlineReady") === "1"; localStorage.setItem("offlineReady", "1"); } catch (x) {}
                if (!seen) say("Ready for offline use. The whole portfolio is saved on this device.", 5200);
            }
        });
        addEventListener("load", function () {
            navigator.serviceWorker.register(swUrl).catch(function () {});
        });
    }
    addEventListener("offline", function () { say("You are offline. Showing the saved copy of the portfolio.", 4200); });
    addEventListener("online", function () { say("Back online.", 2200); });

    /* install button */
    var standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    var deferred = null;

    var btn = document.createElement("button");
    btn.type = "button"; btn.className = "install-btn";
    btn.setAttribute("aria-label", "Install this portfolio as an app");
    btn.innerHTML = "<i>⬇</i><span>Install App</span>";

    var theme = document.getElementById("themeBtn");
    var actions = document.querySelector(".nav-actions");
    if (theme && theme.parentNode) theme.parentNode.insertBefore(btn, theme.nextSibling);
    else if (actions) actions.insertBefore(btn, actions.firstChild);

    var sheet = document.createElement("div");
    sheet.className = "pwa-sheet";
    sheet.innerHTML = "<div><b>Install on iPhone / iPad</b>Tap the <strong>Share</strong> button in Safari, then choose <strong>Add to Home Screen</strong>. The portfolio will open like an app and work offline.<button type=\"button\">Got it</button></div>";
    document.body.appendChild(sheet);
    sheet.addEventListener("click", function (e) { if (e.target === sheet || e.target.tagName === "BUTTON") sheet.classList.remove("show"); });

    if (!standalone) {
        addEventListener("beforeinstallprompt", function (e) {
            e.preventDefault(); deferred = e; btn.classList.add("show");
        });
        if (ios) btn.classList.add("show");
    }
    btn.addEventListener("click", function () {
        if (deferred) {
            deferred.prompt();
            deferred.userChoice.then(function () { deferred = null; btn.classList.remove("show"); });
        } else if (ios) sheet.classList.add("show");
    });
    addEventListener("appinstalled", function () { btn.classList.remove("show"); say("Installed. Open it from your home screen or app list.", 4200); });
})();
