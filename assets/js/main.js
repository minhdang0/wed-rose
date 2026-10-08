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
  const envelope = $("envelope"),
    gate = $("gate");
  const music = $("weddingMusic");
  const musicToggle = $("musicToggle");

  function updateMusicButton() {
    const isPlaying = !music.paused;
    musicToggle.classList.toggle("is-playing", isPlaying);
    musicToggle.setAttribute("aria-pressed", String(isPlaying));
    musicToggle.setAttribute("aria-label", isPlaying ? "Tắt nhạc" : "Bật nhạc");
    musicToggle.title = isPlaying ? "Tắt nhạc" : "Bật nhạc";
  }

  function playMusic() {
    music.play().catch(function (error) {
      console.error("Không thể phát nhạc thiệp cưới:", error);
      updateMusicButton();
    });
  }

  music.addEventListener("play", updateMusicButton);
  music.addEventListener("pause", updateMusicButton);
  music.addEventListener("error", function () {
    console.error("Không thể tải tệp nhạc thiệp cưới:", music.error);
    updateMusicButton();
  });

  musicToggle.addEventListener("click", function () {
    if (music.paused) playMusic();
    else music.pause();
  });

  $("openBtn").addEventListener("click", () => {
    envelope.classList.add("open");
    playMusic();
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
    let scrollerTop = 0;
    let total = 0;
    let topOffset = 0;
    let maxX = 0;

    function measure() {
      const rect = scroller.getBoundingClientRect();
      scrollerTop = rect.top + window.scrollY;
      total = rect.height - frame.offsetHeight;
      topOffset = parseFloat(getComputedStyle(frame).top) || 0;
      maxX = Math.max(0, track.scrollWidth - frame.clientWidth);
    }

    function render() {
      raf = null;
      const rectTop = scrollerTop - window.scrollY;
      const progress =
        total > 0
          ? Math.min(1, Math.max(0, (topOffset - rectTop) / total))
          : 0;
      track.style.transform = "translate3d(" + -progress * maxX + "px,0,0)";
    }

    function onScroll() {
      if (raf === null) raf = requestAnimationFrame(render);
    }

    function onGeometryChange() {
      measure();
      onScroll();
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onGeometryChange);
    window.addEventListener("load", onGeometryChange);
    measure();
    render();
  })();

  (function () {
    var units = {
      days: $("cdDays"),
      hours: $("cdHours"),
      minutes: $("cdMinutes"),
      seconds: $("cdSeconds"),
    };
    var ok = Object.keys(units).every(function (k) { return units[k]; });
    if (!ok) return;

    // Đổi ngày giờ ở đây (+07:00 = giờ Việt Nam)
    var target = new Date("2026-10-25T09:00:00+07:00").getTime();
    var DURATION = 450;
    var EASING = "cubic-bezier(0.7, 0, 0.3, 1)";

    function pad(n) {
      return String(n).padStart(2, "0");
    }

    // đặt 1 chữ số, có hiệu ứng cuộn khi đổi
    function setDigit(box, ch) {
      var items = box.querySelectorAll(".d");
      var cur = items[items.length - 1];

      if (!cur) {
        box.innerHTML = '<span class="d">' + ch + "</span>";
        return;
      }
      if (cur.textContent === ch) return;

      if (reduce || !cur.animate) {
        cur.textContent = ch;
        return;
      }

      var nu = document.createElement("span");
      nu.className = "d";
      nu.textContent = ch;
      box.appendChild(nu);

      var opt = { duration: DURATION, easing: EASING, fill: "forwards" };
      cur.animate(
        [
          { transform: "translateY(0)", opacity: 1 },
          { transform: "translateY(-100%)", opacity: 0 },
        ],
        opt
      ).onfinish = function () {
        cur.remove();
      };
      nu.animate(
        [
          { transform: "translateY(100%)", opacity: 0 },
          { transform: "translateY(0)", opacity: 1 },
        ],
        opt
      );
    }
  
    // đặt cả số (tự thêm khung chữ số nếu số dài ra, ví dụ ngày > 99)
    function setNumber(el, str) {
      var boxes = el.querySelectorAll(".digit");
      while (boxes.length < str.length) {
        var b = document.createElement("span");
        b.className = "digit";
        el.appendChild(b);
        boxes = el.querySelectorAll(".digit");
      }
      for (var i = 0; i < boxes.length; i++) {
        setDigit(boxes[i], str.charAt(i) || "");
      }
    }

    // xóa chữ "00" mặc định trong HTML để dựng khung chữ số
    Object.keys(units).forEach(function (k) {
      units[k].textContent = "";
    });

    function tick() {
      var total = Math.floor(Math.max(0, target - Date.now()) / 1000);
      setNumber(units.days, pad(Math.floor(total / 86400)));
      setNumber(units.hours, pad(Math.floor((total % 86400) / 3600)));
      setNumber(units.minutes, pad(Math.floor((total % 3600) / 60)));
      setNumber(units.seconds, pad(total % 60));
    }

    tick();
    setInterval(tick, 1000);
  })();

  (function () {
  var WEDDING_DATE = "2026-10-25"; // năm-tháng-ngày
 
  var cal = $("wedCal");
  if (!cal) return;
 
  var p = WEDDING_DATE.split("-");
  var year = +p[0], month = +p[1], day = +p[2];

  var monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  $("calMonth").textContent = monthNames[month - 1];
  $("calYear").innerHTML = "<span>" + String(year).slice(0, 2) + "</span><span>" + String(year).slice(2) + "</span>";

  // Calendar columns run Sunday through Saturday, matching getDay().
  var offset = new Date(year, month - 1, 1).getDay();
  var total = new Date(year, month, 0).getDate();
 
  var html = "";
  for (var i = 0; i < offset; i++) html += '<span class="cal-day"></span>';
  for (var d = 1; d <= total; d++) {
    var date = new Date(year, month - 1, d);
    var weekday = date.toLocaleDateString("en-US", { weekday: "long" });
    var classes = "cal-day";
    if (date.getDay() === 0) classes += " is-sunday";
    if (d === day) classes += " is-wed";
    html += '<span class="' + classes + '"' +
      (d === day ? ' aria-label="' + weekday + ", " + monthNames[month - 1] + " " + d + ", " + year + '"' : "") +
      ">" + d + "</span>";
  }
  cal.querySelector(".cal-days").innerHTML = html;
})();

    (function () {
      var map = $("weddingMap");
      if (!map) return;

      var locations = [
        {
          label: "Chú rể",
          address: "Số 96 Nguyễn Vân Bình, Yên Bắc, Duy Tiên, Hà Nam",
        },
        {
          label: "Cô dâu",
          address: "Số 96 Nguyễn Vân Bình, Yên Bắc, Duy Tiên, Hà Nam",
        },
      ];
      var frame = $("weddingMapFrame");
      var address = $("weddingMapAddress");
      var link = $("weddingMapLink");
      var tabs = map.querySelectorAll(".map-tab");

      function showLocation(index) {
        var location = locations[index];
        var query = encodeURIComponent(location.address);
        frame.src = "https://www.google.com/maps?q=" + query + "&output=embed";
        frame.title = "Bản đồ địa điểm - " + location.label;
        address.textContent = location.address;
        link.href = "https://www.google.com/maps/search/?api=1&query=" + query;

        tabs.forEach(function (tab, tabIndex) {
          var selected = tabIndex === index;
          tab.classList.toggle("active", selected);
          tab.setAttribute("aria-selected", selected ? "true" : "false");
        });
      }

      tabs.forEach(function (tab, index) {
        tab.addEventListener("click", function () {
          showLocation(index);
        });
      });
      showLocation(0);
    })();

    (function () {
      var form = $("wishForm");
      if (!form) return;

      var GOOGLE_SHEETS_ENDPOINT = "";
      var status = $("wishStatus");
      var submit = $("wishSubmit");

      form.addEventListener("submit", async function (event) {
        event.preventDefault();
        status.textContent = "";

        if (!GOOGLE_SHEETS_ENDPOINT) {
          status.textContent = "Chưa cấu hình địa chỉ Google Sheets để nhận lời chúc.";
          return;
        }

        submit.disabled = true;
        status.textContent = "Đang gửi lời chúc...";

        var payload = {
          name: $("wishName").value.trim(),
          message: $("wishMessage").value.trim(),
          submittedAt: new Date().toISOString(),
        };

        try {
          var response = await fetch(GOOGLE_SHEETS_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload),
          });
          if (!response.ok) {
            throw new Error("Google Sheets trả về mã lỗi " + response.status + ".");
          }

          var result = await response.json();
          if (!result || result.success !== true) {
            throw new Error("Google Sheets không xác nhận đã lưu lời chúc.");
          }

          status.textContent = "Cảm ơn bạn, lời chúc đã được gửi!";
          form.reset();
        } catch (error) {
          console.error("Không thể lưu lời chúc vào Google Sheets:", error);
          status.textContent = "Gửi lời chúc chưa thành công. Vui lòng thử lại sau.";
        } finally {
          submit.disabled = false;
        }
      });
    })();

})();
