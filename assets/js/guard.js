/*!
 * guard.js - chặn thao tác kiểm tra trang (dùng chung cho mọi thiệp)
 * Nạp TRƯỚC mọi script khác:  <script src="assets/js/guard.js"></script>
 */
(function () {
  "use strict";

  var CFG = {
    enabled: true,
    allowHosts: ["localhost", "127.0.0.1"],
    blockContextMenu: true,
    blockSelectCopy: false,
    blockDrag: true, // kéo ảnh
    checkInterval: 500, // ms giữa hai lần kiểm tra devtools
    useDebuggerTrap: true, // bẫy bằng "debugger" (chính xác nhất, nhưng làm DevTools bị dừng liên tục)
    sizeThreshold: 160, // lệch kích thước cửa sổ (px) coi là devtools đang dock
    title: "Đã xảy ra lỗi",
    message:
      "Không thể hiển thị trang này. Vui lòng đóng công cụ dành cho nhà phát triển để tiếp tục.",
  };

  if (!CFG.enabled) return;
  if (CFG.allowHosts.indexOf(location.hostname) !== -1) return;

  var locked = false;
  var blockedWhileLocked = false;
  var overlay = null;

  /* ================= 1. PHÍM TẮT ================= */
  function isBlockedKey(e) {
    var k = (e.key || "").toLowerCase();
    var ctrl = e.ctrlKey || e.metaKey;

    if (e.keyCode === 123 || k === "f12") return true; // F12
    if (ctrl && e.shiftKey && ["i", "j", "c", "k", "e"].indexOf(k) !== -1)
      return true; // Ctrl+Shift+I/J/C/K/E
    if (e.metaKey && e.altKey && ["i", "j", "c", "u"].indexOf(k) !== -1)
      return true; // Cmd+Opt+I/J/C/U
    if (ctrl && ["s", "u", "p"].indexOf(k) !== -1) return true; // Ctrl+S, Ctrl+U, Ctrl+P
    if (CFG.blockSelectCopy && ctrl && ["a", "c", "x"].indexOf(k) !== -1)
      return true;
    return false;
  }

  function stop(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    return false;
  }

  window.addEventListener(
    "keydown",
    function (e) {
      if (isBlockedKey(e)) return stop(e);
    },
    true,
  );
  window.addEventListener(
    "keyup",
    function (e) {
      if (isBlockedKey(e)) return stop(e);
    },
    true,
  );

  if (CFG.blockContextMenu) window.addEventListener("contextmenu", stop, true);
  if (CFG.blockDrag) window.addEventListener("dragstart", stop, true);
  if (CFG.blockSelectCopy) {
    ["selectstart", "copy", "cut"].forEach(function (t) {
      window.addEventListener(t, stop, true);
    });
  }

  /* ================= 2. MÀN CHỜ LỖI ================= */
  var STYLE_ID = "__g_style";
  var OVERLAY_ID = "__g_lock";

  function buildOverlay() {
    if (!document.getElementById(STYLE_ID)) {
      var st = document.createElement("style");
      st.id = STYLE_ID;
      st.textContent =
        "html.__g_on body>*:not(#" +
        OVERLAY_ID +
        "){display:none!important}" +
        "html.__g_on,html.__g_on body{overflow:hidden!important;background:#111!important}" +
        "#" +
        OVERLAY_ID +
        "{position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;" +
        "align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center;" +
        "background:#111;color:#eee;font:16px/1.5 system-ui,sans-serif}" +
        "#" +
        OVERLAY_ID +
        " b{font-size:22px}" +
        "#" +
        OVERLAY_ID +
        " i{display:block;width:44px;height:44px;border-radius:50%;" +
        "border:3px solid #e5484d;color:#e5484d;font:700 26px/38px system-ui;font-style:normal}";
      (document.head || document.documentElement).appendChild(st);
    }
    var el = document.createElement("div");
    el.id = OVERLAY_ID;
    el.setAttribute("role", "alert");
    el.innerHTML = "<i>!</i><b></b><span></span>";
    el.querySelector("b").textContent = CFG.title;
    el.querySelector("span").textContent = CFG.message;
    return el;
  }

  function lock() {
    if (locked) return;
    locked = true;
    document.documentElement.classList.add("__g_on");
    overlay = buildOverlay();
    (document.body || document.documentElement).appendChild(overlay);
    try {
      document.querySelectorAll("audio,video").forEach(function (m) {
        m.pause();
      });
    } catch (e) {}
  }

  function unlock() {
    if (!locked) return;
    locked = false;
    document.documentElement.classList.remove("__g_on");
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
    // Nếu dữ liệu bị chặn lúc đang khoá thì tải lại để trang có đủ nội dung
    if (blockedWhileLocked) location.reload();
  }

  // Chống xoá màn lỗi bằng Elements
  new MutationObserver(function () {
    if (locked && overlay && !document.getElementById(OVERLAY_ID)) {
      (document.body || document.documentElement).appendChild(overlay);
    }
    if (locked && !document.documentElement.classList.contains("__g_on")) {
      document.documentElement.classList.add("__g_on");
    }
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class"],
  });

  /* ================= 3. API TRẢ VỀ RỖNG KHI ĐANG KHOÁ ================= */
  var _fetch = window.fetch;
  if (_fetch) {
    window.fetch = function () {
      if (locked) {
        blockedWhileLocked = true;
        return Promise.resolve(
          new Response("{}", {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      return _fetch.apply(this, arguments);
    };
  }

  var _open = XMLHttpRequest.prototype.open;
  var _send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function () {
    this.__g_args = arguments;
    return _open.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function () {
    if (locked) {
      blockedWhileLocked = true;
      this.abort();
      return;
    }
    return _send.apply(this, arguments);
  };

  /* ================= 4. PHÁT HIỆN DEVTOOLS ================= */
  var isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // (a) devtools dock: cửa sổ ngoài lớn hơn cửa sổ trong nhiều. Bỏ qua thiết bị cảm ứng để khỏi báo nhầm.
  function checkSize() {
    if (isTouch) return false;
    var dw = window.outerWidth - window.innerWidth > CFG.sizeThreshold;
    var dh = window.outerHeight - window.innerHeight > CFG.sizeThreshold;
    return dw || dh;
  }

  // (b) bẫy console: DevTools mở sẽ đọc thuộc tính khi in object ra console
  var consoleOpen = false;
  var probe = new Image();
  Object.defineProperty(probe, "id", {
    get: function () {
      consoleOpen = true;
      return "g";
    },
  });
  function checkConsole() {
    consoleOpen = false;
    try {
      console.debug(probe);
    } catch (e) {}
    try {
      console.clear();
    } catch (e) {}
    return consoleOpen;
  }

  // (c) bẫy debugger: nếu DevTools mở, lệnh debugger làm chậm lại rõ rệt
  function checkDebugger() {
    if (!CFG.useDebuggerTrap) return false;
    var t = performance.now();
    (function () {}).constructor("debugger")();
    return performance.now() - t > 100;
  }

  function check() {
    var open = checkSize() || checkConsole() || checkDebugger();
    open ? lock() : unlock();
  }

  setInterval(check, CFG.checkInterval);
  window.addEventListener("resize", check);
  document.addEventListener("visibilitychange", check);
  check();

  // Vô hiệu hoá console cho phía người dùng
  try {
    ["log", "info", "warn", "error", "table", "dir", "trace"].forEach(
      function (m) {
        console[m] = function () {};
      },
    );
  } catch (e) {}
})();
