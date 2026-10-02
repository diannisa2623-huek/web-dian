/* ============================================================
   TEMPEL URL WEB APP GOOGLE APPS SCRIPT DI BAWAH INI
   Contoh: "https://script.google.com/macros/s/AKfycb.../exec"
   Jika dikosongkan, website berjalan dalam MODE DEMO (data lokal).
   ============================================================ */
const WEB_APP_URL = "";

/* ---------- Data kota (nama harus sama dengan di code.gs) ---------- */
const CITIES = [
  { n: "Yogyakarta", e: "🏯", t: "Kota budaya & pelajar", g: ["#f9e1e4", "#ebb4bf"], seed: 42 },
  { n: "Bali", e: "🏝️", t: "Pulau dewata yang memikat", g: ["#fbe8d6", "#efc3a0"], seed: 38 },
  { n: "Bandung", e: "🌸", t: "Kota kembang yang sejuk", g: ["#f6dce8", "#e1a9c4"], seed: 30 },
  { n: "Jakarta", e: "🌆", t: "Metropolitan penuh peluang", g: ["#e8e0ee", "#c4b3d6"], seed: 24 },
  { n: "Surabaya", e: "🦈", t: "Kota pahlawan yang dinamis", g: ["#dfeaee", "#a9c9d4"], seed: 18 },
  { n: "Malang", e: "🍎", t: "Kota apel berhawa sejuk", g: ["#e3eedf", "#b3d2a8"], seed: 16 },
  { n: "Semarang", e: "🏛️", t: "Kota lumpia bernuansa kolonial", g: ["#f3e6d8", "#dbbf9b"], seed: 11 },
  { n: "Makassar", e: "⛵", t: "Gerbang timur Indonesia", g: ["#d9ecf0", "#9ccbd6"], seed: 9 }
];

