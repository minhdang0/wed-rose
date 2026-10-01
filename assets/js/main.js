(function () {
  const $ = function (i) {
    return document.getElementById(i);
  };
  const params = new URLSearchParams(location.search);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* cá nhân hoá */
  let guest = params.get("to");
  if (guest && $("gateGuest")) {
    guest = guest.replace(/[<>]/g, "").slice(0, 60);
    $("gateGuest").textContent = guest;
  }
  const side = (params.get("side") || "").toLowerCase();
  const sideLabel = $("sideLabel");
  if (sideLabel) {
    if (side === "trai") sideLabel.textContent = "Thiệp mời nhà trai";
    else if (side === "gai") sideLabel.textContent = "Thiệp mời nhà gái";
  }

  /* mở thiệp — phong bì */
  const envelope = $ ("envelope"),
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

  /* our love story */
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

    var card = $("storyCard");
    var halves = [$("pivotImg"), $("pivotText")];
    var len = storyData.length;
    var current = 0;
    var busy = false;
    var timer;

    // preload để không nháy ảnh
    storyData.forEach(function (s) {
      var im = new Image();
      im.src = s.img;
    });

    function render(i) {
      var item = storyData[i];
      var img = $("storyImg");
      img.src = item.img;
      img.alt = item.title;
      $("storyYear").textContent = item.year + " - " + item.title;
      $("storyText").textContent = item.text;
      $("storyCount").textContent =
        String(i + 1).padStart(2, "0") + " / " + String(len).padStart(2, "0");
      card.classList.toggle("swapped", i % 2 === 1);
    }

    function pivot(from, to, ms, easing, dir) {
      return Promise.all(
        halves.map(function (el) {
          return el.animate(
            [
              { transform: "perspective(1200px) rotateX(" + from * dir + "deg)" },
              { transform: "perspective(1200px) rotateX(" + to * dir + "deg)" },
            ],
            { duration: ms, easing: easing, fill: "both" },
          ).finished;
        }),
      );
    }

    async function next(manual) {
      if (busy) return;
      busy = true;
      if (manual) startTimer();

      var n = (current + 1) % len;
      var dir = n % 2 === 1 ? 1 : -1;

      if (reduce) {
        render(n);
        current = n;
        busy = false;
        return;
      }

      await pivot(0, 90, 550, "cubic-bezier(0.5, 0, 0.9, 0.6)", dir);
      render(n);
      try { await $("storyImg").decode(); } catch (e) { }
      await pivot(-90, 0, 650, "cubic-bezier(0.1, 0.4, 0.3, 1)", dir);
      current = n;
      busy = false;
    }

    function startTimer() {
      clearInterval(timer);
      timer = setInterval(function () { next(false); }, 5000);
    }

    render(0);
    stage.addEventListener("click", function () { next(true); });
    startTimer();
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
