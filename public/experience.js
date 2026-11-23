/* Experience timeline. Served raw, no bundler — like gallery.js.

   A line in the empty left column beside the roles, with every year listed
   down its left side in grey. Hover the bar and the year under the cursor
   goes black and larger. Years only, never months.

   The years live in the Markdown, as an empty marker at the start of each
   role:  <span data-from="2022" data-to="2025"></span>  (omit data-to for a
   current role). A role runs from its own paragraph down to the next marker,
   and that stretch is split evenly between its years, latest at the top.
   Each year is labelled once, on the shortest role that covers it (Artsy
   carries 2021); hovering any role in that year lights up that label. With
   no JavaScript the markers are empty and nothing shows. */

(function () {
  var marks = Array.prototype.slice.call(
    document.querySelectorAll("#content [data-from]")
  );
  if (!marks.length) return;

  var now = new Date().getFullYear();
  var bar = document.createElement("div");
  bar.id = "timeline";
  document.body.appendChild(bar);

  var bands = []; // { top, bottom, year }
  var labels = {}; // year -> element
  var lit = null;

  function measure() {
    var sy = window.scrollY;
    var roles = marks.map(function (m) {
      var r = m.closest("p").getBoundingClientRect();
      return {
        top: r.top + sy,
        bottom: r.bottom + sy,
        from: parseInt(m.getAttribute("data-from"), 10),
        to: m.hasAttribute("data-to") ? parseInt(m.getAttribute("data-to"), 10) : now,
      };
    });
    for (var i = 0; i + 1 < roles.length; i++) roles[i].bottom = roles[i + 1].top;

    var origin = roles[0].top;
    bar.style.top = origin + "px";
    bar.style.height = roles[roles.length - 1].bottom - origin + "px";

    bands = [];
    roles.forEach(function (role) {
      var n = role.to - role.from + 1;
      var h = (role.bottom - role.top) / n;
      for (var k = 0; k < n; k++) {
        bands.push({ top: role.top + k * h, bottom: role.top + (k + 1) * h, year: role.to - k, span: n });
      }
    });

    // A year shared by several roles is labelled on the shortest of them
    // (the topmost on a tie), so a one-year role like Artsy carries its own.
    var home = {};
    bands.forEach(function (b) {
      if (!home[b.year] || b.span < home[b.year].span) home[b.year] = b;
    });

    bar.textContent = "";
    labels = {};
    lit = null;
    bands.forEach(function (b) {
      if (home[b.year] !== b) return;
      var el = document.createElement("span");
      el.className = "tl-year";
      el.textContent = b.year;
      el.style.top = b.top - origin + "px";
      bar.appendChild(el);
      labels[b.year] = el;
    });
  }

  function light(year) {
    var el = year ? labels[year] : null;
    if (el === lit) return;
    if (lit) lit.classList.remove("on");
    if (el) el.classList.add("on");
    lit = el;
  }

  bar.addEventListener("mousemove", function (e) {
    for (var i = 0; i < bands.length; i++) {
      if (e.pageY < bands[i].bottom) return light(bands[i].year);
    }
    light(bands[bands.length - 1].year);
  });

  bar.addEventListener("mouseleave", function () {
    light(null);
  });

  measure();
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);
})();
