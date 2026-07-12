/* TransitOps client-side behaviour:
   dark mode, global table search, column sorting, live cargo-capacity check. */
(function () {
  "use strict";

  /* ---------- Dark mode toggle ---------- */
  var toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var root = document.documentElement;
      var next = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  /* ---------- Topbar search: quick-filter visible table rows ---------- */
  var search = document.getElementById("global-search");
  if (search) {
    search.addEventListener("input", function () {
      var q = search.value.trim().toLowerCase();
      document.querySelectorAll(".data-table tbody tr, .board-row").forEach(function (row) {
        row.style.display = !q || row.textContent.toLowerCase().indexOf(q) !== -1
          ? "" : "none";
      });
    });
  }

  /* ---------- Click-to-sort table headers ---------- */
  document.querySelectorAll("table.sortable th").forEach(function (th) {
    th.addEventListener("click", function () {
      var table = th.closest("table");
      var tbody = table.querySelector("tbody");
      var idx = Array.prototype.indexOf.call(th.parentNode.children, th);
      var numeric = th.hasAttribute("data-num");
      var asc = th.dataset.sorted !== "asc";
      table.querySelectorAll("th").forEach(function (h) { delete h.dataset.sorted; });
      th.dataset.sorted = asc ? "asc" : "desc";

      var rows = Array.prototype.slice.call(tbody.querySelectorAll("tr"));
      rows.sort(function (a, b) {
        var av = (a.children[idx] || {}).textContent || "";
        var bv = (b.children[idx] || {}).textContent || "";
        if (numeric) {
          av = parseFloat(av.replace(/[^0-9.\-]/g, "")) || 0;
          bv = parseFloat(bv.replace(/[^0-9.\-]/g, "")) || 0;
          return asc ? av - bv : bv - av;
        }
        return asc ? av.localeCompare(bv) : bv.localeCompare(av);
      });
      rows.forEach(function (r) { tbody.appendChild(r); });
    });
  });

  /* ---------- Trip form: live capacity validation (rule 5) ----------
     Mirrors the server-side check; the server remains the authority. */
  var vehicleSel = document.getElementById("trip-vehicle");
  var cargoInput = document.getElementById("trip-cargo");
  var warning = document.getElementById("capacity-warning");
  var dispatchBtn = document.getElementById("dispatch-btn");

  function checkCapacity() {
    if (!vehicleSel || !cargoInput || !warning) return;
    var opt = vehicleSel.options[vehicleSel.selectedIndex];
    var capacity = opt ? parseFloat(opt.dataset.capacity) : NaN;
    var cargo = parseFloat(cargoInput.value);
    var over = capacity && cargo && cargo > capacity;
    if (over) {
      var name = opt.dataset.name || "vehicle";
      warning.innerHTML =
        "Vehicle capacity: <strong>" + capacity + " kg</strong> · Cargo weight: " +
        "<strong>" + cargo + " kg</strong><br>❌ Capacity exceeded by " +
        Math.round(cargo - capacity) + " kg — dispatch blocked (" + name + ")";
      warning.hidden = false;
      if (dispatchBtn) dispatchBtn.disabled = true;
    } else {
      warning.hidden = true;
      if (dispatchBtn) dispatchBtn.disabled = false;
    }
  }
  if (vehicleSel) vehicleSel.addEventListener("change", checkCapacity);
  if (cargoInput) cargoInput.addEventListener("input", checkCapacity);
  checkCapacity();

  /* ---------- Auto-dismiss success flashes ---------- */
  document.querySelectorAll(".flash-success").forEach(function (el) {
    setTimeout(function () {
      el.style.transition = "opacity .4s";
      el.style.opacity = "0";
      setTimeout(function () { el.remove(); }, 400);
    }, 4500);
  });
})();
