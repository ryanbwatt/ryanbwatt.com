/* Photos lightbox. Served raw, no bundler — like style.css.

   Click a thumbnail and the photo takes over the screen on white, with the
   caption tight beneath and left-aligned. Arrow keys or the on-screen arrows
   move between photos, clicking the photo advances, and ×, Escape, or a click
   off the photo closes it. The photo list and captions are read from the grid,
   so adding a <figure> to the page is all it takes.

   The full-size image lives in each thumbnail's data-full attribute rather than
   a wrapping <a href>, so there's no plain link to right-click and save; the
   handlers below also swallow context-menu and drag on the images. None of this
   stops a determined visitor (the files are still served, and a screenshot
   always works) — it only turns off the one-click save. */

(function () {
  var gallery = document.getElementById("gallery");
  if (!gallery) return;

  var figures = Array.prototype.slice.call(gallery.querySelectorAll("figure"));
  var items = figures.map(function (fig) {
    var img = fig.querySelector("img");
    var cap = fig.querySelector("figcaption");
    return {
      full: img ? img.getAttribute("data-full") || img.src : "",
      alt: img ? img.getAttribute("alt") || "" : "",
      caption: cap ? cap.textContent.trim() : "",
      trigger: img || fig,
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

  figures.forEach(function (_, i) {
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

  // Turn off the one-click save on the photos: no context menu, no drag, on
  // either the grid or the enlarged view.
  function swallow(e) {
    e.preventDefault();
  }
  gallery.addEventListener("contextmenu", swallow);
  gallery.addEventListener("dragstart", swallow);
  lb.addEventListener("contextmenu", swallow);
  lb.addEventListener("dragstart", swallow);
})();
