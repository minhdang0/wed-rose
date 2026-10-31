(async function () {
  let weddingData;
  try {
    const response = await fetch("./assets/data/wedding.json");
    if (!response.ok) {
      throw new Error("Máy chủ trả về mã lỗi " + response.status + ".");
    }
    weddingData = await response.json();
  } catch (error) {
    console.error(
      "Không thể tải dữ liệu thiệp cưới từ assets/data/wedding.json:",
      error,
    );
    return;
  }

  if (
    !weddingData ||
    !weddingData.event ||
    !weddingData.couple ||
    !Array.isArray(weddingData.story) ||
    !weddingData.story.length ||
    !Array.isArray(weddingData.event.schedule) ||
    !Array.isArray(weddingData.locations) ||
    !weddingData.locations.length
  ) {
    console.error("Thiếu dữ liệu bắt buộc trong assets/data/wedding.json.");
    return;
  }

  const eventDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(weddingData.event.date);
  const countdownTime = /^(\d{2}):(\d{2})$/.exec(
    weddingData.event.countdownTime,
  );
  if (!eventDate || !countdownTime) {
    console.error(
      "Ngày cưới hoặc giờ đếm ngược trong wedding.json không hợp lệ.",
    );
    return;
  }

  const year = eventDate[1];
  const month = Number(eventDate[2]);
  const day = Number(eventDate[3]);
  const hours = Number(countdownTime[1]);
  const minutes = Number(countdownTime[2]);
  const calendarDate = new Date(Date.UTC(Number(year), month - 1, day));
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    calendarDate.getUTCFullYear() !== Number(year) ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day ||
    hours > 23 ||
    minutes > 59
  ) {
    console.error(
      "Ngày cưới hoặc giờ đếm ngược trong wedding.json không hợp lệ.",
    );
    return;
  }

  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];
  weddingData.couple.dateDisplay =
    String(day).padStart(2, "0") +
    " · " +
    String(month).padStart(2, "0") +
    " · " +
    year;
  weddingData.couple.dateCompact =
    String(day).padStart(2, "0") +
    "." +
    String(month).padStart(2, "0") +
    "." +
    year;
  weddingData.event.dateHuman = day + " tháng " + month + ", " + year;
  weddingData.couple.yearRange =
    weddingData.story[0].year +
    " - " +
    weddingData.story[weddingData.story.length - 1].year;
  weddingData.event.day = String(day);
  weddingData.event.month = monthNames[month - 1];
  weddingData.event.year = year;
  weddingData.event.weekday = new Date(
    weddingData.event.date + "T12:00:00+07:00",
  )
    .toLocaleDateString("vi-VN", {
      weekday: "long",
      timeZone: "Asia/Ho_Chi_Minh",
    })
    .replace(/^./, function (letter) {
      return letter.toUpperCase();
    });
  weddingData.event.dateTime =
    weddingData.event.date +
    "T" +
    countdownTime[1] +
    ":" +
    countdownTime[2] +
    ":00+07:00";

  const templateValues = {
    groom: weddingData.couple.groom,
    bride: weddingData.couple.bride,
    dateCompact: weddingData.couple.dateCompact,
    dateHuman: weddingData.event.dateHuman,
    venue: weddingData.event.venue,
    city: weddingData.event.city,
  };
  function renderTemplate(template) {
    return template.replace(/\{(\w+)\}/g, function (match, name) {
      return Object.prototype.hasOwnProperty.call(templateValues, name)
        ? templateValues[name]
        : match;
    });
  }
  weddingData.site.title = renderTemplate(weddingData.site.titleTemplate);
  weddingData.site.description = renderTemplate(
    weddingData.site.descriptionTemplate,
  );

  function getWeddingValue(path) {
    return path.split(".").reduce(function (value, key) {
      return value == null ? undefined : value[key];
    }, weddingData);
  }

  document.querySelectorAll("[data-wedding]").forEach(function (element) {
    const value = getWeddingValue(element.getAttribute("data-wedding"));
    if (typeof value === "string" || typeof value === "number") {
      element.textContent = value;
    } else {
      console.error(
        "Không tìm thấy dữ liệu thiệp cưới:",
        element.getAttribute("data-wedding"),
      );
    }
  });

  document
    .querySelectorAll("[data-wedding-content]")
    .forEach(function (element) {
      const value = getWeddingValue(
        element.getAttribute("data-wedding-content"),
      );
      if (typeof value === "string") element.setAttribute("content", value);
      else
        console.error(
          "Không tìm thấy dữ liệu thiệp cưới:",
          element.getAttribute("data-wedding-content"),
        );
    });

  document.querySelectorAll("[data-wedding-src]").forEach(function (element) {
    const value = getWeddingValue(element.getAttribute("data-wedding-src"));
    if (typeof value === "string" && value) element.setAttribute("src", value);
    else
      console.error(
        "Đường dẫn ảnh/âm thanh không hợp lệ:",
        element.getAttribute("data-wedding-src"),
      );
  });

  document.querySelectorAll("[data-wedding-lines]").forEach(function (element) {
    const values = getWeddingValue(element.getAttribute("data-wedding-lines"));
    const lines = element.querySelectorAll("span");
    if (!Array.isArray(values) || values.length !== lines.length) {
      console.error(
        "Dữ liệu các dòng không khớp:",
        element.getAttribute("data-wedding-lines"),
      );
      return;
    }
    lines.forEach(function (line, index) {
      line.textContent = values[index];
    });
  });

  document
    .querySelectorAll("[data-wedding-schedule]")
    .forEach(function (element) {
      const schedule =
        weddingData.event.schedule[
        Number(element.getAttribute("data-wedding-schedule"))
        ];
      const label = element.querySelector("h3");
      const time = element.querySelector("p");
      if (!schedule || !label || !time) {
        console.error("Dữ liệu lịch tiệc không khớp với cấu trúc HTML.");
        return;
      }
      label.textContent = schedule.label;
      time.textContent = schedule.time;
    });

  document.querySelectorAll(".map-tab").forEach(function (tab, index) {
    const location = weddingData.locations[index];
    if (location) tab.textContent = location.label;
  });

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

  function openInvitation() {
    if (envelope.classList.contains("open")) return;
    envelope.classList.add("open");
    playMusic();
    spawnPetals();
    setTimeout(() => {
      document.body.classList.add("opened");
      gate.classList.add("gone");
    }, 2400);
  }

  envelope.addEventListener("click", openInvitation);
  envelope.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openInvitation();
    }
  });

  setInterval(() => {
    if (document.body.classList.contains("opened") && !document.hidden) {
      spawnPetals(3000);
    }
  }, 25000);

  /* hero slideshow */
  const heroEl = document.querySelector(".hero");
  const frames = Array.from(document.querySelectorAll("#heroMedia .frame"));
  if (heroEl && frames.length > 1 && !reduce) {
    let i = 0;
    let heroVisible = true;

    new IntersectionObserver(function (es) {
      heroVisible = es[0].isIntersecting;
      heroEl.classList.toggle("is-offscreen", !heroVisible);
    }).observe(heroEl);

    // giải mã sẵn ảnh nền để lúc chuyển không bị khựng
    frames.forEach(function (f) {
      const m = /url\(["']?(.*?)["']?\)/.exec(getComputedStyle(f).backgroundImage);
      if (!m) return;
      const im = new Image();
      im.src = m[1];
      if (im.decode) im.decode().catch(function () {});
    });

    setInterval(function () {
      if (!heroVisible || document.hidden || !document.body.classList.contains("opened")) return;

      const prev = frames[i];
      i = (i + 1) % frames.length;
      const next = frames[i];

      prev.classList.remove("on");
      prev.classList.add("leaving");
      next.classList.remove("leaving");
      void next.offsetWidth;
      next.classList.add("on");

      setTimeout(function () {
        prev.classList.remove("leaving");
      }, 1500);
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

    const total = window.matchMedia("(max-width: 720px)").matches ? 14 : 30;
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
  /* our love story — mosaic + tráng phim */
  (function () {
    var storyData = weddingData.story.map(function (story) {
      return {
        year: story.year,
        title: story.title,
        text: story.text,
        img: story.image,
      };
    });

    var stage = $("storyStage");
    if (!stage) return;

    var imgHalf = $("pivotImg");
    var textHalf = $("pivotText");
    var img = $("storyImg");
    var yearEl = $("storyYear");
    var textEl = $("storyText");
    var countEl = $("storyCount");

    var len = storyData.length;
    var current = 0;
    var busy = false;
    var visible = false;
    var autoTween = null;

    var AUTO = 5; // giây giữa hai chương
    var COLS = 5;
    var ROWS = 3;
    var GRID = [ROWS, COLS];

    // preload để không nháy ảnh
    storyData.forEach(function (s) {
      var im = new Image();
      im.src = s.img;
    });

    /* ---- lớp ô mosaic phủ lên ảnh ---- */
    var tilesWrap = document.createElement("div");
    tilesWrap.className = "story-tiles";
    for (var t = 0; t < COLS * ROWS; t++) {
      tilesWrap.appendChild(document.createElement("i"));
    }
    imgHalf.appendChild(tilesWrap);
    var tiles = Array.prototype.slice.call(tilesWrap.children);

    /* ---- thanh báo giờ tự chuyển ---- */
    var bar = document.createElement("div");
    bar.className = "story-bar";
    bar.innerHTML = "<i></i>";
    textHalf.appendChild(bar);
    var barFill = bar.firstChild;

    /* ---- trợ năng ---- */
    stage.setAttribute("tabindex", "0");
    stage.setAttribute("role", "button");
    stage.setAttribute("aria-label", "Chạm để xem chương tiếp theo");

    function render(i) {
      var item = storyData[i];
      img.src = item.img;
      img.alt = item.title;
      yearEl.textContent = item.year + " - " + item.title;
      textEl.textContent = item.text;
      countEl.textContent =
        String(i + 1).padStart(2, "0") + " / " + String(len).padStart(2, "0");
    }

    // gsap tween -> Promise
    function tw(targets, vars) {
      return new Promise(function (resolve) {
        gsap.to(targets, Object.assign({}, vars, { onComplete: resolve }));
      });
    }

    function killAuto() {
      if (autoTween) autoTween.kill();
      autoTween = null;
      gsap.set(barFill, { scaleX: 0 });
    }

    function startAuto() {
      killAuto();
      if (!visible || busy) return;
      autoTween = gsap.to(barFill, {
        scaleX: 1,
        duration: AUTO,
        ease: "none",
        onComplete: function () {
          go(1);
        },
      });
    }

    async function go(dir) {
      if (busy) return;
      busy = true;
      killAuto();

      var n = (current + dir + len) % len;

      if (reduce) {
        render(n);
        current = n;
        busy = false;
        startAuto();
        return;
      }

      // 1) chữ cũ mờ đi, các ô olive nở ra từ giữa
      gsap.to([yearEl, textEl], { opacity: 0, y: -10, duration: 0.35, ease: "power1.in" });
      await tw(tiles, {
        scale: 1.04, // >1 để không hở khe giữa các ô
        duration: 0.45,
        ease: "power2.in",
        stagger: { grid: GRID, from: "center", amount: 0.5 },
      });

      // 2) đổi nội dung khi ảnh đã bị che hoàn toàn
      render(n);
      current = n;
      try {
        await img.decode();
      } catch (e) { }

      gsap.set(img, {
        filter: "sepia(1) brightness(1.45) saturate(0.4) blur(6px)",
        scale: 1.12,
      });

      // 3) ảnh mới "tráng phim" từ mờ ngả vàng sang nét
      gsap.to(img, {
        filter: "sepia(0) brightness(1) saturate(1) blur(0px)",
        scale: 1,
        duration: 1.9,
        ease: "power2.out",
        clearProps: "filter,transform",
      });

      // 4) chữ được viết ra
      gsap.fromTo(
        yearEl,
        { clipPath: "inset(-20% 100% -20% -5%)", opacity: 1, y: 0 },
        {
          clipPath: "inset(-20% -5% -20% -5%)",
          duration: 1.1,
          ease: "power2.inOut",
          clearProps: "clipPath",
        },
      );
      gsap.fromTo(
        textEl,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.9, delay: 0.5, ease: "power2.out" },
      );

      // 5) các ô co dần từ mép vào, lộ ảnh mới
      await tw(tiles, {
        scale: 0,
        duration: 0.55,
        ease: "power2.out",
        stagger: { grid: GRID, from: "edges", amount: 0.5 },
      });

      busy = false;
      startAuto();
    }

    /* ---- chạm / vuốt ---- */
    var startX = null;
    stage.addEventListener("pointerdown", function (e) {
      startX = e.clientX;
    });
    stage.addEventListener("pointerup", function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      else go(1);
    });
    stage.addEventListener("pointercancel", function () {
      startX = null;
    });
    stage.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      }
    });

    /* ---- chỉ tự chạy khi khung đang trong màn hình ---- */
    new IntersectionObserver(
      function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) startAuto();
        else killAuto();
      },
      { threshold: 0.4 },
    ).observe(stage);

    render(0);
  })();

  (function () {
    var units = {
      days: $("cdDays"),
      hours: $("cdHours"),
      minutes: $("cdMinutes"),
      seconds: $("cdSeconds"),
    };
    var ok = Object.keys(units).every(function (k) {
      return units[k];
    });
    if (!ok) return;

    // Đổi ngày giờ ở đây (+07:00 = giờ Việt Nam)
    var target = new Date(weddingData.event.dateTime).getTime();
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
        opt,
      ).onfinish = function () {
        cur.remove();
      };
      nu.animate(
        [
          { transform: "translateY(100%)", opacity: 0 },
          { transform: "translateY(0)", opacity: 1 },
        ],
        opt,
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
    var WEDDING_DATE = weddingData.event.date; // năm-tháng-ngày

    var cal = $("wedCal");
    if (!cal) return;

    var p = WEDDING_DATE.split("-");
    var year = +p[0],
      month = +p[1],
      day = +p[2];

    var monthNames = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];
    $("calMonth").textContent = monthNames[month - 1];
    $("calYear").innerHTML =
      "<span>" +
      String(year).slice(0, 2) +
      "</span><span>" +
      String(year).slice(2) +
      "</span>";

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
      html +=
        '<span class="' +
        classes +
        '"' +
        (d === day
          ? ' aria-label="' +
          weekday +
          ", " +
          monthNames[month - 1] +
          " " +
          d +
          ", " +
          year +
          '"'
          : "") +
        ">" +
        d +
        "</span>";
    }
    cal.querySelector(".cal-days").innerHTML = html;
  })();

  (function () {
    var map = $("weddingMap");
    if (!map) return;

    var locations = weddingData.locations;
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
        status.textContent =
          "Chưa cấu hình địa chỉ Google Sheets để nhận lời chúc.";
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
          throw new Error(
            "Google Sheets trả về mã lỗi " + response.status + ".",
          );
        }

        var result = await response.json();
        if (!result || result.success !== true) {
          throw new Error("Google Sheets không xác nhận đã lưu lời chúc.");
        }

        status.textContent = "Cảm ơn bạn, lời chúc đã được gửi!";
        form.reset();
      } catch (error) {
        console.error("Không thể lưu lời chúc vào Google Sheets:", error);
        status.textContent =
          "Gửi lời chúc chưa thành công. Vui lòng thử lại sau.";
      } finally {
        submit.disabled = false;
      }
    });
  })();

  (function () {
    var scroller = $("albumScroll");
    if (!scroller || typeof gsap === "undefined" || reduce) return;

    var track = scroller.querySelector("#albumTrack");
    var cards = gsap.utils.toArray("#albumScroll .first-card .card-wrap");
    var sliders = gsap.utils.toArray("#albumScroll .design-first .slider");
    var titleSpan = scroller.querySelector(".design-text span");

    var sweeps = cards.map(function (card) {
      var s = document.createElement("div");
      s.className = "shine-sweep";
      card.appendChild(s);
      gsap.set(s, { xPercent: -160 });
      return s;
    });

    gsap.set(track, { autoAlpha: 0 });

    var shineTl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 2.5 });
    cards.forEach(function (card, i) {
      shineTl.fromTo(
        sweeps[i],
        { xPercent: -160 },
        { xPercent: 260, duration: 6, ease: "power2.inOut", force3D: true },
        i * 1.1
      );
    });

    var sliderTl = gsap.timeline({ paused: true, repeat: -1, yoyo: true });
    sliderTl.to(sliders, {
      opacity: 0.35,
      duration: 1.2,
      ease: "sine.inOut",
      stagger: { each: 0.2 },
    });

    var glowTl = null;
    if (titleSpan) {
      glowTl = gsap.to(titleSpan, {
        textShadow: "0 0 18px rgba(255, 246, 214, 0.95), 0 0 36px rgba(201, 162, 39, 0.6)",
        duration: 1.6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        paused: true,
      });
    }

    var entered = false;
    new IntersectionObserver(
      function (entries) {
        var on = entries[0].isIntersecting;
        if (on && !entered) {
          entered = true;
          gsap.to(track, {
            autoAlpha: 1,
            duration: 1.3,
            ease: "power2.out",
            onComplete: function () {
              shineTl.play(0);
              sliderTl.play(0);
              if (glowTl) glowTl.play(0);
            },
          });
          return;
        }
        if (!entered) return;
        if (on) {
          shineTl.play();
          sliderTl.play();
          if (glowTl) glowTl.play();
        } else {
          shineTl.pause();
          sliderTl.pause();
          if (glowTl) glowTl.pause();
        }
      },
      { threshold: 0.25 }
    ).observe(scroller);
  })();

  (function () {
    var p2 = document.querySelector("#albumScroll .p2");
    if (!p2 || typeof gsap === "undefined" || !window.SplitText || reduce) return;
    gsap.registerPlugin(SplitText);

    var words = gsap.utils.toArray(p2.querySelectorAll("span"));
    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();

    fontsReady.then(function () {
      var split = SplitText.create(words, { type: "chars", charsClass: "p2-char" });
      var chars = split.chars;

      var wave = gsap.to(chars, {
        y: -10,
        duration: 2.1,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: { each: 0.08, repeat: -1, yoyo: true },
        paused: true,
      });

      var glow = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 1.2 });
      glow.to(chars, {
        textShadow: "0 0 14px rgba(255, 246, 214, 0.95), 0 0 28px rgba(201, 162, 39, 0.6)",
        duration: 1,
        ease: "sine.out",
        yoyo: true,
        repeat: 1,
        stagger: 0.12,
      });
      wave.play();
      glow.play();

    });
  })();
  (function () {
  const card = document.querySelector(".first-card");
  const track = document.getElementById("albumTrack");
  if (!card || !track) return;

  const OUT = 8;        
  const RADIUS = 25 + OUT;
  const STROKE = 6;
  const PAD_X = 8;       
  const PAD_Y = 10;     

  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.style.cssText =
    "position:absolute;pointer-events:none;z-index:5;overflow:visible;";
  svg.innerHTML =
    '<defs><mask id="cardBorderMask" maskUnits="userSpaceOnUse"><g id="cbHoles"></g></mask></defs>' +
    '<rect id="cbRect" fill="none" mask="url(#cardBorderMask)" style="stroke:var(--olive)"></rect>';
  track.appendChild(svg);

  const maskEl = svg.querySelector("mask");
  const holesG = svg.querySelector("#cbHoles");
  const rectEl = svg.querySelector("#cbRect");

  function update() {
    const W = card.offsetWidth + OUT * 2;
    const H = card.offsetHeight + OUT * 2;
    const left = card.offsetLeft - OUT;
    const top = card.offsetTop - OUT;

    svg.style.left = left + "px";
    svg.style.top = top + "px";
    svg.setAttribute("width", W);
    svg.setAttribute("height", H);

    maskEl.setAttribute("x", -20);
    maskEl.setAttribute("y", -20);
    maskEl.setAttribute("width", W + 40);
    maskEl.setAttribute("height", H + 40);

    rectEl.setAttribute("x", STROKE / 2);
    rectEl.setAttribute("y", STROKE / 2);
    rectEl.setAttribute("width", W - STROKE);
    rectEl.setAttribute("height", H - STROKE);
    rectEl.setAttribute("rx", RADIUS);
    rectEl.setAttribute("stroke-width", STROKE);

    const sr = svg.getBoundingClientRect(); // gốc toạ độ của svg trên màn hình
    const boxes = [];

    // các phần tử xoay (p1, p3), khối slider, design-block: lấy bounding rect
    track.querySelectorAll(".design-text:not(.p2), .design-first, .design-last, .design-block")
      .forEach((el) => {
        const r = el.getBoundingClientRect();
        boxes.push({ x: r.left - sr.left, y: r.top - sr.top, w: r.width, h: r.height });
      });

    // dòng chữ p2: dùng kích thước layout gốc, không bị GSAP transform làm lệch
    const p2 = track.querySelector(".p2");
    if (p2) {
      boxes.push({
        x: p2.offsetLeft - left,
        y: p2.offsetTop - top,
        w: p2.offsetWidth,
        h: p2.offsetHeight,
      });
    }

    let html = `<rect x="-20" y="-20" width="${W + 40}" height="${H + 40}" fill="white"/>`;
    boxes.forEach((b) => {
      html += `<rect x="${b.x - PAD_X}" y="${b.y - PAD_Y}" width="${b.w + PAD_X * 2}" height="${b.h + PAD_Y * 2}" fill="black"/>`;
    });
    holesG.innerHTML = html;
  }

  window.updateCardBorder = update;
  update();
  window.addEventListener("load", update);
  window.addEventListener("resize", update);
  if (document.fonts) document.fonts.ready.then(update);
  if (window.ScrollTrigger) ScrollTrigger.addEventListener("refresh", update);
  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver(update);
    ro.observe(card);
    ro.observe(track);
  }
})();

