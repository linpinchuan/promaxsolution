/* ==========================================================================
   Pro Max Solution - site scripts
   ========================================================================== */

(function () {
  "use strict";

  /* ---- SETTINGS: edit these two values ---------------------------------- */
  var CONFIG = {
    // RECOMMENDED: paste your Google Apps Script Web App URL here to save every
    // submission as a new row in a Google Sheet (open it anytime, or File > Download > Excel).
    // See README.md "Lead form -> Excel / Google Sheet" for the 5-minute setup.
    sheetEndpoint: "https://script.google.com/macros/s/AKfycbxIRdvm95EaL66JRlaoL_i6fTa0-qIcK0mYqPOXNzFAE3gg8UoZoPr5FHlC_9efEAU9/exec",
    // Alternative: a form service URL (Formspree, Web3Forms, Getform, etc.), used only
    // if sheetEndpoint is empty. Example: "https://formspree.io/f/abcdwxyz"
    formEndpoint: "",
    // If both above are empty, the form opens the visitor's email app instead.
    email: "pinchuan95@promaxsolution.org"
  };
  /* ----------------------------------------------------------------------- */

  var PAGE_SIZE = 9;

  /* ---- Mobile navigation ---- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---- Footer year ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Blog data ---- */
  var posts = (window.POSTS || []).slice().sort(function (a, b) {
    return b.date.localeCompare(a.date);
  });

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function formatDate(iso) {
    var d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  function cardHTML(p) {
    return (
      '<article class="card">' +
        '<a class="card__link" href="posts/' + esc(p.slug) + '.html">' +
          '<span class="card__cat">' + esc(p.category) + "</span>" +
          '<h3 class="card__title">' + esc(p.title) + "</h3>" +
          '<p class="card__excerpt">' + esc(p.excerpt) + "</p>" +
          '<span class="card__meta">' +
            '<time datetime="' + esc(p.date) + '">' + formatDate(p.date) + "</time>" +
            "<span>" + esc(p.readTime || "") + "</span>" +
            '<span class="card__more">Read article <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>' +
          "</span>" +
        "</a>" +
      "</article>"
    );
  }

  /* ---- Homepage: latest three articles ---- */
  var latest = document.getElementById("latest-posts");
  if (latest) {
    latest.innerHTML = posts.length
      ? posts.slice(0, 3).map(function (p) { return cardHTML(p); }).join("")
      : '<p class="empty-note">New articles are on the way.</p>';
  }

  /* ---- Blog page: every article, with category filters ---- */
  var list = document.getElementById("post-list");
  if (list) {
    var filtersEl = document.getElementById("filters");
    var moreBtn = document.getElementById("show-more");
    var state = { category: "All", shown: PAGE_SIZE };

    var categories = ["All"];
    posts.forEach(function (p) {
      if (categories.indexOf(p.category) === -1) categories.push(p.category);
    });

    var renderFilters = function () {
      if (categories.length <= 2) { filtersEl.hidden = true; return; }
      filtersEl.innerHTML = categories.map(function (c) {
        return '<button type="button" class="chip" data-cat="' + esc(c) + '" aria-pressed="' +
          (c === state.category) + '">' + esc(c) + "</button>";
      }).join("");
    };

    var renderList = function () {
      var filtered = posts.filter(function (p) {
        return state.category === "All" || p.category === state.category;
      });
      var visible = filtered.slice(0, state.shown);

      list.innerHTML = filtered.length
        ? visible.map(function (p) { return cardHTML(p); }).join("")
        : '<p class="empty-note">No articles in this category yet.</p>';

      moreBtn.hidden = filtered.length <= state.shown;
    };

    filtersEl.addEventListener("click", function (e) {
      var btn = e.target.closest(".chip");
      if (!btn) return;
      state.category = btn.getAttribute("data-cat");
      state.shown = PAGE_SIZE;
      renderFilters();
      renderList();
    });

    moreBtn.addEventListener("click", function () {
      state.shown += PAGE_SIZE;
      renderList();
    });

    renderFilters();
    renderList();
  }

  /* ---- Lead form ---- */
  var form = document.getElementById("lead-form");
  if (form) {
    var status = document.getElementById("form-status");
    var submitBtn = form.querySelector('button[type="submit"]');

    var setStatus = function (message, kind) {
      status.textContent = message;
      status.className = "form-status" + (kind ? " is-" + kind : "");
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Honeypot: real visitors never fill this hidden field.
      if (form.elements.website && form.elements.website.value) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var data = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        phone: form.elements.phone.value.trim(),
        service: form.elements.service.value
      };

      if (CONFIG.sheetEndpoint) {
        // Google Apps Script web apps do not send CORS headers, so the response
        // is opaque to JavaScript. We fire the request and assume success if it
        // does not throw (the row is written server-side either way).
        submitBtn.disabled = true;
        setStatus("Sending your request...", "");

        fetch(CONFIG.sheetEndpoint, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(data)
        })
          .then(function () {
            form.reset();
            setStatus("Thank you. We received your request and will contact you soon.", "ok");
          })
          .catch(function () {
            setStatus("Your request could not be sent. Please email us at " + CONFIG.email + ".", "error");
          })
          .finally(function () {
            submitBtn.disabled = false;
          });
      } else if (CONFIG.formEndpoint) {
        submitBtn.disabled = true;
        setStatus("Sending your request...", "");

        fetch(CONFIG.formEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data)
        })
          .then(function (res) {
            if (!res.ok) throw new Error("Request failed");
            form.reset();
            setStatus("Thank you. We received your request and will contact you soon.", "ok");
          })
          .catch(function () {
            setStatus("Your request could not be sent. Please email us at " + CONFIG.email + ".", "error");
          })
          .finally(function () {
            submitBtn.disabled = false;
          });
      } else {
        var body =
          "Name: " + data.name + "\n" +
          "Email: " + data.email + "\n" +
          "Contact number: " + data.phone + "\n" +
          "Service interested in: " + data.service;
        window.location.href =
          "mailto:" + CONFIG.email +
          "?subject=" + encodeURIComponent("Proposal request from " + data.name) +
          "&body=" + encodeURIComponent(body);
        setStatus("Your email app should open with your request ready to send.", "ok");
      }
    });
  }
})();
