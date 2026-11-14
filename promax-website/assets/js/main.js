/* ==========================================================================
   Pro Max Solution - site scripts
   ========================================================================== */

(function () {
  "use strict";

  /* ---- SETTINGS: edit this value ---------------------------------- */
  var CONFIG = {
    // Paste your Google Apps Script Web App URL here. Every form submission is then saved
    // as a new row in your Google Sheet (open it anytime, or File > Download > Excel).
    // Setup steps: README.md, "Lead form -> Excel / Google Sheet".
    sheetEndpoint: "https://script.google.com/macros/s/AKfycbzQ5UyzCDwNaUPMjTgNXT6F4jcXHaBJ26GAPbDRnmCw23OPR9e73P0NKRRsiO1fthOF/exec"
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


    /* ---- Phone number: country code + format check ---- */
    var country = form.elements.country;
    var phoneInput = form.elements.phone;
    var phoneError = document.getElementById("phone-error");
    var COUNTRY_NAMES = {};
    Array.prototype.forEach.call(country.options, function (o) {
      COUNTRY_NAMES[o.value] = o.textContent.replace(/^\+\d+\s*/, "");
    });

    // Valid national numbers (digits only, trunk "0" removed) and an example for the error text.
    var PHONE_RULES = {
      MY: { re: /^(1\d{8,9}|[3-9]\d{7,8})$/, ex: "12 345 6789" },
      SG: { re: /^[3689]\d{7}$/, ex: "8123 4567" },
      ID: { re: /^[2-9]\d{7,11}$/, ex: "812 3456 7890" },
      TH: { re: /^[2-9]\d{7,8}$/, ex: "81 234 5678" },
      PH: { re: /^[2-9]\d{8,9}$/, ex: "917 123 4567" },
      VN: { re: /^[1-9]\d{8,9}$/, ex: "91 234 5678" },
      BN: { re: /^[2-8]\d{6}$/, ex: "712 3456" },
      KH: { re: /^[1-9]\d{7,8}$/, ex: "12 345 678" },
      MM: { re: /^[1-9]\d{7,9}$/, ex: "9 123 456 789" },
      LA: { re: /^[2-9]\d{7,9}$/, ex: "20 5512 3456" },
      CN: { re: /^(1[3-9]\d{9}|[2-9]\d{8,10})$/, ex: "131 2345 6789" },
      HK: { re: /^[2-9]\d{7}$/, ex: "5123 4567" },
      TW: { re: /^(9\d{8}|[2-8]\d{7,8})$/, ex: "912 345 678" },
      JP: { re: /^[1-9]\d{8,9}$/, ex: "90 1234 5678" },
      KR: { re: /^[1-9]\d{7,9}$/, ex: "10 1234 5678" },
      IN: { re: /^[6-9]\d{9}$/, ex: "98765 43210" },
      AU: { re: /^[2-478]\d{8}$/, ex: "412 345 678" },
      NZ: { re: /^[2-9]\d{7,9}$/, ex: "21 123 4567" },
      US: { re: /^[2-9]\d{9}$/, ex: "415 555 0132" },
      CA: { re: /^[2-9]\d{9}$/, ex: "416 555 0132" },
      AE: { re: /^[2-9]\d{8}$/, ex: "50 123 4567" },
      SA: { re: /^[1-9]\d{8}$/, ex: "50 123 4567" },
      AL: { re: /^[2-9]\d{7,8}$/, ex: "69 123 4567" },
      AD: { re: /^[3-9]\d{5,8}$/, ex: "312 345" },
      AT: { re: /^[1-9]\d{6,12}$/, ex: "664 123 4567" },
      BY: { re: /^[1-9]\d{8,9}$/, ex: "29 123 4567" },
      BE: { re: /^[1-9]\d{7,8}$/, ex: "470 12 34 56" },
      BA: { re: /^[3-9]\d{7,8}$/, ex: "61 123 456" },
      BG: { re: /^[2-9]\d{7,8}$/, ex: "88 123 4567" },
      HR: { re: /^[1-9]\d{7,8}$/, ex: "91 234 5678" },
      CY: { re: /^[2-9]\d{7}$/, ex: "96 123456" },
      CZ: { re: /^[2-9]\d{8}$/, ex: "601 123 456" },
      DK: { re: /^[2-9]\d{7}$/, ex: "32 12 34 56" },
      EE: { re: /^[3-9]\d{6,7}$/, ex: "5123 4567" },
      FI: { re: /^[1-9]\d{5,10}$/, ex: "41 234 5678" },
      FR: { re: /^[1-9]\d{8}$/, ex: "6 12 34 56 78" },
      DE: { re: /^[1-9]\d{6,12}$/, ex: "151 2345 6789" },
      GR: { re: /^[2-9]\d{9}$/, ex: "691 234 5678" },
      HU: { re: /^[1-9]\d{7,8}$/, ex: "20 123 4567" },
      IS: { re: /^[3-9]\d{6}$/, ex: "611 1234" },
      IE: { re: /^[1-9]\d{7,9}$/, ex: "85 123 4567" },
      IT: { re: /^(3\d{8,9}|0\d{5,10})$/, ex: "312 345 6789", keep0: true },
      XK: { re: /^[4-9]\d{7}$/, ex: "44 123 456" },
      LV: { re: /^[2-9]\d{7}$/, ex: "2123 4567" },
      LI: { re: /^[2-9]\d{6,8}$/, ex: "660 234 567" },
      LT: { re: /^[3-9]\d{7}$/, ex: "612 34567" },
      LU: { re: /^[2-9]\d{5,10}$/, ex: "628 123 456" },
      MT: { re: /^[2-9]\d{7}$/, ex: "9696 1234" },
      MD: { re: /^[2-9]\d{7}$/, ex: "621 12 345" },
      MC: { re: /^[4-9]\d{7,8}$/, ex: "6 12 34 56 78" },
      ME: { re: /^[2-9]\d{7,8}$/, ex: "67 622 901" },
      NL: { re: /^[1-9]\d{8}$/, ex: "6 12345678" },
      MK: { re: /^[2-9]\d{7}$/, ex: "72 345 678" },
      NO: { re: /^[2-9]\d{7}$/, ex: "406 12 345" },
      PL: { re: /^[1-9]\d{8}$/, ex: "512 345 678" },
      PT: { re: /^[2-9]\d{8}$/, ex: "912 345 678" },
      RO: { re: /^[2-9]\d{8}$/, ex: "712 345 678" },
      RU: { re: /^[3-9]\d{9}$/, ex: "912 345 6789" },
      SM: { re: /^\d{6,10}$/, ex: "66 66 12 12", keep0: true },
      RS: { re: /^[1-9]\d{7,9}$/, ex: "60 1234567" },
      SK: { re: /^[2-9]\d{8}$/, ex: "912 123 456" },
      SI: { re: /^[1-9]\d{7}$/, ex: "31 234 567" },
      ES: { re: /^[5-9]\d{8}$/, ex: "612 34 56 78" },
      SE: { re: /^[1-9]\d{6,9}$/, ex: "70 123 45 67" },
      CH: { re: /^[1-9]\d{8}$/, ex: "78 123 45 67" },
      TR: { re: /^[2-5]\d{9}$/, ex: "501 234 56 78" },
      UA: { re: /^[3-9]\d{8}$/, ex: "50 123 4567" },
      GB: { re: /^[1-9]\d{9,10}$/, ex: "7400 123456" },
      OTHER: { re: /^[1-9]\d{7,14}$/, ex: "+49 151 2345 6789" }
    };

    var dialOf = function () {
      return country.options[country.selectedIndex].getAttribute("data-dial") || "";
    };

    // Returns { ok, full, national, message }
    var checkPhone = function () {
      var raw = phoneInput.value.trim();
      var rule = PHONE_RULES[country.value];
      var dial = dialOf();
      var name = COUNTRY_NAMES[country.value];
      var bad = function (msg) { return { ok: false, message: msg }; };

      if (!raw) return bad("Please enter your contact number.");
      if (/[^0-9+()\s.\-]/.test(raw)) {
        return bad("Contact number can only contain digits, spaces, + ( ) and -. Please remove any letters or symbols.");
      }
      var digits = raw.replace(/\D/g, "");

      if (country.value === "OTHER") {
        digits = digits.replace(/^00/, "");
        if (!rule.re.test(digits)) {
          return bad("Please enter a valid number including your country code, for example " + rule.ex + ".");
        }
        return { ok: true, full: "+" + digits, national: digits };
      }

      // Accept a number typed with its country code (+60..., 0060...) by removing the code.
      if (/^\s*\+/.test(raw) || /^00/.test(digits)) {
        var d2 = digits.replace(/^00/, "");
        if (d2.indexOf(dial) === 0) digits = d2.slice(dial.length);
        else return bad("This number does not start with " + name + " country code +" + dial + ". Please choose the correct country or enter your number without the code, for example " + rule.ex + ".");
      }
      if (!rule.keep0) digits = digits.replace(/^0+/, ""); // drop the local leading 0 (Italy and San Marino keep it)

      if (!rule.re.test(digits)) {
        return bad("Please enter a valid " + name + " mobile or phone number without the country code, for example " + rule.ex + ".");
      }
      return { ok: true, full: "+" + dial + digits, national: digits };
    };

    var showPhoneError = function (message) {
      if (message) {
        phoneError.textContent = message;
        phoneError.hidden = false;
        phoneInput.setAttribute("aria-invalid", "true");
        phoneInput.classList.add("is-invalid");
        country.classList.add("is-invalid");
      } else {
        phoneError.textContent = "";
        phoneError.hidden = true;
        phoneInput.removeAttribute("aria-invalid");
        phoneInput.classList.remove("is-invalid");
        country.classList.remove("is-invalid");
      }
    };

    var updatePlaceholder = function () {
      var rule = PHONE_RULES[country.value];
      phoneInput.placeholder = country.value === "OTHER" ? "+49 151 2345 6789" : rule.ex;
    };
    updatePlaceholder();

    phoneInput.addEventListener("blur", function () {
      if (phoneInput.value.trim()) showPhoneError(checkPhone().message);
    });
    phoneInput.addEventListener("input", function () {
      if (!phoneError.hidden) showPhoneError(checkPhone().message);
    });
    country.addEventListener("change", function () {
      updatePlaceholder();
      if (phoneInput.value.trim()) showPhoneError(checkPhone().message);
      else showPhoneError("");
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Honeypot: real visitors never fill this hidden field.
      if (form.elements.website && form.elements.website.value) return;

      var phone = checkPhone();
      showPhoneError(phone.ok ? "" : phone.message);

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      if (!phone.ok) {
        phoneInput.focus();
        return;
      }

      var data = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        country: COUNTRY_NAMES[country.value],
        countryCode: country.value === "OTHER" ? "" : "+" + dialOf(),
        phone: phone.full,
        service: form.elements.service.value
      };

      var THANKS = "Thank you for providing the information. Our representative will get in touch with you as soon as possible.";
      var FAIL = "Sorry, your request could not be sent. Please try again, or message us on WhatsApp.";

      if (!CONFIG.sheetEndpoint) {
        // Sheet not connected yet (see README). Never opens an email app.
        console.warn("Lead form: CONFIG.sheetEndpoint is empty, so the submission was not saved.");
        setStatus(FAIL, "error");
        return;
      }

      // Google Apps Script web apps send no CORS headers, so the reply is opaque to
      // JavaScript. The row is written server-side; we show the thank-you message
      // unless the request itself fails to leave the browser.
      submitBtn.disabled = true;
      setStatus("Sending...", "");

      fetch(CONFIG.sheetEndpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data)
      })
        .then(function () {
          form.reset();
          country.value = "US";
          updatePlaceholder();
          showPhoneError("");
          setStatus(THANKS, "ok");
          status.scrollIntoView({ behavior: "smooth", block: "center" });
        })
        .catch(function () {
          setStatus(FAIL, "error");
        })
        .finally(function () {
          submitBtn.disabled = false;
        });
    });
  }
})();
