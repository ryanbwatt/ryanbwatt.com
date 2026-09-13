/* Photos lightbox. Served raw, no bundler — like style.css.

   Progressive enhancement: without this script each thumbnail is a plain link
   to its full-size image. With it, a click opens the photo full-screen on
   white, with the caption tight beneath and left-aligned. Arrow keys or the
   on-screen arrows move between photos, clicking the photo advances, and ×,
   Escape, or a click off the photo closes it. The photo list and captions are
   read from the grid, so adding a <figure> to the page is all it takes. */

(function () {
  var gallery = document.getElementById("gallery");
  if (!gallery) return;

  var figures = Array.prototype.slice.call(gallery.querySelectorAll("figure"));
  var items = figures.map(function (fig) {
    var link = fig.querySelector("a");
    var img = fig.querySelector("img");
    var cap = fig.querySelector("figcaption");
    return {
      full: link ? link.getAttribute("href") : img ? img.src : "",
      alt: img ? img.getAttribute("alt") || "" : "",
      caption: cap ? cap.textContent.trim() : "",
      trigger: link || fig,
    };
  });
  if (!items.length) return;

  // Build the lightbox once and keep it in the DOM, hidden.
  var lb = document.createElement("div");
  lb.id = "lightbox";
  lb.setAttribute("role", "dialog");
  lb.setAttribute("aria-modal", "true");
  lb.hidden = true;
  lb.innerHTML =
    '<button class="lb-close" type="button" aria-label="Close">×</button>' +
    '<button class="lb-prev" type="button" aria-label="Previous photo">←</button>' +
    '<figure class="lb-figure">' +
    '<img class="lb-img" alt="">' +
    '<figcaption class="lb-cap"></figcaption>' +
    "</figure>" +
    '<button class="lb-next" type="button" aria-label="Next photo">→</button>';
  document.body.appendChild(lb);

  var lbImg = lb.querySelector(".lb-img");
  var lbCap = lb.querySelector(".lb-cap");
  var index = 0;
  var lastFocus = null;

  function show(i) {
    index = (i + items.length) % items.length;
    var it = items[index];
    lbImg.src = it.full;
    lbImg.alt = it.alt;
    lbCap.textContent = it.caption;
    // Preload the neighbours so paging is instant.
    [index + 1, index - 1].forEach(function (j) {
      var pre = new Image();
      pre.src = items[(j + items.length) % items.length].full;
    });
  }

  function open(i, trigger) {
    lastFocus = trigger || document.activeElement;
    show(i);
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    lb.querySelector(".lb-close").focus();
  }

  function close() {
    lb.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function next() {
    show(index + 1);
  }
  function prev() {
    show(index - 1);
  }

  figures.forEach(function (fig, i) {
    items[i].trigger.addEventListener("click", function (e) {
      e.preventDefault();
      open(i, items[i].trigger);
    });
  });

  lb.querySelector(".lb-close").addEventListener("click", close);
  lb.querySelector(".lb-prev").addEventListener("click", function (e) {
    e.stopPropagation();
    prev();
  });
  lb.querySelector(".lb-next").addEventListener("click", function (e) {
    e.stopPropagation();
    next();
  });
  // Click the photo to advance; click the surrounding white to close.
  lbImg.addEventListener("click", function (e) {
    e.stopPropagation();
    next();
  });
  lb.querySelector(".lb-figure").addEventListener("click", function (e) {
    e.stopPropagation();
  });
  lb.addEventListener("click", close);

  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") next();
    else if (e.key === "ArrowLeft") prev();
  });
})();