(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const LS_VOTED = "kotaku_voted", LS_DEMO = "kotaku_demo";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const safeGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const safeSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  let state = { counts: {}, recent: [] };
  let busy = false;

  /* ---------- Toast ---------- */
  let tt;
  function toast(m) {
    const t = $("toast");
    t.textContent = m; t.classList.add("show");
    clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 3200);
  }

  /* ---------- Scroll reveal ---------- */
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((es) => es.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); fillBars(e.target); }
      }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" })
    : null;
  function observe(root) {
    (root || document).querySelectorAll(".rv:not(.in)").forEach((el) => {
      if (io) io.observe(el); else el.classList.add("in");
    });
  }
  function fillBars(el) {
    el.querySelectorAll(".bar i[data-w]").forEach((b) => { b.style.width = b.dataset.w + "%"; });
    if (el.matches && el.matches(".bar i[data-w]")) el.style.width = el.dataset.w + "%";
  }

  /* ---------- Count-up ---------- */
  function countUp(el, to) {
    const from = parseInt(el.dataset.v || "0", 10) || 0;
    el.dataset.v = to;
    if (from === to) { el.textContent = to.toLocaleString("id-ID"); return; }
    const t0 = performance.now(), d = 1100;
    (function step(now) {
      const p = Math.min((now - t0) / d, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * e).toLocaleString("id-ID");
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ---------- Data ---------- */
  function demoData() {
    let local = {};
    try { local = JSON.parse(safeGet(LS_DEMO) || "{}"); } catch (e) {}
    const counts = {}, recent = local.recent || [];
    CITIES.forEach((c) => { counts[c.n] = c.seed + ((local.add || {})[c.n] || 0); });
    return { counts, recent };
  }
  async function load() {
    if (!WEB_APP_URL) { state = demoData(); return render(); }
    try {
      const r = await fetch(WEB_APP_URL + (WEB_APP_URL.includes("?") ? "&" : "?") + "t=" + Date.now());
      const j = await r.json();
      if (!j || !j.ok) throw new Error((j && j.error) || "Respons tidak valid");
      state = { counts: j.counts || {}, recent: j.recent || [] };
    } catch (err) {
      toast("Gagal memuat data spreadsheet. Periksa URL Web App.");
      state = { counts: {}, recent: [] };
    }
    render();
  }

  /* ---------- Render ---------- */
  function gradient(c) { return "background:linear-gradient(160deg," + c.g[0] + "," + c.g[1] + ")"; }
  function renderStatic() {
    $("ovals").innerHTML = CITIES.map((c, i) =>
      '<button class="ov rv" style="--d:' + (i * 0.08) + 's" data-c="' + esc(c.n) + '"><div class="im" style="' + gradient(c) + '">' + c.e + "</div><b>" + esc(c.n) + "</b></button>").join("");
    $("ct").innerHTML = '<option value="">— Pilih kota —</option>' + CITIES.map((c) => '<option value="' + esc(c.n) + '">' + esc(c.n) + "</option>").join("");
    $("ovals").addEventListener("click", (e) => { const b = e.target.closest(".ov"); if (b) pick(b.dataset.c); });
    observe($("ovals"));
  }
  function pick(name) {
    $("ct").value = name;
    $("survei").scrollIntoView({ behavior: "smooth" });
    setTimeout(() => $("nm").focus({ preventScroll: true }), 700);
  }
  function render() {
    const list = CITIES.map((c) => ({ c, v: Number(state.counts[c.n]) || 0 })).sort((a, b) => b.v - a.v);
    const total = list.reduce((s, x) => s + x.v, 0), max = Math.max(1, list[0].v);
    countUp($("total"), total);
    $("leader").textContent = total ? list[0].c.n : "–";
    const g = $("grid"), had = g.children.length > 0;
    g.innerHTML = list.map((x, i) => {
      const pct = total ? Math.round((x.v / total) * 100) : 0;
      return '<div class="pc rv' + (had ? " in" : "") + '" style="--d:' + (i % 4) * 0.1 + 's"><span class="rk">#' + (i + 1) + '</span><div class="em" style="' + gradient(x.c) + '">' + x.c.e + "</div><h4>" + esc(x.c.n) + "</h4><p>" + esc(x.c.t) +
        '</p><div class="vt">' + x.v.toLocaleString("id-ID") + " suara · " + pct + '%</div><div class="bar"><i data-w="' + Math.round((x.v / max) * 100) + '"></i></div><button class="btn" data-c="' + esc(x.c.n) + '">Pilih Kota</button></div>';
    }).join("");
    if (had) requestAnimationFrame(() => requestAnimationFrame(() => fillBars(g)));
    observe(g);
    const r = (state.recent || []).slice(0, 5);
    $("rec").innerHTML = r.length
      ? r.map((x) => '<div class="rc"><b>' + esc(x.name) + "</b> memilih <b>" + esc(x.city) + "</b>" + (x.reason ? "<span>“" + esc(x.reason) + "”</span>" : "") + "</div>").join("")
      : '<p style="color:var(--mut);font-size:14px">Belum ada suara. Jadilah yang pertama!</p>';
  }

  /* ---------- Submit ---------- */
  function msg(t, ok) { const m = $("ms"); m.textContent = t; m.className = "msg " + (ok ? "ok" : "er"); }
  async function submit() {
    if (busy) return;
    const name = $("nm").value.trim(), city = $("ct").value, reason = $("rs").value.trim();
    if (name.length < 2) return msg("Nama minimal 2 karakter.");
    if (!CITIES.some((c) => c.n === city)) return msg("Silakan pilih kota favoritmu.");
    if (safeGet(LS_VOTED)) return msg("Kamu sudah mengisi survei di perangkat ini. Terima kasih!", true);
    busy = true; const btn = $("sb"); btn.disabled = true; btn.textContent = "Mengirim…"; msg("");
    try {
      if (WEB_APP_URL) {
        const r = await fetch(WEB_APP_URL, { method: "POST", body: JSON.stringify({ name, city, reason }) });
        const j = await r.json();
        if (!j.ok) throw new Error(j.error || "Gagal menyimpan");
      } else {
        let l = {}; try { l = JSON.parse(safeGet(LS_DEMO) || "{}"); } catch (e) {}
        l.add = l.add || {}; l.add[city] = (l.add[city] || 0) + 1;
        l.recent = [{ name, city, reason }].concat(l.recent || []).slice(0, 5);
        safeSet(LS_DEMO, JSON.stringify(l));
      }
      safeSet(LS_VOTED, "1");
      $("nm").value = ""; $("ct").value = ""; $("rs").value = "";
      msg("Terima kasih! Suaramu sudah tercatat.", true); toast("Suara berhasil dikirim 🎉");
      await load();
    } catch (err) {
      msg("Gagal mengirim: " + (err.message || "coba lagi nanti") + ".");
    } finally {
      busy = false; btn.disabled = false; btn.textContent = "Kirim Suara";
    }
  }

  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    renderStatic(); observe(); load();
    $("sb").addEventListener("click", submit);
    $("grid").addEventListener("click", (e) => { const b = e.target.closest("button[data-c]"); if (b) pick(b.dataset.c); });
    $("refresh").addEventListener("click", () => { load(); toast("Data diperbarui"); });
    $("bg").addEventListener("click", () => $("nav").classList.toggle("open"));
    $("nav").addEventListener("click", (e) => { if (e.target.tagName === "A") $("nav").classList.remove("open"); });
    const links = [...document.querySelectorAll("nav a")];
    const secs = links.map((a) => document.querySelector(a.getAttribute("href")));
    window.addEventListener("scroll", () => {
      $("hd").classList.toggle("sc", window.scrollY > 10);
      let cur = 0; secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top <= 140) cur = i; });
      links.forEach((a, i) => a.classList.toggle("on", i === cur));
    }, { passive: true });
  });
})();
