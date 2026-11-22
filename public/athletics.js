/* Athletics results filter. Served raw, no bundler — like gallery.js.

   Builds the two dropdowns from the rows' data- attributes, so adding a
   <tr> to the table is all it takes. With no JavaScript the dropdowns stay
   hidden and every row shows. */

(function () {
  var table = document.getElementById("races");
  var bar = document.getElementById("race-filters");
  if (!table || !bar) return;

  var rows = Array.prototype.slice.call(table.tBodies[0].rows);
  var keys = ["sport", "year"];
  var selects = {};

  keys.forEach(function (key) {
    var select = document.getElementById("filter-" + key);
    var seen = {};
    var values = [];
    rows.forEach(function (row) {
      var v = row.getAttribute("data-" + key);
      if (v && !seen[v]) { seen[v] = true; values.push(v); }
    });
    if (key === "year") values.sort().reverse();
    values.forEach(function (v) {
      var o = document.createElement("option");
      o.value = v;
      o.textContent = v;
      select.appendChild(o);
    });
    select.addEventListener("change", apply);
    selects[key] = select;
  });

  function apply() {
    rows.forEach(function (row) {
      var show = keys.every(function (key) {
        var want = selects[key].value;
        return !want || row.getAttribute("data-" + key) === want;
      });
      row.hidden = !show;
    });
  }

  bar.hidden = false;
})();
