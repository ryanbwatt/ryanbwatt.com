/* Experience timeline. Served raw, no bundler — like gallery.js.

   A line in the empty left column beside the roles, with every year listed
   down its left side in grey. Hover the bar and the year under the cursor
   goes black and larger. Years only, never months.

   The years live in the Markdown, as an empty marker at the start of each
   role:  <span data-from="2022" data-to="2025"></span>  (omit data-to for a
   current role). A role runs from its own paragraph down to the next marker,
   and that stretch is split evenly between its years, latest at the top.
   Each year is labelled once, on the shortest role that covers it (Artsy
   carries 2021); hovering any role in that year lights up that label.

   The role descriptions sit in grey and come up to the normal colour when
   their year or the description itself is hovered, so the reader is drawn
   down the page one role at a time. The dimming is in style.css and only
   applies on a wide screen with a mouse; phones get the plain page. With
   no JavaScript the markers are empty and nothing shows. */

(function () {
  var marks = Array.prototype.slice.call(
    document.querySelectorAll("#content [data-from]")
  );
  if (!marks.length) return;

  var now = new Date().getFullYear();
  var content = document.getElementById("content");

  // Each role owns its paragraph and any paragraphs or <details> under it up
  // to the next role (the "More" expanders). The last role owns only its own.
  var groups = marks.map(function (m, i) {
    var first = m.closest("p");
    var stop = i + 1 < marks.length ? marks[i + 1].closest("p") : null;
    var ps = [first];
    if (stop) {
      for (var el = first.nextElementSibling; el && el !== stop; el = el.nextElementSibling) {
        if (el.tagName === "P" || el.tagName === "UL" || el.tagName === "DETAILS") ps.push(el);
      }
    }
    ps.forEach(function (p) {
      p.classList.add("tl-role");
      p.setAttribute("data-role", i);
    });
    return ps;
  });
  content.classList.add("tl-dim");
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
    roles.forEach(function (role, r) {
      var n = role.to - role.from + 1;
      var h = (role.bottom - role.top) / n;
      for (var k = 0; k < n; k++) {
        bands.push({ top: role.top + k * h, bottom: role.top + (k + 1) * h, year: role.to - k, span: n, role: r });
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

  var litRole = null;

  function light(band) {
    var el = band ? labels[band.year] : null;
    if (el !== lit) {
      if (lit) lit.classList.remove("on");
      if (el) el.classList.add("on");
      lit = el;
    }
    var role = band ? groups[band.role] : null;
    if (role !== litRole) {
      if (litRole) litRole.forEach(function (p) { p.classList.remove("lit"); });
      if (role) role.forEach(function (p) { p.classList.add("lit"); });
      litRole = role;
    }
  }

  // The band under the cursor, optionally limited to one role's bands.
  function bandAt(pageY, role) {
    var hit = null;
    for (var i = 0; i < bands.length; i++) {
      var b = bands[i];
      if (role != null && b.role !== role) continue;
      hit = b;
      if (pageY < b.bottom) break;
    }
    return hit;
  }

  bar.addEventListener("mousemove", function (e) {
    light(bandAt(e.pageY));
  });
  bar.addEventListener("mouseleave", function () {
    light(null);
  });

  content.addEventListener("mousemove", function (e) {
    var p = e.target.closest ? e.target.closest(".tl-role") : null;
    light(p ? bandAt(e.pageY, parseInt(p.getAttribute("data-role"), 10)) : null);
  });
  content.addEventListener("mouseleave", function () {
    light(null);
  });

  measure();
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);
  // Opening a role's "More" pushes everything below it down.
  content.addEventListener("toggle", measure, true);
})();
