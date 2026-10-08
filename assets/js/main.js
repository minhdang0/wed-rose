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
              {
                transform: "perspective(1200px) rotateX(" + from * dir + "deg)",
              },
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
      try {
        await $("storyImg").decode();
      } catch (e) {}
      await pivot(-90, 0, 650, "cubic-bezier(0.1, 0.4, 0.3, 1)", dir);
      current = n;
      busy = false;
    }

    function startTimer() {
      clearInterval(timer);
      timer = setInterval(function () {
        next(false);
      }, 5000);
    }

    render(0);
    stage.addEventListener("click", function () {
      next(true);
    });
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
        total > 0 ? Math.min(1, Math.max(0, (topOffset - rectTop) / total)) : 0;
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
})();