(function () {
  const scroller = document.getElementById("albumScroll");
  const wraps = gsap.utils.toArray(".first-card .card-wrap");
  if (!scroller || !wraps.length || !window.gsap) return;

  const dirs = [[-5, -3], [5, 3], [-3, 5], [4, -5], [-5, 3]];

  const drifts = wraps.map(function (w, i) {
    const img = w.querySelector("img");
    const d = dirs[i % dirs.length];
    gsap.set(img, { scale: 1.15 });
    return gsap.to(img, {
      xPercent: d[0],
      yPercent: d[1],
      scale: 1.32,
      duration: 6 + (i % 4) * 1.3,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      paused: true,
    });
  });

  new IntersectionObserver(function (es) {
    drifts.forEach(function (t) {
      es[0].isIntersecting ? t.play() : t.pause();
    });
  }, { threshold: 0.2 }).observe(scroller);

  if (matchMedia("(hover: hover)").matches) {
    const design = gsap.utils.toArray(
      "#albumScroll .design-text, #albumScroll .design-first, #albumScroll .design-last, #albumScroll .design-block"
    );

    wraps.forEach(function (w) {
      const img = w.querySelector("img");

      w.addEventListener("mouseenter", function () {
        drifts[wraps.indexOf(w)].pause();
        gsap.to(img, { scale: 1.4, duration: 0.6, ease: "power2.out", overwrite: "auto" });
        gsap.to(
          wraps.filter(function (o) { return o !== w; }).concat(design),
          { filter: "brightness(0.6)", duration: 0.45, overwrite: "auto" }
        );
      });

      w.addEventListener("mouseleave", function () {
        const drift = drifts[wraps.indexOf(w)];
        gsap.to(img, {
          scale: 1.2,
          duration: 0.6,
          ease: "power2.out",
          overwrite: "auto",
          onComplete: function () {
            if (!w.matches(":hover")) drift.play();
          },
        });
        gsap.to(wraps.concat(design), { filter: "brightness(1)", duration: 0.45, overwrite: "auto" });
      });
    });
  }
})();
})();
