/* =====================================================================
   animations.js — hiệu ứng GSAP cho thiệp cưới
   Nạp SAU main.js. Cần: gsap, ScrollTrigger, SplitText (3.13+).
   - Không sửa HTML: tự gỡ class .rv / .io cũ rồi để GSAP lo toàn bộ.
   - Chạy sau khi phong bì mở (body.opened), lúc đó main.js đã điền xong chữ.
   - Tôn trọng prefers-reduced-motion: tắt hiệu ứng thì mọi thứ hiện sẵn.
   ===================================================================== */
(function () {
    "use strict";

    if (!window.gsap || !window.ScrollTrigger) {
        console.error("[animations] Thiếu GSAP hoặc ScrollTrigger.");
        return;
    }
    const hasSplit = !!window.SplitText;
    gsap.registerPlugin(ScrollTrigger);
    if (hasSplit) gsap.registerPlugin(SplitText);

    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

    /* ---- 1. Gỡ hiệu ứng CSS cũ để không đánh nhau với GSAP ---- */
    const oldIo = $$(".io");
    $$(".rv, .io").forEach((el) =>
        el.classList.remove("rv", "io", "d1", "d2", "d3"),
    );

    /* ---- 2. Tiện ích ---- */
    const FULL = "inset(0% 0% 0% 0%)";
    const TEXT_IN = {
        opacity: 0,
        y: 22,
        filter: "blur(5px)",
        duration: 0.9,
        ease: "power2.out",
    };
    const origins = ["0% 0%", "100% 0%", "0% 100%", "100% 100%"]; // tl tr bl br

    // tách chữ thành từ (giữ nguyên font script, không làm đứt nét)
    const words = (el, type = "words") => {
        if (!el) return [];
        if (!hasSplit) return [el];
        const s = SplitText.create(el, { type });
        return type === "chars" ? s.chars : s.words;
    };

    const tl = (trigger, start = "top 85%", vars = {}) =>
        gsap.timeline({
            scrollTrigger: { trigger, start, once: true },
            ...vars,
        });

    const handled = new Set();
    const mark = (...els) => els.forEach((e) => e && handled.add(e));

    const setCornerOrigins = (corners) =>
        corners.forEach((c, i) => (c.style.transformOrigin = origins[i] || "50% 50%"));


    function hero() {
        const h = $(".hero");
        if (!h) return;

        const t = gsap.timeline({
            delay: 0.35,
            defaults: { ease: "power3.out" },
        });

        t.from(".hero-media", { scale: 1.12, duration: 2.1, ease: "power2.out" }, 0)
            .from(".hero-kicker span", { opacity: 0, y: -12, duration: 0.65, stagger: 0.1 }, 0.3)
            .from(
                words($(".first-title span")),
                { ...TEXT_IN, y: 36, x: -18, stagger: 0.12, duration: 0.9 },
                0.35,
            )
            .from(
                words($(".second-title span")),
                { ...TEXT_IN, y: 36, x: 18, stagger: 0.12, duration: 0.9 },
                0.65,
            )
            .from(words($(".hero-title p")), { opacity: 0, y: 10, stagger: 0.055, duration: 0.65 }, 1.2)
            .from(".hn-groom", { opacity: 0, x: -45, duration: 0.9 }, 1.05)
            .from(".hn-bride", { opacity: 0, x: 45, duration: 0.9 }, 1.05);

        gsap.to(".hero-title", {
            y: -70,
            opacity: 0.15,
            ease: "none",
            scrollTrigger: { trigger: h, start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to(".hero-names", {
            y: -30,
            ease: "none",
            scrollTrigger: { trigger: h, start: "top top", end: "bottom top", scrub: true },
        });
    }

    function titles() {
        $$(".title-stack").forEach((ts) => {
            const prev = ts.previousElementSibling;
            const icon = prev && prev.classList.contains("patten-introduce") ? prev : null;
            const t = tl(ts, "top 85%");
            if (icon) t.from(icon, { scale: 0, rotation: -120, duration: 0.9, ease: "back.out(2)" }, 0);
            t.from(words($(".t-line-1", ts)), { ...TEXT_IN, x: -30, stagger: 0.12 }, 0.1).from(
                words($(".t-line-2", ts)),
                { ...TEXT_IN, x: 30, stagger: 0.12 },
                0.35,
            );
        });
    }

    function welcome() {
        const cw = $(".content-wrap");
        if (cw) {
            const img = $("img", cw);
            const corners = $$(".corner", cw);
            setCornerOrigins(corners);
            tl(cw, "top 80%")
                .fromTo(img, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: FULL, duration: 1.3, ease: "power3.out", clearProps: "clipPath" })
                .from(img, { scale: 1.25, duration: 1.8, ease: "power2.out" }, "<")
                .from(corners, { scale: 0, opacity: 0, duration: 0.7, ease: "back.out(2.4)", stagger: 0.08 }, "-=1.2")
                .from($$(".frame-label", cw), { opacity: 0, duration: 0.9, stagger: 0.12 }, "-=0.7");
        }

        const note = $(".welcome-note");
        if (note) {
            mark(note);
            tl(note, "top 88%").from(words($(".wn-line", note)), {
                opacity: 0,
                y: 14,
                filter: "blur(4px)",
                duration: 0.7,
                ease: "power2.out",
                stagger: 0.05,
            });
        }
    }

    function loveLetter() {
        [
            { sel: ".groom-letter", text: ".groom-text", from: "inset(0% 100% 0% 0%)" },
            { sel: ".bride-letter", text: ".bride-text", from: "inset(0% 0% 0% 100%)" },
        ].forEach(({ sel, text, from }) => {
            const el = $(sel);
            if (!el) return;
            const img = $("img", el);
            const block = $(".block-design", el);
            const [role, name, quote] = $$(`${text} > span`, el);

            // chỉ tween clip-path nên không đụng tới transform lệch của khối olive
            tl(el, "top 78%")
                .fromTo(img, { clipPath: from }, { clipPath: FULL, duration: 1.2, ease: "power3.out", clearProps: "clipPath" }, 0)
                .fromTo(block, { clipPath: from }, { clipPath: FULL, duration: 1.2, ease: "power3.out", clearProps: "clipPath" }, 0.25)
                .from(role, { opacity: 0, y: 10, duration: 0.6 }, 0.7)
                .from(words(name), { ...TEXT_IN, y: 26, stagger: 0.12 }, 0.85)
                .from(words(quote), { opacity: 0, y: 16, filter: "blur(4px)", duration: 0.7, ease: "power2.out", stagger: 0.05 }, 1.2);
        });
    }

    function story() {
        const stage = $("#storyStage");
        if (!stage) return;
        mark(stage);
        const corners = $$(".story-frame .corner");
        setCornerOrigins(corners);
        tl(stage, "top 80%")
            .from(corners, { scale: 0, opacity: 0, duration: 0.6, ease: "back.out(2.4)", stagger: 0.08 })
            .fromTo(".story-card", { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: FULL, duration: 1.1, ease: "power3.out", clearProps: "clipPath" }, "-=0.3")
            .from(".sf-edge", { opacity: 0, duration: 0.8, stagger: 0.1 }, "-=0.6");
    }

    function album() {
        const scroller = $("#albumScroll");
        if (!scroller) return;
        tl(scroller, "top 85%")
            .from("#albumFrame", { opacity: 0, y: 40, duration: 1.1, ease: "power2.out", clearProps: "opacity,transform" })
            .from(".first-card .shot", { opacity: 0, duration: 0.8, stagger: 0.08, clearProps: "opacity" }, "-=0.6");
    }

    function invite() {
        const mid = $(".mid-info");
        if (mid) tl(mid, "top 90%").from(mid, { scale: 0.6, opacity: 0, duration: 1, ease: "back.out(2)" });

        const info = $(".wed-info");
        if (info) {
            mark(info);
            const g = $(".groom-info", info);
            const b = $(".bride-info", info);
            tl(info, "top 85%")
                .from(g, { x: -40, opacity: 0, duration: 1, ease: "power3.out" }, 0)
                .from(b, { x: 40, opacity: 0, duration: 1, ease: "power3.out" }, 0)
                .from($$(".groom-info > *, .bride-info > *"), { opacity: 0, y: 14, duration: 0.7, stagger: 0.08 }, 0.35);
        }

        const ev = $(".inv-event");
        if (ev) {
            mark(ev);
            const t = tl(ev, "top 82%");
            t.from($(".inv-label", ev), { opacity: 0, y: 14, duration: 0.7, ease: "power2.out" })
                .from(words($(".inv-time", ev), "chars"), { opacity: 0, y: 40, scale: 0.8, duration: 0.9, ease: "back.out(2)", stagger: 0.07 }, "-=0.3")
                .from($(".inv-side-l", ev), { opacity: 0, x: 30, duration: 0.7, ease: "power2.out" }, "-=0.2")
                .from($(".inv-side-r", ev), { opacity: 0, x: -30, duration: 0.7, ease: "power2.out" }, "<")
                .from($(".inv-day", ev), { opacity: 0, scale: 0.4, duration: 1, ease: "back.out(1.8)" }, "<")
                .from($$(".inv-year, .inv-lunar", ev), { opacity: 0, y: 10, duration: 0.7, stagger: 0.12 }, "-=0.4")
                .from($$(".inv-slot", ev), { opacity: 0, y: 20, duration: 0.7, stagger: 0.15, ease: "power2.out" }, "-=0.2");
        }
    }

    function countdown() {
        const wrap = $(".wed-date");
        if (wrap) {
            mark(wrap);
            tl(wrap, "top 85%")
                .from(".time-note", { opacity: 0, y: 16, duration: 0.8, ease: "power2.out" })
                .from(".time-item", { opacity: 0, y: 60, scale: 0.9, duration: 0.9, ease: "back.out(1.6)", stagger: 0.12 }, "-=0.3");
        }

        const td = $(".title-date");
        if (td) {
            tl(td, "top 88%")
                .from(".t-date-line-1", { opacity: 0, y: 16, letterSpacing: "0.12em", duration: 1, ease: "power2.out" })
                .from(".t-date-line-2", { opacity: 0, y: 12, duration: 0.8 }, "-=0.5");
        }

        const cal = $("#wedCal");
        if (cal) {
            mark(cal);
            const t = tl(cal, "top 80%");
            t.from($("img", cal), { scale: 1.3, duration: 2, ease: "power2.out" }, 0)
                .from($(".cal-text span", cal), { opacity: 0, y: -20, filter: "blur(4px)", duration: 1 }, 0.3)
                .from($(".cal-panel", cal), { opacity: 0, y: 40, duration: 0.9, ease: "power2.out" }, 0.5)
                .from($$(".cal-day", cal), { opacity: 0, duration: 0.5, stagger: { each: 0.02, from: "start" } }, 0.9)
                .from($(".cal-day.is-wed", cal), { scale: 0, duration: 0.9, ease: "back.out(3)" }, "-=0.2");
        }
    }

    function wishesAndMap() {
        const ws = $(".wishes-section");
        if (ws) {
            mark(ws);
            const t = tl($(".wishes-intro", ws) || ws, "top 88%");
            t.from(".wishes-intro", { opacity: 0, y: 16, duration: 0.8 }).from(
                $$(".wishes-form > *"),
                { opacity: 0, y: 24, duration: 0.7, ease: "power2.out", stagger: 0.1 },
                "-=0.3",
            );
        }

        const map = $("#weddingMap");
        if (map) {
            mark(map);
            tl(map, "top 85%")
                .from($$(".inv-label, .map-title", map), { opacity: 0, y: 16, duration: 0.8, stagger: 0.12 })
                .from(".map-tabs", { opacity: 0, y: 12, duration: 0.6 }, "-=0.4")
                .fromTo(".map-frame", { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: FULL, duration: 1.2, ease: "power3.out", clearProps: "clipPath" }, "-=0.3")
                .from($$(".map-addr, .map-link", map), { opacity: 0, y: 14, duration: 0.7, stagger: 0.12 }, "-=0.5");
        }
    }

    function footer() {
        const f = $("footer .wrap");
        if (!f) return;
        mark(f);
        tl(f, "top 92%")
            .from(words($(".big", f)), { ...TEXT_IN, y: 34, stagger: 0.18, duration: 1.1 })
            .from($(".sub", f), { opacity: 0, y: 10, letterSpacing: "0.6em", duration: 1.2, ease: "power2.out" }, "-=0.5");
    }

    function fallback() {
        oldIo
            .filter((el) => !handled.has(el))
            .forEach((el) =>
                gsap.from(el, {
                    opacity: 0,
                    y: 26,
                    duration: 1,
                    ease: "power3.out",
                    scrollTrigger: { trigger: el, start: "top 88%", once: true },
                }),
            );
    }

    function build() {
        hero();
        titles();
        welcome();
        loveLetter();
        story();
        album();
        invite();
        countdown();
        wishesAndMap();
        footer();
        fallback();

        requestAnimationFrame(() => ScrollTrigger.refresh());
        window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
    }

    function start() {
        const mm = gsap.matchMedia();
        mm.add("(prefers-reduced-motion: no-preference)", () => {
            const run = () => build();
            if (document.fonts && document.fonts.status !== "loaded") {
                document.fonts.ready.then(run);
            } else {
                run();
            }
        });
    }

    if (document.body.classList.contains("opened")) {
        start();
    } else {
        const mo = new MutationObserver(() => {
            if (document.body.classList.contains("opened")) {
                mo.disconnect();
                start();
            }
        });
        mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    }
})();
