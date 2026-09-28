(function () {
  const $ = function (i) {
    return document.getElementById(i);
  };
  const params = new URLSearchParams(location.search);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* cá nhân hoá */
  let guest = params.get("to");
  if (guest) {
    guest = guest.replace(/[<>]/g, "").slice(0, 60);
    $("gateGuest").textContent = guest;
  }
  const side = (params.get("side") || "").toLowerCase();
  if (side === "trai") $("sideLabel").textContent = "Thiệp mời nhà trai";
  else if (side === "gai") $("sideLabel").textContent = "Thiệp mời nhà gái";

  /* mở thiệp — phong bì */
  const envelope = $("envelope"),
    gate = $("gate");
  $("openBtn").addEventListener("click", () => {
    envelope.classList.add("open");
    spawnPetals();
    setTimeout(() => {
      document.body.classList.add("opened");
      gate.classList.add("gone");
    }, 650);
  });

  setInterval(() => {
    if (document.body.classList.contains("opened")) {
      spawnPetals(5000);
    }
  }, 10000);
  /* hero slideshow */
  const frames = document.querySelectorAll("#heroMedia .frame");
  if (frames.length > 1 && !reduce) {
    let i = 0;
    setInterval(function () {
      frames[i].classList.remove("on");
      i = (i + 1) % frames.length;
      frames[i].classList.remove("on");
      void frames[i].offsetWidth;
      frames[i].classList.add("on");
    }, 7000);
  }

  /* đếm ngược — kiểu bảng lật */
  const target = new Date("2026-10-25T11:00:00+07:00").getTime();
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
    const d = Math.max(0, target - Date.now());
    setFlip($("cdD"), pad(Math.floor(d / 864e5)));
    setFlip($("cdH"), pad(Math.floor((d % 864e5) / 36e5)));
    setFlip($("cdM"), pad(Math.floor((d % 36e5) / 6e4)));
    setFlip($("cdS"), pad(Math.floor((d % 6e4) / 1e3)));
  }
  tick();
  setInterval(tick, 1000);

  /* hiện dần khi cuộn */
  if ("IntersectionObserver" in window) {
    const ob = new IntersectionObserver(
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
  const sticky = $("sticky"),
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
  const t = $("toast");
  let tt;
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
    const ics = [
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
    const u = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = u;
    a.download = "nam-linh-25-10-2026.ics";
    a.click();
    URL.revokeObjectURL(u);
    toast("Đã tải file lịch");
  });

  /* album lightbox */
  const imgs = [].slice.call(document.querySelectorAll("#hscrollTrack img"));
  const lb = $("lb"),
    lbImg = $("lbImg");
  let idx = 0;
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
    const section = $("hscrollSection"),
      track = $("hscrollTrack"),
      fill = $("hscrollFill");
    if (!section || !track) return;
    if (reduce) {
      return;
    }
    let raf = null;
    function render() {
      raf = null;
      const rect = section.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const progress =
        total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      const maxX = Math.max(
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
  const form = $("rsvpForm"),
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
    const nm = $("rName").value.trim();
    const go =
      document.querySelector('input[name="att"]:checked').value === "yes";
    const n = parseInt($("rCount").value || "0", 10);
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
    const el = document.createElement("div");
    el.className = "wish";
    const b = document.createElement("b");
    b.textContent = $("wName").value.trim();
    const p = document.createElement("p");
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

  //falling flower petal effect
  function spawnPetals(durationMs = 6000) {
    if (reduce) return;
    const colors = ["#7a1f26", "#a9424a", "#c9727a", "#e6b4b8", "#c9a227"];
    const container = document.createElement("div");
    container.className = "petals";
    container.setAttribute("aria-hidden", "true");
    document.body.appendChild(container);

    const total = 40;
    let spawned = 0;
    const spawner = setInterval(() => {
      if (spawned >= total) {
        clearInterval(spawner);
        return;
      }
      spawned++;
      const petal = document.createElement("span");
      petal.className = "petal";
      const size = 8 + Math.random() * 12;
      const dur = 5 + Math.random() * 4;
      const delay = Math.random() * 0.5;
      const left = Math.random() * 100;
      const dx1 = Math.round(Math.random() * 90 - 45) + "px";
      const dx2 = Math.round(Math.random() * 90 - 45) + "px";
      const spin = (Math.random() > 0.5 ? 1 : -1) * (280 + Math.random() * 260);
      petal.style.left = left + "vw";
      petal.style.width = size + "px";
      petal.style.height = size * 0.82 + "px";
      petal.style.background =
        colors[Math.floor(Math.random() * colors.length)];
      petal.style.animationDuration = dur + "s";
      petal.style.animationDelay = delay + "s";
      petal.style.setProperty("--dx1", dx1);
      petal.style.setProperty("--dx2", dx2);
      petal.style.setProperty("--spin", spin + "deg");
      petal.addEventListener("animationend", () => petal.remove());
      container.appendChild(petal);
    }, 110);

    setTimeout(() => clearInterval(spawner), durationMs);
    setTimeout(() => container.remove(), durationMs + 10000);
  }
  (function () {
    var storyData = [
      {
        year: "2021",
        title: "Gặp nhau",
        text: "Một chiều thu Hà Nội, quán cà phê nhỏ trên phố Nguyễn Hữu Huân, và một cuốn sách để quên.",
        img: "./assets/img/image2.jpg",
      },
      {
        year: "2023",
        title: "Cùng đi xa",
        text: "Chuyến Đà Lạt đầu tiên, chiếc xe máy cũ và một cơn mưa bất chợt. Từ hôm đó mọi kế hoạch đều có hai người.",
        img: "./assets/img/image3.jpg",
      },
      {
        year: "2024",
        title: "Lời cầu hôn",
        text: "Dưới ánh đèn thành phố, một câu hỏi giản dị và một cái gật đầu đầy nước mắt.",
        img: "./assets/img/image4.jpg",
      },
      {
        year: "2026",
        title: "Về chung một nhà",
        text: "Và rất mong có bạn ở đó, cùng chứng kiến khoảnh khắc này.",
        img: "./assets/img/image5.jpg",
      },
    ];

    var stage = $("storyStage");
    if (!stage) return;

    var flipper = $("storyFlipper");
    var faceFront = $("faceFront");
    var faceBack = $("faceBack");
    var current = 0;

    function fillFace(suffix, faceEl, item, idx) {
      var img = $("img" + suffix);
      img.src = item.img;
      img.alt = item.title;
      $("year" + suffix).textContent = item.year + " - " + item.title;
      $("text" + suffix).textContent = item.text;
      faceEl.classList.toggle("swapped", idx % 2 === 1);
    }
    fillFace("Front", faceFront, storyData[0], 0);
    fillFace("Back", faceBack, storyData[1], 1);

    var storyTimer;
    function triggerStory(manual) {
      if (flipper.classList.contains("flip")) return;
      var next = (current + 1) % storyData.length;
      fillFace("Back", faceBack, storyData[next], next);
      flipper.classList.add("flip");
      if (manual) {
        clearInterval(storyTimer);
        storyTimer = setInterval(function () {
          triggerStory(false);
        }, 5000);
      }
    }

    function finishStoryFlip() {
      var next = (current + 1) % storyData.length;
      fillFace("Front", faceFront, storyData[next], next);
      flipper.style.transition = "none";
      flipper.classList.remove("flip");
      void flipper.offsetHeight;
      flipper.style.transition = "";
      current = next;
      var upcoming = (current + 1) % storyData.length;
      fillFace("Back", faceBack, storyData[upcoming], upcoming);
    }

    if (!reduce) {
      flipper.addEventListener("transitionend", function (e) {
        if (e.propertyName !== "transform") return;
        finishStoryFlip();
      });
      stage.addEventListener("click", function () {
        triggerStory(true);
      });
      storyTimer = setInterval(function () {
        triggerStory(false);
      }, 5000);
    } else {
      flipper.style.transition = "none";
      stage.addEventListener("click", function () {
        current = (current + 1) % storyData.length;
        fillFace("Front", faceFront, storyData[current], current);
      });
      storyTimer = setInterval(function () {
        current = (current + 1) % storyData.length;
        fillFace("Front", faceFront, storyData[current], current);
      }, 5000);
    }
  })();
  /* album Cherished Moments — cuộn dọc thì dải ảnh chạy ngang */
  (function () {
    const scroller = $("albumScroll"),
      frame = $("albumFrame"),
      track = $("albumTrack");
    if (!scroller || !frame || !track) return;

    let raf = null;
    function render() {
      raf = null;
      const rect = scroller.getBoundingClientRect();
      const topOffset = parseFloat(getComputedStyle(frame).top) || 0;
      const total = rect.height - frame.offsetHeight;
      const progress =
        total > 0
          ? Math.min(1, Math.max(0, (topOffset - rect.top) / total))
          : 0;
      const maxX = Math.max(0, track.scrollWidth - frame.clientWidth);
      track.style.transform = "translate3d(" + -progress * maxX + "px,0,0)";
    }
    function onScroll() {
      if (raf === null) raf = requestAnimationFrame(render);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("load", onScroll);
    render();
  })();
})();
