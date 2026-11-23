/* Experience timeline. Served raw, no bundler — like gallery.js.

   A single line in the empty 200px left column, running beside the roles.
   Hover it and the year at the cursor shows to the left of the line; nothing
   else is ever drawn. Years only, never months.

   The years live in the Markdown, as an empty marker at the start of each
   role:  <span data-from="2022" data-to="2025"></span>  (omit data-to for a
   current role). Each role's paragraph spans its own years, top = latest,
   bottom = earliest, and the year under the cursor is read off that span.
   With no JavaScript the markers are empty and nothing shows. */

(function () {
  var marks = Array.prototype.slice.call(
    document.querySelectorAll("#content [data-from]")
  );
  if (!marks.length) return;

  var now = new Date().getFullYear();
  var line = document.createElement("div");
  var label = document.createElement("span");
  line.id = "timeline";
  label.id = "timeline-year";
  label.hidden = true;
  line.appendChild(label);
  document.body.appendChild(line);

  var spans = [];

  function measure() {
    var y = window.scrollY;
    spans = marks.map(function (m) {
      var r = m.closest("p").getBoundingClientRect();
      var from = parseInt(m.getAttribute("data-from"), 10);
      var to = m.hasAttribute("data-to")
        ? parseInt(m.getAttribute("data-to"), 10)
        : now;
      return { top: r.top + y, bottom: r.bottom + y, from: from, to: to };
    });
    // A role runs down to where the next one starts, so a second paragraph
    // under a role (Enterprise's awards) belongs to it.
    for (var i = 0; i + 1 < spans.length; i++) spans[i].bottom = spans[i + 1].top;
    var first = spans[0];
    var last = spans[spans.length - 1];
    line.style.top = first.top + "px";
    line.style.height = last.bottom - first.top + "px";
  }

  function yearAt(pageY) {
    for (var i = 0; i < spans.length; i++) {
      var s = spans[i];
      if (pageY < s.bottom) {
        var t = Math.min(1, Math.max(0, (pageY - s.top) / (s.bottom - s.top)));
        return Math.round(s.to - t * (s.to - s.from));
      }
    }
    return spans[spans.length - 1].from;
  }

  line.addEventListener("mousemove", function (e) {
    var top = parseFloat(line.style.top);
    label.textContent = yearAt(e.pageY);
    label.style.top = e.pageY - top - 9 + "px";
    label.hidden = false;
  });

  line.addEventListener("mouseleave", function () {
    label.hidden = true;
  });

  measure();
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);
})();
