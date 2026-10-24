/* Extras front page. Served raw, no bundler — like gallery.js.

   Fetches /api/extras, lays out a lead story and a grid, and filters by
   section. Clicking a story opens the reader, which pages through the current
   section with the arrows or arrow keys; "Read at <publisher>" leaves the site.
   ↻ refetches and brings a different recent story to the lead. */

(function () {
  var front = document.getElementById("front");
  var refresh = document.getElementById("refresh");
  var tabs = Array.prototype.slice.call(document.querySelectorAll("#sections button"));
  var all = [];
  var shown = [];
  var section = "All";
  var leadPick = 0;

  var now = new Date();
  var edition = now.getHours() < 12 ? "Morning" : now.getHours() < 18 ? "Afternoon" : "Evening";
  document.getElementById("dateline").textContent =
    now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) +
    " · " + edition + " edition";

  try {
    section = localStorage.getItem("rbw-extras-section") || "All";
  } catch (e) {}

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function ago(t) {
    var h = Math.round((Date.now() - t) / 36e5);
    return !t ? "" : h < 1 ? "Just now" : h < 24 ? h + "h ago" : Math.round(h / 24) + "d ago";
  }

  function card(it, i, lead) {
    return (
      '<article class="story' + (lead ? " lead" : "") + '" data-i="' + i + '" tabindex="0">' +
      (it.image ? '<img src="' + esc(it.image) + '" alt="" loading="' + (lead ? "eager" : "lazy") + '">' : "") +
      "<div>" +
      '<div class="kicker">' + esc(it.section) + " · " + esc(it.source) + " · " + ago(it.date) + "</div>" +
      "<h2>" + esc(it.title) + "</h2>" +
      "<p>" + esc(it.summary) + "</p>" +
      "</div></article>"
    );
  }

  function render() {
    tabs.forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.section === section));
    });
    shown = all.filter(function (it) {
      return section === "All" || it.section === section;
    });
    if (!shown.length) {
      front.innerHTML = '<p class="status">Nothing here right now.</p>';
      return;
    }
    // Lead: one of the newest few stories that has a picture, rotated by ↻.
    var withImg = shown.slice(0, 8).filter(function (it) { return it.image; });
    var lead = withImg.length ? withImg[leadPick % withImg.length] : shown[0];
    shown = [lead].concat(shown.filter(function (it) { return it !== lead; }));
    front.innerHTML = shown.map(function (it, i) { return card(it, i, i === 0); }).join("");
  }

  function load(bust) {
    refresh.classList.add("spin");
    fetch("/api/extras" + (bust ? "?t=" + Date.now() : ""))
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then(function (items) {
        all = items;
        render();
      })
      .catch(function () {
        if (!all.length) front.innerHTML = '<p class="status">Couldn’t load stories. Try ↻.</p>';
      })
      .then(function () {
        refresh.classList.remove("spin");
      });
  }

  refresh.addEventListener("click", function () {
    leadPick++;
    load(true);
  });

  tabs.forEach(function (b) {
    b.addEventListener("click", function () {
      section = b.dataset.section;
      leadPick = 0;
      try {
        localStorage.setItem("rbw-extras-section", section);
      } catch (e) {}
      render();
      window.scrollTo(0, 0);
    });
  });

  // Reader
  var rd = document.createElement("div");
  rd.id = "reader";
  rd.setAttribute("role", "dialog");
  rd.setAttribute("aria-modal", "true");
  rd.hidden = true;
  rd.innerHTML =
    '<button class="r-prev" type="button" aria-label="Previous story">←</button>' +
    "<article></article>" +
    '<button class="r-next" type="button" aria-label="Next story">→</button>' +
    '<button class="r-close" type="button" aria-label="Close">×</button>';
  document.body.appendChild(rd);
  var rdBody = rd.querySelector("article");
  var index = 0;
  var lastFocus = null;

  function show(i) {
    index = (i + shown.length) % shown.length;
    var it = shown[index];
    rdBody.innerHTML =
      (it.image ? '<img src="' + esc(it.image) + '" alt="">' : "<div></div>") +
      "<div>" +
      '<div class="kicker">' + esc(it.section) + " · " + esc(it.source) + " · " + ago(it.date) + "</div>" +
      "<h2>" + esc(it.title) + "</h2>" +
      "<p>" + esc(it.summary) + "</p>" +
      '<p><a href="' + esc(it.link) + '" target="_blank" rel="noopener">Read at ' + esc(it.source) + " →</a></p>" +
      '<div class="r-count">' + (index + 1) + " / " + shown.length + "</div>" +
      "</div>";
    rd.scrollTop = 0;
    var nx = shown[(index + 1) % shown.length];
    if (nx.image) new Image().src = nx.image;
  }

  function open(i, el) {
    lastFocus = el;
    show(i);
    rd.hidden = false;
    document.body.style.overflow = "hidden";
    rd.querySelector(".r-close").focus();
  }

  function close() {
    rd.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  front.addEventListener("click", function (e) {
    var s = e.target.closest(".story");
    if (s) open(+s.dataset.i, s);
  });
  front.addEventListener("keydown", function (e) {
    var s = e.target.closest(".story");
    if (s && e.key === "Enter") open(+s.dataset.i, s);
  });
  rd.querySelector(".r-prev").addEventListener("click", function () { show(index - 1); });
  rd.querySelector(".r-next").addEventListener("click", function () { show(index + 1); });
  rd.querySelector(".r-close").addEventListener("click", close);
  document.addEventListener("keydown", function (e) {
    if (rd.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") show(index + 1);
    else if (e.key === "ArrowLeft") show(index - 1);
  });

  load(false);
})();
