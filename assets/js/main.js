(function () {
  var $ = function (i) {
    return document.getElementById(i);
  };
  var params = new URLSearchParams(location.search);
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* cá nhân hoá */
  var guest = params.get("to");
  if (guest) {
    guest = guest.replace(/[<>]/g, "").slice(0, 60);
    $("gateGuest").textContent = guest;
  }
  var side = (params.get("side") || "").toLowerCase();
  if (side === "trai") $("sideLabel").textContent = "Thiệp mời nhà trai";
  else if (side === "gai") $("sideLabel").textContent = "Thiệp mời nhà gái";

  /* mở thiệp — phong bì */
  var envelope = $("envelope"),
    gate = $("gate");
  $("openBtn").addEventListener("click", function () {
    envelope.classList.add("open");
    setTimeout(function () {
      document.body.classList.add("opened");
      gate.classList.add("gone");
    }, 650);
  });

  /* hero slideshow */
  var frames = document.querySelectorAll("#heroMedia .frame");
  if (frames.length > 1 && !reduce) {
    var i = 0;
    setInterval(function () {
      frames[i].classList.remove("on");
      i = (i + 1) % frames.length;
      frames[i].classList.remove("on");
      void frames[i].offsetWidth;
      frames[i].classList.add("on");
    }, 7000);
  }

  /* đếm ngược — kiểu bảng lật */
  var target = new Date("2026-10-25T11:00:00+07:00").getTime();
  function pad(n) {
    return String(n).padStart(2, "0");
  }
  function setFlip(el, val) {
    if (el.textContent === val) return;
    if (!reduce) {
      el.classList.remove("flip");
      void el.offsetWidth;
      el.classList.add("flip");
      setTimeout(function () {
        el.textContent = val;
      }, 210);
    } else {
      el.textContent = val;
    }
  }
  function tick() {
    var d = Math.max(0, target - Date.now());
    setFlip($("cdD"), pad(Math.floor(d / 864e5)));
    setFlip($("cdH"), pad(Math.floor((d % 864e5) / 36e5)));
    setFlip($("cdM"), pad(Math.floor((d % 36e5) / 6e4)));
    setFlip($("cdS"), pad(Math.floor((d % 6e4) / 1e3)));
  }
  tick();
  setInterval(tick, 1000);

  /* hiện dần khi cuộn */
  if ("IntersectionObserver" in window) {
    var ob = new IntersectionObserver(
      function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("seen");
            ob.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    document.querySelectorAll(".io").forEach(function (el) {
      ob.observe(el);
    });
  } else {
    document.querySelectorAll(".io").forEach(function (el) {
      el.classList.add("seen");
    });
  }

  /* thanh dính đáy */
  var sticky = $("sticky"),
    hero = document.querySelector(".hero");
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      function (es) {
        sticky.classList.toggle(
          "show",
          !es[0].isIntersecting && document.body.classList.contains("opened"),
        );
      },
      { threshold: 0.15 },
    ).observe(hero);
  }

  /* toast */
  var t = $("toast"),
    tt;
  function toast(m) {
    t.textContent = m;
    t.classList.add("show");
    clearTimeout(tt);
    tt = setTimeout(function () {
      t.classList.remove("show");
    }, 2600);
  }

  /* lịch .ics */
  $("calBtn").addEventListener("click", function () {
    var ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Wedding//VN",
      "BEGIN:VEVENT",
      "DTSTART:20261025T040000Z",
      "DTEND:20261025T070000Z",
      "SUMMARY:Le thanh hon Hoang Nam & Khanh Linh",
      "LOCATION:GEM Center, 8 Nguyen Binh Khiem, Da Kao, Quan 1, TP.HCM",
      "DESCRIPTION:Don khach 10:30 - Khai tiec 11:30",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    var u = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    var a = document.createElement("a");
    a.href = u;
    a.download = "nam-linh-25-10-2026.ics";
    a.click();
    URL.revokeObjectURL(u);
    toast("Đã tải file lịch");
  });

  /* album lightbox */
  var imgs = [].slice.call(document.querySelectorAll("#hscrollTrack img"));
  var lb = $("lb"),
    lbImg = $("lbImg"),
    idx = 0;
  function show(n) {
    idx = (n + imgs.length) % imgs.length;
    lbImg.src = imgs[idx].src.replace(/w=\d+/, "w=1800");
    lbImg.alt = imgs[idx].alt;
    lb.classList.add("show");
  }
  imgs.forEach(function (im, n) {
    im.closest(".hcard").style.cursor = "pointer";
    im.closest(".hcard").addEventListener("click", function () {
      show(n);
    });
  });
  $("lbX").addEventListener("click", function () {
    lb.classList.remove("show");
  });
  $("lbP").addEventListener("click", function () {
    show(idx - 1);
  });
  $("lbN").addEventListener("click", function () {
    show(idx + 1);
  });
  lb.addEventListener("click", function (e) {
    if (e.target === lb) lb.classList.remove("show");
  });
  document.addEventListener("keydown", function (e) {
    if (!lb.classList.contains("show")) return;
    if (e.key === "Escape") lb.classList.remove("show");
    if (e.key === "ArrowLeft") show(idx - 1);
    if (e.key === "ArrowRight") show(idx + 1);
  });

  /* album — cuộn ngang ghim theo tiến độ cuộn dọc */
  (function () {
    var section = $("hscrollSection"),
      track = $("hscrollTrack"),
      fill = $("hscrollFill");
    if (!section || !track) return;
    if (reduce) {
      return;
    }
    var raf = null;
    function render() {
      raf = null;
      var rect = section.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      var progress =
        total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      var maxX = Math.max(
        0,
        track.scrollWidth -
          track.parentElement.clientWidth +
          (parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue(
              "--pad",
            ),
          ) || 24),
      );
      track.style.transform = "translate3d(-" + progress * maxX + "px,0,0)";
      if (fill) fill.style.width = progress * 100 + "%";
    }
    function onScroll() {
      if (raf === null) raf = requestAnimationFrame(render);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    render();
  })();

  /* rsvp */
  var form = $("rsvpForm"),
    done = $("rsvpDone");
  document.querySelectorAll('input[name="att"]').forEach(function (r) {
    r.addEventListener("change", function () {
      $("countF").style.display =
        document.querySelector('input[name="att"]:checked').value === "yes"
          ? ""
          : "none";
    });
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var nm = $("rName").value.trim();
    var go =
      document.querySelector('input[name="att"]:checked').value === "yes";
    var n = parseInt($("rCount").value || "0", 10);
    $("doneText").textContent = go
      ? "Cảm ơn " +
        nm +
        ". Chúng mình đã giữ " +
        (n + 1) +
        " chỗ cho ngày 25.10."
      : "Cảm ơn " + nm + " đã phản hồi. Hẹn gặp bạn dịp gần nhất nhé.";
    form.style.display = "none";
    done.classList.add("show");
    /* Gắn Google Form / API của bạn tại đây để lưu phản hồi thật */
  });
  $("again").addEventListener("click", function () {
    done.classList.remove("show");
    form.style.display = "";
  });

  /* lưu bút */
  $("wishForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var el = document.createElement("div");
    el.className = "wish";
    var b = document.createElement("b");
    b.textContent = $("wName").value.trim();
    var p = document.createElement("p");
    p.textContent = $("wText").value.trim();
    el.appendChild(b);
    el.appendChild(p);
    $("wishes").prepend(el);
    e.target.reset();
    toast("Cảm ơn lời chúc của bạn");
  });

  /* quà mừng */
  document.querySelectorAll(".tabs button").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll(".tabs button").forEach(function (x) {
        x.classList.remove("active");
      });
      document.querySelectorAll(".gift").forEach(function (x) {
        x.classList.remove("active");
      });
      b.classList.add("active");
      $("g-" + b.dataset.g).classList.add("active");
    });
  });
  document.querySelectorAll(".copy").forEach(function (b) {
    b.addEventListener("click", function () {
      navigator.clipboard
        .writeText(b.dataset.copy)
        .then(function () {
          toast("Đã sao chép số tài khoản");
        })
        .catch(function () {
          toast("Số tài khoản: " + b.dataset.copy);
        });
    });
  });
})();
