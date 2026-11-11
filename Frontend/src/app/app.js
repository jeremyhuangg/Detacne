import { api as API } from "../api";
export async function boot() {
  const $ = (s) => document.querySelector(s), $$ = (s) => Array.from(document.querySelectorAll(s));
  const state = { route: "home", photoUrl: "", photoName: "", analysisTimer: null, user: JSON.parse(localStorage.getItem("detacneUser") || "null"), articleCategory: "Semua", selectedDate: new Date((new Date()).getFullYear(), (new Date()).getMonth(), (new Date()).getDate()), calendarMonth: new Date((new Date()).getFullYear(), (new Date()).getMonth(), 1), tasks: JSON.parse(localStorage.getItem("detacneTasksV2") || "{}"), routines: JSON.parse(localStorage.getItem("detacneRoutinesV2") || "null") || [], reminders: JSON.parse(localStorage.getItem("detacneReminders") || '{"morning":"06:30","night":"20:30","am":true,"pm":true}') };
  let articles = [];
  const BASE_ARTICLES = [];
  const ACNE_COL = { papula: "#d9777f", pustula: "#e6a35c", komedo: "#8f7fb8", nodul: "#b5476b", kista: "#7a4a8c" };
  function renderAcneInfo(r) {
    const box = $("#acneInfo");
    if (!box) return;
    const cnt = r.counts || {}, keys = Object.keys(cnt).filter((k) => Number(cnt[k]) > 0 && ACNE_INFO[k.toLowerCase()]).sort((a, b) => Number(cnt[b]) - Number(cnt[a])), tot = keys.reduce((a, k) => a + Number(cnt[k]), 0), col = (k) => ACNE_COL[k.toLowerCase()] || "#b5476b";
    const head = '<div class="section-head"><div><h2>Jerawat yang terdeteksi</h2><p>Penjelasan singkat tiap jenis jerawat pada hasil ini.</p></div></div>';
    if (!keys.length || !Number(r.total)) {
      box.innerHTML = head + '<div class="ai-none"><div class="ic-wrap"><svg class="ic" aria-hidden="true"><use href="#i-check"/></svg></div><div><b>Tidak ada jerawat terdeteksi</b><p>Pada foto ini tidak ditemukan jerawat. Tetap jaga kebersihan wajah, pakai pelembap dan tabir surya, lalu periksa lagi secara berkala.</p></div></div>';
      return;
    }
    const sev = r.severity || "";
    box.innerHTML = head + `<div class="ai-summary"><div class="ai-sum-top"><div><strong>${Number(r.total)}</strong><span class="lbl">jerawat terdeteksi dari ${keys.length} jenis</span></div><span class="tag ${sevClass(sev)}">${esc(sev)}</span></div><div class="ai-bar" role="img" aria-label="Proporsi jenis jerawat">${keys.map((k) => `<i style="flex:${Number(cnt[k])};--c:${col(k)}"></i>`).join("")}</div><div class="ai-legend">${keys.map((k) => `<span style="--c:${col(k)}"><i class="dot"></i>${esc(ACNE_INFO[k.toLowerCase()].n)} <b>${Number(cnt[k])}</b> (${Math.round(Number(cnt[k]) / tot * 100)}%)</span>`).join("")}</div></div><div class="ai-grid">${keys.map((k) => {
      const i = ACNE_INFO[k.toLowerCase()];
      return `<article class="ai-item" style="--c:${col(k)}"><div class="ai-head"><i class="dot"></i><b>${i.n}</b><span class="ai-count"><strong>${Number(cnt[k])}</strong>terdeteksi</span></div><em>${i.t}</em><p>${i.d}</p><h5>Faktor penyebab</h5><ul>${i.c.map((c) => "<li>" + c + "</li>").join("")}</ul></article>`;
    }).join("")}</div><small class="ai-foot">Info umum, bukan diagnosis.</small>`;
  }
  function paintResult(r, o = {}) {
    renderBahan(r);
    renderAcneInfo(r);
    $("#mockNotice")?.classList.toggle("hidden", true);
    const sv = r.severity === "Perlu dipantau" ? "Berat" : r.severity;
    $$("#sevBar span").forEach((s) => s.classList.toggle("on", s.textContent.toLowerCase() === String(sv).toLowerCase()));
    $("#typeBody").innerHTML = Object.entries(r.counts || {}).map(([k, v]) => `<tr><td>${esc(k.charAt(0).toUpperCase() + k.slice(1))}</td><td style="text-align:right">${Number(v)}</td></tr>`).join("") + `<tr><td><b>Total terdeteksi</b></td><td style="text-align:right"><b>${Number(r.total)}</b></td></tr>`;
    const bx = r.boxes || [];
    $("#resultFace").innerHTML = o.photo ? `<div class="photo-wrap"><img src="${o.photo}" alt="Foto yang dianalisis">${bx.map((b) => `<div class="pbox" style="left:${b.x * 100}%;top:${b.y * 100}%;width:${b.w * 100}%;height:${b.h * 100}%"><span>${esc(b.label)}</span></div>`).join("")}</div>` : faceSVG({ marks: Math.min(r.total, 12), boxes: bx.map((b) => ({ x: b.x * 300, y: b.y * 340, w: b.w * 300, h: b.h * 340, l: b.label, d: 0 })) });
  }
  const curPhoto = () => state.photoFile && state.photoUrl ? state.photoUrl : "";
  function renderResult(r) {
    state.pendingAdd = false;
    if (!r.id) r.id = "e-" + Date.now();
    state.result = r;
    state.histMode = false;
    state.histView = null;
    state.resultThumb = state.photoFile && state.photoUrl ? thumbOf(state.photoUrl) : Promise.resolve("");
    paintResult(r, { photo: curPhoto() });
  }
  const DEMO_HIST = [];
  function demoResult(d) {
    const p = Math.round(d.total * 0.42), u = Math.round(d.total * 0.25);
    return { severity: d.severity, total: d.total, counts: { papula: p, pustula: u, komedo: d.total - p - u }, boxes: DEF_BOXES, created_at: d.ts + "T00:00:00" };
  }
  const RES_SUB = $("#resSub").textContent;
  function updateSaveCard() {
    const sc = $("#saveCard"), r = state.result;
    if (!sc) return;
    if (state.histMode || !r) {
      sc.classList.add("hidden");
      return;
    }
    const g = !state.user, done = !g && state.entries.some((e) => e.id === r.id), ch = state.saveChoice && state.saveChoice.id === r.id ? state.saveChoice.v : "";
    let ti, de, b, ic = "chart";
    if (done) {
      ic = "check";
      ti = "Sudah ditambahkan ke Perkembangan";
      de = "Kamu bisa melihat dan membandingkannya dengan pemeriksaan lain di halaman Perkembangan.";
      b = '<a class="btn btn-primary" href="#/progress">Lihat Perkembangan</a>';
    } else if (ch === "skip") {
      ti = "Tidak ditambahkan";
      de = "Hasil ini tidak disimpan. Berubah pikiran?";
      b = '<button class="btn btn-primary" type="button" data-sv="add">Tambahkan sekarang</button>';
    } else {
      ti = "Tambahkan ke Perkembangan?";
      de = g ? "Simpan hasil ini untuk memantau dan membandingkan kulitmu dari waktu ke waktu. Kamu akan diminta masuk dulu." : "Simpan foto dan hasil ini di browser kamu agar bisa dipantau dan dibandingkan dari waktu ke waktu. Bisa dihapus kapan saja.";
      b = '<button class="btn btn-primary" type="button" data-sv="add">Ya, tambahkan</button><button class="btn btn-outline" type="button" data-sv="skip">Tidak</button>';
    }
    $("#saveIco").innerHTML = icon(ic, 22);
    $("#saveTitle").textContent = ti;
    $("#saveDesc").textContent = de;
    $("#saveBtns").innerHTML = b;
    sc.classList.remove("hidden");
  }
  function renderResultsRoute() {
    const q = new URLSearchParams(state.hashQ || ""), eid = q.get("entry"), did = q.get("demo");
    let h = null;
    if (state.user && eid) {
      const e = state.entries.find((x) => x.id === eid);
      if (!e) {
        toast("Catatan tidak ditemukan.");
        location.replace("#/progress");
        return;
      }
      h = { e, r: { severity: e.severity, total: e.total, counts: e.counts || {}, boxes: e.boxes || DEF_BOXES, created_at: e.ts }, photo: e.photo, sub: "Pemeriksaan tanggal " + fmtD(e.ts, { day: "numeric", month: "long", year: "numeric" }) + "." };
    } else if (state.user && did !== null && DEMO_HIST[+did]) {
      const d = DEMO_HIST[+did];
      h = { e: null, r: demoResult(d), photo: "", sub: "Contoh pemeriksaan tanggal " + fmtD(d.ts + "T00:00:00", { day: "numeric", month: "long", year: "numeric" }) + " (data demo)." };
    }
    state.histMode = !!h;
    state.histView = h ? h.r : null;
    $("#careSections").classList.toggle("hidden", !!h);
    $("#addRoutineLink").classList.toggle("hidden", !!h);
    $("#histNote").classList.toggle("hidden", !(h && h.e));
    if (h) {
      paintResult(h.r, { photo: h.photo });
      $("#resSub").textContent = h.sub;
      if (h.e) $("#histNoteText").value = h.e.note || "";
    } else {
      paintResult(state.result || { severity: "", total: 0, counts: {}, boxes: [] }, { photo: curPhoto() });
      $("#resSub").textContent = RES_SUB;
    }
    updateSaveCard();
    if (state.pendingAdd && state.user && !state.histMode && state.result) {
      state.pendingAdd = false;
      addToProgress();
    }
  }
  async function addToProgress() {
    const r = state.result;
    if (!r || state.saving) return;
    state.saving = true;
    const ok = await recordEntry(r);
    state.saving = false;
    if (ok) {
      API.saveEntry(r.id).catch(() => {
      });
      state.saveChoice = { id: r.id, v: "saved" };
    }
    updateSaveCard();
  }
  $("#saveCard").addEventListener("click", (e) => {
    const b = e.target.closest("[data-sv]");
    if (!b) return;
    const r = state.result;
    if (!r) return;
    if (b.dataset.sv === "skip") {
      state.saveChoice = { id: r.id, v: "skip" };
      updateSaveCard();
      return;
    }
    if (!state.user) {
      state.pendingAdd = true;
      state.next = "results";
      toast("Masuk dulu untuk menambahkan ke Perkembangan.");
      go("login");
      return;
    }
    addToProgress();
  });
  $("#histNoteSave").addEventListener("click", () => {
    const x = state.histMode && new URLSearchParams(state.hashQ || "").get("entry");
    const en = x && state.entries.find((t) => t.id === x);
    if (!en) return;
    en.note = $("#histNoteText").value.trim();
    if (saveEntries()) {
      toast("Catatan disimpan.");
      renderProgress();
    }
  });
  function icon(n, s = 18) {
    return `<svg class="ic" width="${s}" height="${s}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  }
  function bigIcon(n, s) {
    return icon(n, s || 56);
  }
  const MARKS = [[122, 118], [176, 114], [100, 196], [112, 224], [90, 212], [198, 198], [206, 226], [184, 216], [150, 262], [130, 256], [172, 252], [150, 128]];
  const HBOX = [{ x: 104, y: 104, w: 38, h: 32, l: "Papula", d: 1 }, { x: 80, y: 188, w: 48, h: 48, l: "Pustula", d: 2 }, { x: 176, y: 186, w: 46, h: 52, l: "Papula", d: 2.1 }, { x: 116, y: 242, w: 68, h: 30, l: "Komedo", d: 2.7 }];
  const RBOX = HBOX.map((b) => ({ ...b, d: 0 }));
  const DEF_BOXES = HBOX.map((b) => ({ label: b.l, x: b.x / 300, y: b.y / 340, w: b.w / 300, h: b.h / 340, score: 0.9 }));
  function faceSVG({ marks = 0, boxes = [], scan = false } = {}) {
    const m = MARKS.slice(0, Math.min(marks, MARKS.length)).map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 4 : 5}" fill="#c8645f" opacity=".85"/>`).join("");
    const b = boxes.map((q) => `<g class="det" style="animation-delay:${q.d || 0}s"><rect x="${q.x}" y="${q.y}" width="${q.w}" height="${q.h}" rx="5" fill="none" pointer-events="all" stroke="#e0584a" stroke-width="2"/><rect x="${q.x}" y="${q.y - 15}" width="${q.l.length * 6.2 + 10}" height="15" rx="4" fill="#e0584a"/><text x="${q.x + 5}" y="${q.y - 4}" font-size="9.5" font-weight="700" fill="#fff">${q.l}</text></g>`).join("");
    const sc = scan ? '<g class="scanline"><rect x="30" y="-26" width="240" height="26" fill="url(#scanGrad)"/><rect x="30" y="0" width="240" height="3" rx="2" fill="#d9688a"/></g>' : "";
    return `<svg class="face-svg ${scan ? "anim" : ""}" viewBox="0 0 300 340" role="img" aria-label="Ilustrasi wajah"><path d="M40 340q20-40 80-48h60q60 8 80 48z" fill="#ebbdc8"/><rect x="120" y="262" width="60" height="40" fill="#e2a98c"/><ellipse cx="58" cy="178" rx="12" ry="22" fill="#e6ad90"/><ellipse cx="242" cy="178" rx="12" ry="22" fill="#e6ad90"/><ellipse cx="150" cy="165" rx="92" ry="115" fill="#f0c0a2"/><path d="M52 160C40 60 110 20 150 20c50 0 112 42 98 140-18-40-48-65-98-68-50 3-80 28-98 68z" fill="#3f2f2a"/><path d="M96 138q16-8 34-2M170 136q18-6 34 2" stroke="#4a352d" stroke-width="5" stroke-linecap="round" fill="none"/><ellipse cx="113" cy="158" rx="8" ry="5" fill="#3b2a24"/><ellipse cx="187" cy="158" rx="8" ry="5" fill="#3b2a24"/><path d="M150 168q-6 30-12 38 12 6 24 0" stroke="#d49a7e" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M126 238q24 18 48 0" stroke="#a8575a" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="100" cy="208" rx="20" ry="11" fill="#f29b8a" opacity=".35"/><ellipse cx="200" cy="208" rx="20" ry="11" fill="#f29b8a" opacity=".35"/>${m}${b}${sc}</svg>`;
  }
  function fillFaces(r) {
    (r || document).querySelectorAll("[data-face]").forEach((e) => e.innerHTML = faceSVG({ marks: +e.dataset.face }));
  }
  const HOW = `<div class="how"><div class="step"><div class="n">1</div><div><h3>Unggah foto</h3><p>Pilih foto wajah yang jelas, dari depan, dengan cahaya cukup.</p></div></div><div class="step"><div class="n">2</div><div><h3>Foto dianalisis</h3><p>Sistem mencari area jerawat dan mengelompokkannya per jenis.</p></div></div><div class="step"><div class="n">3</div><div><h3>Lihat hasil</h3><p>Tinjau jumlah, tingkat keparahan, dan saran perawatan harian.</p></div></div></div>`;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove("show"), 2600);
  }
  function routeFromHash() {
    let r = location.hash.replace(/^#\/?/, "") || "home";
    state.hashQ = r.split("?")[1] || "";
    r = r.split("?")[0];
    if (!["home", "login", "register", "dashboard", "detect", "loading", "results", "error", "articles", "article", "routine", "progress", "reset"].includes(r)) r = "home";
    if (isAdmin() && r === "articles") {
      location.replace("#/dashboard?tab=artikel");
      return;
    }
    if (isAdmin() && (r === "home" || r === "login" || r === "register")) {
      location.replace("#/dashboard");
      return;
    }
    if ((r === "login" || r === "register") && state.user) r = "dashboard";
    if (!state.user && !["home", "login", "register", "detect", "loading", "results", "error", "reset", "articles", "article"].includes(r)) {
      state.next = r;
      toast("Masuk dulu untuk mengakses fitur ini.");
      location.replace("#/login");
      return;
    }
    if (isAdmin() && !["home", "dashboard", "articles", "article", "reset"].includes(r)) {
      toast("Akun admin hanya mengelola artikel.");
      location.replace("#/dashboard");
      return;
    }
    showRoute(r);
  }
  function go(r) {
    location.hash = "#/" + r;
  }
  function showRoute(r) {
    state.route = r;
    $$(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + r));
    $$(".nav a[data-route]").forEach((a) => a.classList.toggle("active", a.dataset.route === (r === "article" ? "articles" : r)));
    $("#mainNav").classList.remove("open");
    $("#accountLink").textContent = state.user ? "Beranda" : "Masuk";
    updateProfile();
    document.body.classList.toggle("guest", !state.user);
    document.body.classList.toggle("admin", isAdmin());
    $("#accountLink").setAttribute("href", state.user ? "#/dashboard" : "#/login");
    $(".brand").setAttribute("href", isAdmin() ? "#/dashboard" : "#/");
    if (r === "article") renderArticlePage();
    if (r === "dashboard") renderDashboard();
    if (r === "reset") {
      $("#resetFor").textContent = state.resetEmail ? "Akun: " + state.resetEmail : "";
      $("#resetForm").reset();
      $$("#resetForm .form-field").forEach((l) => l.classList.remove("bad"));
    }
    if (r === "articles") {
      state.artAll = false;
      renderArticles();
    }
    if (r === "routine") {
      renderRoutine();
      renderRemindUI();
    }
    if (r === "progress") renderProgress();
    if (r === "results") renderResultsRoute();
    window.scrollTo({ top: 0, behavior: "instant" });
    setTimeout(revealInit, 30);
  }
  window.addEventListener("hashchange", routeFromHash);
  $("#menuToggle").addEventListener("click", () => $("#mainNav").classList.toggle("open"));
  $$("[data-go]").forEach((b) => b.addEventListener("click", () => go(b.dataset.go)));
  const authDone = (res, msg) => {
    state.user = res.user;
    localStorage.setItem("detacneUser", JSON.stringify(res.user));
    if (res.token) localStorage.setItem("detacneToken", res.token);
    toast(msg);
    const nx = state.next || "dashboard";
    state.next = null;
    go(nx);
  };
  $("#loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    API.login({ email: d.get("email"), password: d.get("password") }).then((r) => authDone(r, "Berhasil masuk.")).catch((err) => toast(err.message));
  });
  $("#registerForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    if (!validateRegister(e.currentTarget)) {
      toast("Periksa kembali isian yang ditandai.");
      return;
    }
    API.register({ name: d.get("name").trim().replace(/\s+/g, " "), email: normEmail(d.get("email")), password: d.get("password"), gender: d.get("gender"), birthdate: d.get("birthdate") }).then((r) => authDone(r, "Akun berhasil dibuat.")).catch((err) => toast(err.message));
  });
  const admLog = () => {
    try {
      return JSON.parse(localStorage.getItem("detacneAdminLog") || "[]");
    } catch {
      return [];
    }
  };
  function logAct(m) {
    const l = admLog();
    l.unshift({ t: (new Date()).toISOString(), m });
    try {
      localStorage.setItem("detacneAdminLog", JSON.stringify(l.slice(0, 100)));
    } catch {
    }
  }
  state.adm = { q: "", cat: "Semua", st: "all", sort: "new", page: 1, sel: new Set() };
  const ADM_TABS = [["ringkasan", "Ringkasan", "chart"], ["artikel", "Artikel", "book"], ["aktivitas", "Aktivitas", "cal"]];
  const stTag = (a) => a.status === "draft" ? '<span class="tag warn">Draf</span>' : '<span class="tag">Terbit</span>';
  const fmtT = (t) => fmtD(t, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  function admArticles() {
    const A = state.adm, q = A.q.toLowerCase();
    const L = articles.filter((a) => (A.cat === "Semua" || a.category === A.cat) && (A.st === "all" || a.status === "draft" === (A.st === "draft")) && (a.title + " " + a.category).toLowerCase().includes(q));
    L.sort((x, y) => A.sort === "az" ? x.title.localeCompare(y.title) : A.sort === "old" ? x.date.localeCompare(y.date) : y.date.localeCompare(x.date));
    return L;
  }
  function admOverview() {
    const n = articles.length, d = articles.filter((a) => a.status === "draft").length, f = articles.filter((a) => a.featured).length, cats = ARTICLE_CATS.map((c) => [c, articles.filter((a) => a.category === c).length]), mx = Math.max(1, ...cats.map((x) => x[1])), lg = admLog().slice(0, 5), rec = articles.slice().sort((x, y) => y.date.localeCompare(x.date)).slice(0, 5);
    return `<div class="stats">${[["Total artikel", n], ["Terbit", n - d], ["Draf", d], ["Unggulan", f]].map(([l, v]) => `<div class="stat"><div class="label">${l}</div><strong>${v}</strong></div>`).join("")}</div><div class="dashboard-grid"><div class="card"><div class="panel-title"><h3>Artikel per kategori</h3></div>${cats.map(([c, v]) => `<div class="adm-bar"><span>${esc(c)}</span><div class="progress-line"><span style="width:${v / mx * 100}%"></span></div><b>${v}</b></div>`).join("")}</div><div class="card"><div class="panel-title"><h3>Aktivitas terbaru</h3><button class="rt-btn" data-tab="aktivitas">Lihat semua</button></div>${lg.length ? lg.map((x) => `<div class="adm-log"><span>${esc(x.m)}</span><small>${esc(fmtT(x.t))}</small></div>`).join("") : '<p class="small muted">Belum ada aktivitas.</p>'}</div></div><div class="card" style="margin-top:18px"><div class="panel-title"><h3>Artikel terbaru</h3><button class="rt-btn" data-tab="artikel">Kelola</button></div><div class="result-rows">${rec.map((a) => `<a class="result-row" href="#/article?id=${encodeURIComponent(a.id)}"><div class="rr-main"><span>${esc(a.title)}</span><small>${esc(fmtDate(a.date))}</small></div>${stTag(a)}</a>`).join("")}</div></div>`;
  }
  function admArticlesTab() {
    const A = state.adm;
    return `<div class="adm-tools"><input class="input" id="admQ" type="search" placeholder="Cari judul atau kategori..." value="${esc(A.q)}" aria-label="Cari artikel"><select class="input" id="admSt" aria-label="Status"><option value="all">Semua status</option><option value="published">Terbit</option><option value="draft">Draf</option></select><select class="input" id="admCat" aria-label="Kategori"><option>Semua</option>${ARTICLE_CATS.map((c) => `<option>${esc(c)}</option>`).join("")}</select><select class="input" id="admSort" aria-label="Urutkan"><option value="new">Terbaru</option><option value="old">Terlama</option><option value="az">Judul A-Z</option></select><button class="btn btn-primary" id="adminAddArticle" type="button">${icon("plus", 16)} Artikel baru</button></div><div id="admTable"></div>`;
  }
  function admTable() {
    const A = state.adm, L = admArticles(), per = 8, pages = Math.max(1, Math.ceil(L.length / per));
    A.page = Math.max(1, Math.min(A.page, pages));
    const P = L.slice((A.page - 1) * per, A.page * per), all = P.length && P.every((a) => A.sel.has(a.id));
    $("#admTable").innerHTML = `${A.sel.size ? `<div class="adm-bulk"><b>${A.sel.size} dipilih</b><button class="btn btn-outline" data-bulk="published">Terbitkan</button><button class="btn btn-outline" data-bulk="draft">Jadikan draf</button><button class="btn btn-danger" data-bulk="delete">Hapus</button></div>` : ""}<div class="card table-wrap" style="padding:6px 14px"><table class="history-table"><thead><tr><th><input type="checkbox" data-all ${all ? "checked" : ""} aria-label="Pilih semua"></th><th>Artikel</th><th>Kategori</th><th>Status</th><th>Tanggal</th><th></th></tr></thead><tbody>${P.map((a) => `<tr><td><input type="checkbox" data-sel="${esc(a.id)}" ${A.sel.has(a.id) ? "checked" : ""} aria-label="Pilih artikel"></td><td><a class="adm-title" href="#/article?id=${encodeURIComponent(a.id)}"><img src="${esc(imgFor(a))}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${esc(fbImg(a))}'"><span>${esc(a.title)}</span></a></td><td>${esc(a.category)}</td><td>${stTag(a)}</td><td>${esc(fmtDate(a.date))}</td><td style="white-space:nowrap"><button class="rt-btn" data-edit-article="${esc(a.id)}">Edit</button><button class="rt-btn" data-tog="${esc(a.id)}">${a.status === "draft" ? "Terbitkan" : "Jadikan draf"}</button><button class="rt-btn" data-del data-del-article="${esc(a.id)}">Hapus</button></td></tr>`).join("") || '<tr><td colspan="6" class="empty-state">Tidak ada artikel yang cocok.</td></tr>'}</tbody></table></div><div class="adm-pager"><small>${L.length} artikel</small><div><button class="btn btn-outline" data-pg="-1" ${A.page <= 1 ? "disabled" : ""} aria-label="Sebelumnya">\u2039</button><span>Hal ${A.page} / ${pages}</span><button class="btn btn-outline" data-pg="1" ${A.page >= pages ? "disabled" : ""} aria-label="Berikutnya">\u203A</button></div></div>`;
  }
  function admActivity() {
    const lg = admLog();
    return `<div class="card"><div class="panel-title"><h3>Log aktivitas admin</h3>${lg.length ? '<button class="btn btn-outline" data-clearlog type="button">Hapus log</button>' : ""}</div>${lg.length ? lg.map((x) => `<div class="adm-log"><span>${esc(x.m)}</span><small>${esc(fmtT(x.t))}</small></div>`).join("") : '<p class="small muted">Belum ada aktivitas.</p>'}</div>`;
  }
  function renderAdminDash() {
    const u = state.user, A = state.adm, tab = new URLSearchParams(state.hashQ || "").get("tab") || "ringkasan", T = ADM_TABS.find((x) => x[0] === tab) || ADM_TABS[0];
    $("#admNav").innerHTML = ADM_TABS.map(([k, l, i]) => `<button type="button" data-tab="${k}" class="${k === T[0] ? "on" : ""}">${icon(i, 18)}<span>${l}</span></button>`).join("");
    $("#admTitle").textContent = T[1];
    $("#admUser").innerHTML = `<div><b>${esc(u?.name || "Admin")}</b><small>Administrator</small></div><div class="profile" id="admProfile"><button class="profile-btn" id="admProfileBtn" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="Menu profil"><span>${esc(String(u?.name || "A").trim().split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase() || "A")}</span></button><div class="profile-menu" id="admProfileMenu" role="menu"><div class="profile-head"><strong>${esc(u?.name || "Admin")}</strong><small>${esc(u?.email || "")}</small></div><button type="button" role="menuitem" data-admforgot>Lupa kata sandi</button><button type="button" role="menuitem" class="danger" data-admout>Keluar</button></div></div>`;
    $("#admBody").innerHTML = { ringkasan: admOverview, artikel: admArticlesTab, aktivitas: admActivity }[T[0]]();
    if (T[0] === "artikel") {
      $("#admSt").value = A.st;
      $("#admCat").value = A.cat;
      $("#admSort").value = A.sort;
      admTable();
    }
  }
  function admMenu(o) {
    const m = $("#admProfileMenu"), b = $("#admProfileBtn");
    if (!m) return;
    m.classList.toggle("open", o);
    b.setAttribute("aria-expanded", String(o));
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest("#admProfileBtn")) {
      admMenu(!$("#admProfileMenu").classList.contains("open"));
      return;
    }
    if (e.target.closest("[data-admout]")) {
      admMenu(false);
      $("#logoutBtn").click();
      return;
    }
    if (e.target.closest("[data-admforgot]")) {
      admMenu(false);
      $("#forgotBtn").click();
      return;
    }
    if (!e.target.closest("#admProfile")) admMenu(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") admMenu(false);
  });
  document.addEventListener("click", (e) => {
    if (!isAdmin()) return;
    const A = state.adm;
    const t = e.target.closest("[data-tab]");
    if (t) {
      location.hash = "#/dashboard?tab=" + t.dataset.tab;
      return;
    }
    const tg = e.target.closest("[data-tog]");
    if (tg) {
      const a = articles.find((x) => x.id === tg.dataset.tog);
      if (a) {
        a.status = a.status === "draft" ? "published" : "draft";
        logAct((a.status === "draft" ? "Menjadikan draf: " : "Menerbitkan: ") + a.title);
        saveArticles();
        toast(a.status === "draft" ? "Artikel dijadikan draf." : "Artikel diterbitkan.");
      }
      return;
    }
    const bk = e.target.closest("[data-bulk]");
    if (bk) {
      const ids = [...A.sel], m = bk.dataset.bulk;
      if (m === "delete") {
        if (!confirm("Hapus " + ids.length + " artikel terpilih?")) return;
        ids.forEach((id) => {
          const i = articles.findIndex((x) => x.id === id);
          if (i > -1) articles.splice(i, 1);
        });
        logAct("Menghapus " + ids.length + " artikel");
      } else {
        articles.forEach((a) => {
          if (A.sel.has(a.id)) a.status = m;
        });
        logAct((m === "draft" ? "Menjadikan draf " : "Menerbitkan ") + ids.length + " artikel");
      }
      A.sel.clear();
      saveArticles();
      toast("Aksi massal selesai.");
      return;
    }
    const pg = e.target.closest("[data-pg]");
    if (pg) {
      A.page += Number(pg.dataset.pg);
      admTable();
      return;
    }
    if (e.target.closest("[data-clearlog]") && confirm("Hapus semua log aktivitas?")) {
      localStorage.removeItem("detacneAdminLog");
      renderAdminDash();
    }
  });
  document.addEventListener("change", (e) => {
    if (!isAdmin()) return;
    const A = state.adm, t = e.target;
    if (t.dataset.all !== void 0) {
      admArticles().slice((A.page - 1) * 8, A.page * 8).forEach((a) => t.checked ? A.sel.add(a.id) : A.sel.delete(a.id));
      admTable();
      return;
    }
    if (t.dataset.sel) {
      t.checked ? A.sel.add(t.dataset.sel) : A.sel.delete(t.dataset.sel);
      admTable();
      return;
    }
    if (t.id === "admSt") A.st = t.value;
    else if (t.id === "admCat") A.cat = t.value;
    else if (t.id === "admSort") A.sort = t.value;
    else return;
    A.page = 1;
    admTable();
  });
  document.addEventListener("input", (e) => {
    if (isAdmin() && e.target.id === "admQ") {
      state.adm.q = e.target.value;
      state.adm.page = 1;
      admTable();
    }
  });
  function renderDashboard() {
    const ad = isAdmin();
    $("#userDash").classList.toggle("hidden", ad);
    $("#adminDash").classList.toggle("hidden", !ad);
    if (ad) {
      renderAdminDash();
      return;
    }
    rGlobalStats();
    {
      const E = state.entries || [], A = act(), L = A[A.length - 1];
      $("#dashDate").textContent = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(state.selectedDate);
      $("#dsCount").textContent = E.length;
      $("#dsCountNote").textContent = E.length ? "Tersimpan di browser ini" : "Belum ada pemeriksaan";
      $("#dsSev").textContent = L ? L.severity : "-";
      $("#dsSevDate").textContent = L ? fmtD(L.ts) : "Belum ada data";
      $("#lastTitle").textContent = L ? "Catatan kulit \u2014 " + fmtD(L.ts, { day: "numeric", month: "long", year: "numeric" }) : "Belum ada pemeriksaan";
      $("#lastDesc").textContent = L ? "Total " + L.total + " titik terdeteksi, tingkat " + String(L.severity).toLowerCase() + "." : "Unggah foto pertamamu untuk mulai mencatat.";
      $("#lastBtn").classList.toggle("hidden", !L);
      if (L) $("#lastBtn").dataset.go = "results?entry=" + encodeURIComponent(L.id);
    }
    let name = state.user?.name || "Teman";
    $("#userGreeting").textContent = name;
    const tasks = state.routines.filter((t) => rPeriod(t) === "Pagi" && rOn(t, state.selectedDate)).slice(0, 3);
    $("#dashboardTasks").innerHTML = tasks.map((t) => `<label class="check-row"><input type="checkbox" data-task="${esc(t.id)}" ${taskDone(t.id) ? "checked" : ""}><span class="task">${esc(t.name)}</span><small>${esc(t.time)}</small></label>`).join("") || '<p class="small muted">Belum ada rutinitas. Tambahkan di halaman Rutinitas.</p>';
    $$("#dashboardTasks [data-task]").forEach((c) => c.addEventListener("change", () => setTask(c.dataset.task, c.checked)));
    let done = tasks.filter((t) => taskDone(t.id)).length;
    $("#dashRoutineProgress").style.width = Math.round(done / Math.max(tasks.length, 1) * 100) + "%";
  }
  function taskDone(id) {
    return !!state.tasks[dateKey(state.selectedDate) + "_" + id];
  }
  function isFuture(d) {
    const n = new Date();
    return d > new Date(n.getFullYear(), n.getMonth(), n.getDate(), 23, 59, 59, 999);
  }
  function setTask(id, checked) {
    if (isFuture(state.selectedDate)) {
      toast("Belum bisa dicentang, hari ini belum sampai di tanggal itu.");
      renderRoutine();
      renderDashboard();
      return;
    }
    state.tasks[dateKey(state.selectedDate) + "_" + id] = checked;
    localStorage.setItem("detacneTasksV2", JSON.stringify(state.tasks));
    renderRoutine();
    renderDashboard();
  }
  function dateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }
  const input = $("#photoInput"), preview = $("#uploadPreview"), empty = $("#previewEmpty"), analyze = $("#analyzeBtn"), drop = $("#dropZone");
  $("#choosePhoto").addEventListener("click", () => input.click());
  $("#changePhoto").addEventListener("click", () => input.click());
  $("#useDemoPhoto")?.addEventListener("click", () => {
    clearPhoto();
    state.photoName = "Foto";
    $("#changePhoto").style.display = "inline-flex";
    $("#previewEmpty").innerHTML = '<div style="width:120px;margin:0 auto 10px">' + faceSVG({ marks: 4 }) + "</div><h3>Foto demo dipilih</h3><p>Ilustrasi untuk mencoba alur prototipe.</p>";
    analyze.disabled = false;
    toast("Foto demo siap. Hasilnya tetap simulasi.");
  });
  function clearPhoto() {
    if (state.photoUrl && state.photoUrl.startsWith("blob:")) URL.revokeObjectURL(state.photoUrl);
    state.photoUrl = "";
    state.photoName = "";
    state.photoFile = null;
    preview.classList.remove("show");
    preview.src = "";
    $("#changePhoto").style.display = "none";
    empty.classList.remove("hidden");
    empty.innerHTML = '<div class="upload-ico"><svg class="ic " aria-hidden="true"><use href="#i-up"/></svg></div><h3>Tarik foto ke sini</h3><p>atau pilih foto dari perangkatmu</p><div style="display:flex;gap:9px;flex-wrap:wrap;justify-content:center"><button class="btn btn-primary" type="button" id="choosePhoto">Pilih foto</button><button class="btn btn-outline" type="button" id="takePhoto">Ambil foto</button><button class="btn btn-outline" type="button" id="useDemoPhoto">Gunakan foto demo</button></div><small style="display:block;margin-top:13px;color:var(--muted);font-size:10px">JPG, PNG, atau WEBP \xB7 maksimal 10 MB</small>';
    $("#choosePhoto").addEventListener("click", () => input.click());
    $("#useDemoPhoto")?.addEventListener("click", () => {
      state.photoName = "Foto";
      empty.innerHTML = '<div style="width:120px;margin:0 auto 10px">' + faceSVG({ marks: 4 }) + "</div><h3>Foto demo dipilih</h3><p>Ilustrasi untuk mencoba alur prototipe.</p>";
      analyze.disabled = false;
    });
    analyze.disabled = true;
  }
  function acceptFile(file) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast("Format belum didukung. Gunakan JPG, PNG, atau WEBP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast("Ukuran foto melebihi 10 MB.");
      return;
    }
    if (state.photoUrl && state.photoUrl.startsWith("blob:")) URL.revokeObjectURL(state.photoUrl);
    state.photoUrl = URL.createObjectURL(file);
    state.photoName = file.name;
    state.photoFile = file;
    preview.src = state.photoUrl;
    preview.classList.add("show");
    $("#changePhoto").style.display = "inline-flex";
    empty.classList.add("hidden");
    analyze.disabled = false;
    toast("Foto siap digunakan untuk demo.");
  }
  input.addEventListener("change", (e) => acceptFile(e.target.files[0]));
  ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.add("dragover");
  }));
  ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.remove("dragover");
  }));
  drop.addEventListener("drop", (e) => acceptFile(e.dataTransfer.files[0]));
  $("#analyzeBtn").addEventListener("click", () => {
    if (!state.photoName) {
      toast("Pilih foto atau foto demo terlebih dahulu.");
      return;
    }
    go("loading");
    let p = 0, done = false;
    const msgs = ["Memeriksa kualitas foto", "Mencari area jerawat", "Menyusun rekomendasi"], run = state.analysisRun = Date.now();
    $("#loadPct").textContent = 0;
    $("#loadBar").style.width = "0%";
    clearInterval(state.analysisTimer);
    state.analysisTimer = setInterval(() => {
      p = done ? Math.min(100, p + 10) : Math.min(92, p + 3);
      $("#loadPct").textContent = p;
      $("#loadBar").style.width = p + "%";
      $("#loadStatus").textContent = msgs[Math.min(2, Math.floor(p / 34))];
      if (p >= 100) {
        clearInterval(state.analysisTimer);
        if (state.route === "loading") {
          renderResult(state.pending);
          go("results");
        }
      }
    }, 105);
    API.detect(state.photoFile).then((res) => {
      if (state.analysisRun !== run) return;
      state.pending = res;
      done = true;
    }).catch((err) => {
      if (state.analysisRun !== run) return;
      clearInterval(state.analysisTimer);
      toast(err.message || "Foto tidak dapat diproses.");
      go("error");
    });
  });
  $("#cancelAnalysis").addEventListener("click", () => {
    state.analysisRun = null;
    clearTimeout(state.analysisTimer);
    go("detect");
  });
  $("#simulateError")?.addEventListener("click", () => go("error"));
  $("#downloadReport").addEventListener("click", () => {
    const r = state.histView || state.result || { severity: "Ringan", total: 12, counts: { papula: 5, pustula: 3, komedo: 4 } };
    downloadFile("detacne-ringkasan.txt", "DETACNE - Ringkasan hasil\nTanggal: " + new Date(r.created_at || Date.now()).toLocaleDateString("id-ID") + "\nTingkat keparahan: " + r.severity + "\nTotal terdeteksi: " + r.total + "\n" + Object.entries(r.counts).map(([k, v]) => k + ": " + v).join("\n"));
  });
  function renderArticles() {
    renderLayout();
    const q = ($("#articleSearch")?.value || "").toLowerCase();
    let items = articles.filter((a) => a.status !== "draft" && (state.articleCategory === "Semua" || a.category === state.articleCategory) && `${a.title} ${a.desc} ${a.category}`.toLowerCase().includes(q));
    const totalArt = items.length;
    if (!state.artAll) items = items.slice(0, 6);
    const mb = $("#moreArticles");
    mb.classList.toggle("hidden", totalArt <= 6);
    mb.textContent = state.artAll ? "Tampilkan lebih sedikit" : "Lebih lanjut";
    $("#articleCards").innerHTML = items.map((a) => `<article class="article-card"><div class="article-art"></div><div class="article-text"><span class="tag">${esc(a.category)}</span><h3>${esc(a.title)}</h3><p>${esc(a.desc)}</p><div class="article-meta">${a.read} baca \xB7 ${a.custom ? "Artikel DETACNE" : "Artikel"}</div><button class="btn btn-ghost" data-article="${esc(a.id)}">Baca artikel</button></div></article>`).join("") || '<div class="empty-state">Tidak ada artikel yang cocok. Coba kata kunci lain.</div>';
    $$("#articleFilters .chip").forEach((b) => b.classList.toggle("active", b.dataset.category === state.articleCategory));
    $$("[data-article]").forEach((b) => b.onclick = () => {
      location.hash = "#/article?id=" + encodeURIComponent(b.dataset.article);
    });
    decorateArticles();
  }
  $("#articleSearch").addEventListener("input", renderArticles);
  $("#moreArticles").addEventListener("click", () => {
    state.artAll = !state.artAll;
    renderArticles();
    if (!state.artAll) $("#articleCards").scrollIntoView({ behavior: "smooth", block: "center" });
  });
  $("#articleFilters").addEventListener("click", (e) => {
    const b = e.target.closest("[data-category]");
    if (!b) return;
    state.articleCategory = b.dataset.category;
    renderArticles();
  });
  function renderArticlePage() {
    const id = new URLSearchParams(state.hashQ).get("id") || "", a = articles.find((x) => x.id === id && (x.status !== "draft" || isAdmin())), box = $("#articlePage");
    const top = `<div class="art-top"><a class="btn btn-outline btn-plus" href="${isAdmin() ? "#/dashboard?tab=artikel" : "#/articles"}" aria-label="Kembali ke artikel" title="Kembali ke artikel"><svg class="ic" aria-hidden="true"><use href="#i-back"/></svg></a>${a && isAdmin() ? `<button class="btn btn-primary" type="button" data-edit-article="${esc(a.id)}"><svg class="ic" aria-hidden="true"><use href="#i-pen"/></svg> Edit artikel</button>` : ""}</div>`;
    if (!a) {
      box.innerHTML = top + '<div class="empty-state">Artikel tidak ditemukan.</div>';
      return;
    }
    const body = a.body ? a.body.split(/\n\s*\n/).map((x) => `<p>${esc(x)}</p>`).join("") : `<p>Mulailah dari informasi umum yang sederhana dan perhatikan bagaimana kulitmu merespons. Hindari mengikuti banyak tren perawatan sekaligus, dan hentikan pemakaian produk yang menimbulkan iritasi.</p><p>Konten ini merupakan contoh materi di website dummy. Untuk keluhan yang menetap atau memburuk, konsultasikan dengan tenaga kesehatan yang sesuai.</p>`;
    box.innerHTML = top + `<div class="art-grid"><img class="cover" src="${esc(imgFor(a))}" alt="" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${esc(fbImg(a))}'"><div class="art-main"><span class="tag">${esc(a.category)}</span><h1>${esc(a.title)}</h1><div class="meta">${esc(fmtDate(a.date))} \xB7 ${esc(a.read)} baca \xB7 ${metaLabel(a)}</div><div class="art-body"><p>${esc(a.desc)}</p>${body}</div><div class="notice" style="margin-top:22px"><svg class="ic" aria-hidden="true"><use href="#i-info"/></svg><span>${metaLabel(a)} \xB7 ${esc(a.read)} baca</span></div></div></div>`;
  }
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  function renderCalendar() {
    const m = state.calendarMonth;
    $("#calendarTitle").textContent = months[m.getMonth()] + " " + m.getFullYear();
    const first = new Date(m.getFullYear(), m.getMonth(), 1).getDay(), last = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate(), prevLast = new Date(m.getFullYear(), m.getMonth(), 0).getDate();
    let html = days.map((d) => `<div class="day-name">${d}</div>`).join("");
    for (let i = 0; i < 42; i++) {
      let day, date, muted = false;
      if (i < first) {
        day = prevLast - first + i + 1;
        date = new Date(m.getFullYear(), m.getMonth() - 1, day);
        muted = true;
      } else if (i >= first + last) {
        day = i - first - last + 1;
        date = new Date(m.getFullYear(), m.getMonth() + 1, day);
        muted = true;
      } else {
        day = i - first + 1;
        date = new Date(m.getFullYear(), m.getMonth(), day);
      }
      let sel = dateKey(date) === dateKey(state.selectedDate);
      let has = Object.keys(state.tasks).some((k) => k.startsWith(dateKey(date) + "_") && state.tasks[k]) || state.routines.some((t) => t.dates && t.dates.includes(dateKey(date)));
      html += `<div class="date ${muted ? "muted-date" : ""} ${sel ? "selected" : ""} ${has ? "has-dot" : ""} ${dateKey(date) === dateKey(new Date()) ? "today" : ""}" data-date="${dateKey(date)}">${day}</div>`;
    }
    $("#calendarGrid").innerHTML = html;
    $$("#calendarGrid [data-date]").forEach((d) => d.onclick = () => {
      const [y, mn, da] = d.dataset.date.split("-").map(Number);
      state.selectedDate = new Date(y, mn - 1, da);
      state.calendarMonth = new Date(y, mn - 1, 1);
      renderRoutine();
    });
  }
  function renderRoutine() {
    renderCalendar();
    $("#selectedDateLabel").textContent = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(state.selectedDate);
    const relevant = state.routines.filter((t) => rOn(t, state.selectedDate));
    let done = relevant.filter((t) => taskDone(t.id)).length;
    $("#taskCountTag").textContent = `${done} dari ${relevant.length}`;
    {
      const pb = $("#taskProgBar");
      if (pb) pb.style.width = (relevant.length ? Math.round(done / relevant.length * 100) : 0) + "%";
    }
    let html = "";
    for (const period of ["Pagi", "Malam"]) {
      const tasks = relevant.filter((t) => rPeriod(t) === period);
      if (!tasks.length) continue;
      html += `<div class="routine-section"><div class="routine-section-title"><svg class="ic" aria-hidden="true"><use href="#i-${period === "Pagi" ? "sun" : "moon"}"/></svg><b>${period}</b><em>${tasks.filter((t) => taskDone(t.id)).length}/${tasks.length}</em></div>` + tasks.map((t) => `<label class="routine-task"><input class="task-check" data-task="${esc(t.id)}" type="checkbox" ${taskDone(t.id) ? "checked" : ""}><div class="task-detail"><strong style="${taskDone(t.id) ? "text-decoration:line-through;color:var(--muted)" : ""}">${esc(t.name)}</strong><small>${rDaysLabel(t)} \xB7 ${rLeadLabel(t)}</small></div><span class="task-time">${esc(t.time)}</span><button type="button" class="rt-btn" data-edit="${esc(t.id)}" aria-label="Ubah rutinitas">Ubah</button><button type="button" class="rt-btn" data-del="${esc(t.id)}" aria-label="Hapus rutinitas">Hapus</button></label>`).join("") + "</div>";
    }
    const emp = !state.routines.length;
    if (!html) html = '<div class="empty-state">' + (emp ? 'Belum ada rutinitas. Klik "+ Tambah rutinitas" untuk mulai.' : "Tidak ada rutinitas pada hari ini.") + "</div>";
    $("#clearRoutines").classList.toggle("hidden", !relevant.length);
    $("#routineTaskList").innerHTML = html;
    $$("#routineTaskList [data-task]").forEach((c) => c.addEventListener("change", () => setTask(c.dataset.task, c.checked)));
    rStatsUI();
  }
  function rDayInfo(d) {
    const k = dateKey(d), L = state.routines.filter((t) => rOn(t, d));
    return { n: L.length, done: L.filter((t) => state.tasks[k + "_" + t.id]).length };
  }
  function rStats(m) {
    const now = new Date(), t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()), last = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    let sched = 0, done = 0, dayAll = 0, dayFull = 0, missed = 0;
    for (let i = 1; i <= last; i++) {
      const d = new Date(m.getFullYear(), m.getMonth(), i);
      if (d > t0) break;
      const x = rDayInfo(d);
      if (!x.n) continue;
      sched += x.n;
      done += x.done;
      dayAll++;
      if (x.done === x.n) dayFull++;
      else if (d < t0) missed++;
    }
    let streak = 0;
    for (let i = 0; i < 400; i++) {
      const d = new Date(t0.getFullYear(), t0.getMonth(), t0.getDate() - i), x = rDayInfo(d);
      if (!x.n) continue;
      if (x.done === x.n) streak++;
      else if (i === 0) continue;
      else break;
    }
    return { dayAll, dayFull, missed, streak, pct: sched ? Math.round(done / sched * 100) : 0 };
  }
  function rStatsUI() {
    const s = rStats(state.calendarMonth);
    $("#consistencyPercent").textContent = s.pct + "%";
    $("#consistencyBar").style.width = s.pct + "%";
    $("#consistencyNote").textContent = s.dayAll ? s.dayFull + " dari " + s.dayAll + " hari terpenuhi" : "Belum ada data";
    $("#streakNumber").textContent = s.streak + " hari";
    $("#missedDays").textContent = s.missed;
  }
  function rGlobalStats() {
    const n = new Date(), s = rStats(new Date(n.getFullYear(), n.getMonth(), 1)), note = s.dayAll ? s.dayFull + " dari " + s.dayAll + " hari" : "Belum ada data";
    [["dashPct", s.pct + "%"], ["dashPctNote", note], ["dashStreak", s.streak], ["pgPct", s.pct + "%"], ["pgPctNote", note]].forEach(([i, v]) => {
      const e = document.getElementById(i);
      if (e) e.textContent = v;
    });
  }
  $("#prevMonth").addEventListener("click", () => {
    state.calendarMonth = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth() - 1, 1);
    renderCalendar();
    rStatsUI();
  });
  $("#nextMonth").addEventListener("click", () => {
    state.calendarMonth = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth() + 1, 1);
    renderCalendar();
    rStatsUI();
  });
  function rDays(t) {
    return t.days || [0, 1, 2, 3, 4, 5, 6];
  }
  function rLead(t) {
    return t.lead === void 0 ? 10 : t.lead;
  }
  function rDaysLabel(t) {
    if (t.dates) {
      const n = t.dates.length;
      return n <= 3 ? t.dates.map((x) => {
        const q = x.split("-").map(Number);
        return q[2] + " " + months[q[1] - 1].slice(0, 3);
      }).join(", ") : n + " tanggal dipilih";
    }
    const d = rDays(t);
    return d.length === 7 ? "Setiap hari" : [1, 2, 3, 4, 5, 6, 0].filter((i) => d.includes(i)).map((i) => days[i]).join(", ");
  }
  function rLeadLabel(t) {
    return rLead(t) ? "ingatkan " + rLead(t) + " menit sebelumnya" : "ingatkan tepat waktu";
  }
  function rOn(t, date) {
    if ((t.skip || []).includes(dateKey(date))) return false;
    return t.dates ? t.dates.includes(dateKey(date)) : rDays(t).includes(date.getDay());
  }
  function rOcc(r) {
    const q = r.time.split(":").map(Number);
    return r.dates.map((x) => {
      const a = x.split("-").map(Number);
      return new Date(a[0], a[1] - 1, a[2], q[0], q[1]);
    }).sort((a, b) => a - b);
  }
  function rRecur(r) {
    return r.dates ? "" : "RRULE:" + rRule(r);
  }
  let rPick = { sel: new Set(), month: new Date() };
  function rPickDraw() {
    const g = $("#pickGrid");
    if (!g) return;
    const m = rPick.month, first = new Date(m.getFullYear(), m.getMonth(), 1).getDay(), last = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate(), now = new Date(), t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    $("#pickTitle").textContent = months[m.getMonth()] + " " + m.getFullYear();
    let h = days.map((n) => `<div class="day-name">${n}</div>`).join("");
    for (let i = 0; i < first; i++) h += "<div></div>";
    for (let n = 1; n <= last; n++) {
      const dt = new Date(m.getFullYear(), m.getMonth(), n), k = dateKey(dt), on = rPick.sel.has(k), past = dt < t0 && !on;
      h += `<div class="date ${past ? "muted-date" : ""} ${on ? "selected" : ""}" data-pd="${past ? "" : k}">${n}</div>`;
    }
    g.innerHTML = h;
    $("#pickCount").textContent = rPick.sel.size ? rPick.sel.size + " tanggal dipilih" : "Belum ada tanggal dipilih";
  }
  function rWirePicker(r) {
    const ds = r && r.dates || [], b = ds.length ? ds[0].split("-").map(Number) : null, now = new Date();
    rPick = { sel: new Set(ds), month: b ? new Date(b[0], b[1] - 1, 1) : new Date(now.getFullYear(), now.getMonth(), 1) };
    const form = $("#routineForm"), sw = () => {
      const t = form.querySelector("input[name=mode]:checked").value === "tanggal";
      $("#modeHari").classList.toggle("hidden", t);
      $("#modeTanggal").classList.toggle("hidden", !t);
    };
    form.querySelectorAll("input[name=mode]").forEach((x) => x.addEventListener("change", sw));
    sw();
    $("#pickPrev").addEventListener("click", () => {
      rPick.month = new Date(rPick.month.getFullYear(), rPick.month.getMonth() - 1, 1);
      rPickDraw();
    });
    $("#pickNext").addEventListener("click", () => {
      rPick.month = new Date(rPick.month.getFullYear(), rPick.month.getMonth() + 1, 1);
      rPickDraw();
    });
    $("#pickGrid").addEventListener("click", (e) => {
      const c = e.target.closest("[data-pd]");
      if (!c || !c.dataset.pd) return;
      const k = c.dataset.pd;
      if (rPick.sel.has(k)) rPick.sel.delete(k);
      else rPick.sel.add(k);
      rPickDraw();
    });
    rPickDraw();
  }
  function rGcalList(r) {
    const now = new Date();
    let L = rOcc(r).filter((d) => d > now);
    if (!L.length) L = rOcc(r);
    const fm = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long" });
    openModal("Tambahkan ke Google Calendar", '<p class="small">Rutinitas sudah tersimpan. Klik tiap tanggal di bawah, nanti Google Calendar terbuka dengan jadwal yang sudah terisi, tinggal klik Simpan.</p><div id="gcalList">' + L.map((d, i) => `<div class="routine-task"><div class="task-detail"><strong>${esc(fm.format(d))}</strong><small>${esc(r.time)} \xB7 ${esc(r.name)}</small></div><button type="button" class="btn btn-outline" data-gcal-i="${i}">Buka</button></div>`).join("") + "</div>");
    $("#gcalList").addEventListener("click", (e) => {
      const b = e.target.closest("[data-gcal-i]");
      if (!b) return;
      const gw = window.open(rGcalUrl(r, L[Number(b.dataset.gcalI)]), "_blank");
      if (gw) {
        gw.opener = null;
        b.textContent = "Sudah dibuka";
        b.classList.replace("btn-outline", "btn-soft");
      } else toast("Popup diblokir. Izinkan popup untuk membuka Google Calendar.");
    });
  }
  function rOpenForm(title, r) {
    openModal(title, rFormHtml(r));
    rWirePicker(r);
  }
  function rSave() {
    state.routines.sort((a, b) => a.time.localeCompare(b.time));
    localStorage.setItem("detacneRoutinesV2", JSON.stringify(state.routines));
  }
  function rPeriod(t) {
    return (parseInt(String(t.time).slice(0, 2), 10) || 0) < 12 ? "Pagi" : "Malam";
  }
  function rFormHtml(r) {
    const x = r || { id: "", name: "", time: "07:00", days: [0, 1, 2, 3, 4, 5, 6], lead: 10 };
    const d = rDays(x);
    return `<form id="routineForm" data-id="${esc(x.id)}"><label class="form-field"><span>Nama rutinitas</span><input class="input" name="name" value="${esc(x.name)}" placeholder="Contoh: pakai pelembap" required /></label><div class="toolbar"><label class="form-field" style="flex:1"><span>Waktu</span><input class="input" type="time" name="time" value="${esc(x.time)}" required /></label></div><div class="form-field"><span>Kapan dilakukan?</span><div class="day-pick"><label><input type="radio" name="mode" value="hari" ${x.dates ? "" : "checked"}>Setiap minggu</label><label><input type="radio" name="mode" value="tanggal" ${x.dates ? "checked" : ""}>Pilih tanggal sendiri</label></div></div><div class="form-field" id="modeHari"><span>Ulangi pada hari</span><div class="day-pick">${[1, 2, 3, 4, 5, 6, 0].map((i) => `<label><input type="checkbox" name="day" value="${i}" ${d.includes(i) ? "checked" : ""}>${days[i]}</label>`).join("")}</div></div><div class="form-field" id="modeTanggal"><span>Pilih tanggal</span><div class="calendar-head"><button type="button" class="btn btn-outline" id="pickPrev" aria-label="Bulan sebelumnya">\u2039</button><strong id="pickTitle"></strong><button type="button" class="btn btn-outline" id="pickNext" aria-label="Bulan berikutnya">\u203A</button></div><div class="calendar-grid" id="pickGrid"></div><p class="small" id="pickCount" style="margin:8px 0 0"></p></div><label class="form-field"><span>Ingatkan sebelum waktunya</span><select class="input" name="lead">${[0, 5, 10, 15, 30, 60].map((m) => `<option value="${m}" ${rLead(x) === m ? "selected" : ""}>${m ? m + " menit sebelumnya" : "Tepat waktu"}</option>`).join("")}</select></label><button class="btn btn-primary" style="width:100%" type="submit">Simpan rutinitas</button></form>`;
  }
  $("#addRoutineBtn").addEventListener("click", () => rOpenForm("Tambah rutinitas"));
  $("#clearRoutines").addEventListener("click", () => {
    const dk = dateKey(state.selectedDate), lbl = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(state.selectedDate), list = state.routines.filter((t) => rOn(t, state.selectedDate));
    if (!list.length) return;
    if (confirm("Hapus semua rutinitas (" + list.length + ") hanya untuk " + lbl + "? Hari lainnya tidak terpengaruh.")) {
      list.forEach((r) => {
        if (r.dates) r.dates = r.dates.filter((x) => x !== dk);
        else r.skip = [...new Set([...r.skip || [], dk])];
        delete state.tasks[dk + "_" + r.id];
      });
      state.routines = state.routines.filter((t) => !t.dates || t.dates.length);
      localStorage.setItem("detacneTasksV2", JSON.stringify(state.tasks));
      rSave();
      renderRoutine();
      renderDashboard();
      toast("Semua rutinitas hari ini dihapus.");
    }
  });
  document.addEventListener("submit", (e) => {
    if (e.target.id !== "routineForm") return;
    e.preventDefault();
    const f = new FormData(e.target), id = e.target.dataset.id, dd = f.getAll("day").map(Number), byDate = f.get("mode") === "tanggal", dts = [...rPick.sel].sort();
    if (byDate ? !dts.length : !dd.length) {
      toast(byDate ? "Pilih minimal satu tanggal." : "Pilih minimal satu hari.");
      return;
    }
    const r = { id: id || "custom-" + Date.now(), name: String(f.get("name")).trim(), time: f.get("time"), days: byDate ? [0, 1, 2, 3, 4, 5, 6] : dd, lead: Number(f.get("lead")) };
    if (byDate) r.dates = dts;
    const old = state.routines.find((t) => t.id === id);
    if (old && old.skip && !byDate) r.skip = old.skip;
    const i = state.routines.findIndex((t) => t.id === id);
    if (i > -1) state.routines[i] = r;
    else state.routines.push(r);
    if (byDate) {
      const q = dts[0].split("-").map(Number);
      state.selectedDate = new Date(q[0], q[1] - 1, q[2]);
      state.calendarMonth = new Date(q[0], q[1] - 1, 1);
    }
    rSave();
    closeModal();
    renderRoutine();
    checkReminders();
    toast(id ? "Rutinitas diperbarui." : "Rutinitas baru ditambahkan.");
  });
  $("#routineTaskList").addEventListener("click", (e) => {
    const b = e.target.closest("[data-edit],[data-del]");
    if (!b) return;
    e.preventDefault();
    const id = b.dataset.edit || b.dataset.del, r = state.routines.find((t) => t.id === id);
    if (!r) return;
    if (b.dataset.edit) rOpenForm("Ubah rutinitas", r);
    else {
      const dk = dateKey(state.selectedDate), lbl = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(state.selectedDate);
      if (confirm('Hapus "' + r.name + '" hanya untuk ' + lbl + "? Hari lainnya tidak terpengaruh.")) {
        if (r.dates) {
          r.dates = r.dates.filter((x) => x !== dk);
          if (!r.dates.length) state.routines = state.routines.filter((t) => t.id !== id);
        } else {
          r.skip = [...new Set([...r.skip || [], dk])];
        }
        delete state.tasks[dk + "_" + id];
        localStorage.setItem("detacneTasksV2", JSON.stringify(state.tasks));
        rSave();
        renderRoutine();
        renderDashboard();
        toast("Rutinitas dihapus untuk hari ini saja.");
      }
    }
  });
  function rZone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta";
  }
  function rRule(r) {
    return rDays(r).length === 7 ? "FREQ=DAILY" : "FREQ=WEEKLY;BYDAY=" + rDays(r).map((i) => ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][i]).join(",");
  }
  function rNextStart(r) {
    const [h, m] = r.time.split(":").map(Number), n = new Date();
    if (r.dates) {
      const L = rOcc(r);
      return L.find((d) => d > n) || L[0];
    }
    for (let i = 0; i < 8; i++) {
      const d = new Date(n.getFullYear(), n.getMonth(), n.getDate() + i, h, m);
      if (d > n && rDays(r).includes(d.getDay())) return d;
    }
    return new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, h, m);
  }
  function rFmt(d) {
    const p = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "T" + p(d.getHours()) + p(d.getMinutes()) + "00";
  }
  function rGcalUrl(r, st) {
    const s = st || rNextStart(r), e = new Date(s.getTime() + 6e5), rc = rRecur(r);
    return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent("DETACNE: " + r.name) + "&details=" + encodeURIComponent("Rutinitas perawatan kulit dari DETACNE. Ingatkan " + (rLead(r) ? rLead(r) + " menit sebelumnya." : "tepat waktu.")) + "&dates=" + rFmt(s) + "/" + rFmt(e) + "&ctz=" + encodeURIComponent(rZone()) + (rc ? "&recur=" + encodeURIComponent(rc) : "");
  }
  try {
    state.entries = JSON.parse(localStorage.getItem("detacneEntries") || "[]");
  } catch {
    state.entries = [];
  }
  const pgIds = ["pgCountLabel", "pgCount", "pgCountTrend", "pgSev", "pgSevTrend", "pgLast", "pgLastYear", "pgChartTitle", "pgChartSub", "pgNotice", "pgHistSub"], pgOrig = {};
  pgIds.forEach((i) => pgOrig[i] = $("#" + i).textContent);
  function fmtD(ts, o) {
    return new Intl.DateTimeFormat("id-ID", o || { day: "numeric", month: "short", year: "numeric" }).format(new Date(ts));
  }
  function sevClass(s) {
    return s === "Ringan" ? "" : s === "Sedang" ? "warn" : "coral";
  }
  function saveEntries() {
    try {
      localStorage.setItem("detacneEntries", JSON.stringify(state.entries));
      return true;
    } catch {
      toast("Penyimpanan browser penuh. Hapus beberapa catatan lama.");
      return false;
    }
  }
  function thumbOf(url) {
    return new Promise((res) => {
      const im = new Image();
      im.onload = () => {
        const s = Math.min(1, 480 / Math.max(im.width, im.height)), c = document.createElement("canvas");
        c.width = Math.round(im.width * s);
        c.height = Math.round(im.height * s);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        res(c.toDataURL("image/jpeg", 0.72));
      };
      im.onerror = () => res("");
      im.src = url;
    });
  }
  async function recordEntry(r) {
    if (!r) return false;
    const id = r.id || "e-" + Date.now();
    if (state.entries.some((e) => e.id === id)) return true;
    const photo = await (state.resultThumb || Promise.resolve(""));
    if (state.entries.some((e) => e.id === id)) return true;
    state.entries.push({ id, ts: r.created_at || (new Date()).toISOString(), total: r.total, severity: r.severity, counts: r.counts, boxes: r.boxes || null, photo, note: "" });
    state.entries.sort((a, b) => a.ts.localeCompare(b.ts));
    if (!saveEntries()) {
      state.entries = state.entries.filter((e) => e.id !== id);
      return false;
    }
    toast("Hasil ditambahkan ke Perkembangan.");
    renderProgress();
    return true;
  }
  function act() {
    return state.entries.filter((e) => e.use !== false);
  }
  function renderProgress() {
    rGlobalStats();
    const E = state.entries, A = act(), real = E.length > 0;
    pgIds.forEach((i) => $("#" + i).textContent = pgOrig[i]);
    $("#clearEntries").classList.toggle("hidden", !real);
    if (real) {
      $("#pgCountLabel").textContent = "Jumlah jerawat";
      $("#pgChartTitle").textContent = "Jumlah jerawat";
      $("#pgChartSub").textContent = A.length + " dari " + E.length + " pemeriksaan dipakai.";
      $("#pgHistSub").textContent = 'Aktifkan "Dipakai" untuk memilih pemeriksaan yang masuk ke statistik dan grafik.';
      $("#pgNotice").textContent = false ? "Foto dan tanggal adalah milikmu. Jumlah dan jenis jerawat masih hasil simulasi karena model ML belum terhubung, jadi belum mencerminkan kondisi kulitmu." : "Hasil ini bukan diagnosis medis. Konsultasikan ke dokter kulit bila perlu.";
      if (A.length) {
        const L = A[A.length - 1], P = A[A.length - 2], d = P ? L.total - P.total : 0;
        $("#pgCount").textContent = L.total;
        $("#pgCountTrend").textContent = P ? d === 0 ? "Sama seperti pemeriksaan sebelumnya" : (d < 0 ? "Turun " : "Naik ") + Math.abs(d) + " dari pemeriksaan sebelumnya" : "Pemeriksaan pertama";
        $("#pgSev").textContent = L.severity;
        $("#pgSevTrend").textContent = "Bukan diagnosis";
        $("#pgLast").textContent = fmtD(L.ts, { day: "numeric", month: "short" });
        $("#pgLastYear").textContent = new Date(L.ts).getFullYear();
      } else {
        $("#pgCount").textContent = "-";
        $("#pgCountTrend").textContent = "Belum ada pemeriksaan yang dipakai";
        $("#pgSev").textContent = "-";
        $("#pgSevTrend").textContent = "";
        $("#pgLast").textContent = "-";
        $("#pgLastYear").textContent = "";
      }
    }
    renderHistory();
    renderChart();
  }
  const HIST_STEP = 3, SEV_COL = { Ringan: "#7fc8a0", Sedang: "#e6a35c" };
  function histCard(it) {
    const dl = it.delta, dh = dl === null ? '<span class="hi-delta">Pemeriksaan pertama</span>' : dl === 0 ? '<span class="hi-delta">Sama seperti sebelumnya</span>' : `<span class="hi-delta ${dl < 0 ? "down" : "up"}">${dl < 0 ? "\u25BC Turun " : "\u25B2 Naik "}${Math.abs(dl)} dari sebelumnya</span>`, cap = (k) => k.charAt(0).toUpperCase() + k.slice(1), chips = Object.entries(it.counts).filter(([, v]) => Number(v) > 0).map(([c, v]) => `<span class="hi-chip"><i class="dot d-${esc(c.toLowerCase())}"></i>${esc(cap(c))} <b>${Number(v)}</b></span>`).join("") || '<span class="hi-chip">Tidak ada jerawat terdeteksi</span>', tm = it.real && /T\d\d:\d\d/.test(it.ts) && !/T00:00:00/.test(it.ts) ? `<span class="hi-time">pukul ${esc(fmtD(it.ts, { hour: "2-digit", minute: "2-digit" }))}</span>` : "", ph = it.photo ? `<img src="${it.photo}" alt="Foto pemeriksaan">` : it.real ? '<svg class="ic" aria-hidden="true"><use href="#i-scan"/></svg>' : `<i data-face="${Math.min(it.total, 12)}"></i>`, nt = it.note ? `<p class="hi-note has"><svg class="ic" aria-hidden="true"><use href="#i-pen"/></svg><span>${esc(it.note)}</span></p>` : `<p class="hi-note"><svg class="ic" aria-hidden="true"><use href="#i-pen"/></svg><span>Belum ada catatan</span></p>`, side = it.real ? `<label class="hi-use"><input type="checkbox" data-eu="${esc(it.id)}" ${it.use !== false ? "checked" : ""}><span class="sw"></span>Dipakai</label><div class="hi-actions"><button class="rt-btn" data-ed="${esc(it.id)}" type="button" aria-label="Hapus catatan">Hapus</button><button class="btn btn-primary" data-ev="${esc(it.id)}" type="button">Lihat</button></div>` : `<div class="hi-actions"><button class="btn btn-primary" data-demo="${it.idx}" type="button">Lihat</button></div>`;
    return `<article class="hist-item ${it.real && it.use === false ? "off" : ""}" style="--sc:${SEV_COL[it.severity] || "#d9777f"}"><div class="hi-photo">${ph}</div><div class="hi-main"><div class="hi-top"><span class="hi-date">${esc(fmtD(it.ts, { weekday: "long", day: "numeric", month: "long", year: "numeric" }))}</span>${tm}<span class="tag ${sevClass(it.severity)}">${esc(it.severity)}</span></div><div class="hi-stats"><div class="hi-total"><strong>${it.total}</strong><span>jerawat</span></div>${dh}</div><div class="hi-chips">${chips}</div>${nt}</div><div class="hi-side">${side}</div></article>`;
  }
  function renderHistory() {
    const real = state.entries.length > 0;
    let items;
    if (real) items = state.entries.slice().sort((a, b) => a.ts.localeCompare(b.ts)).map((e) => ({ id: e.id, ts: e.ts, total: Number(e.total), severity: e.severity, counts: e.counts || {}, photo: e.photo, note: e.note, use: e.use, real: true }));
    else items = DEMO_HIST.map((d, i) => ({ id: i, ts: d.ts + "T00:00:00", total: d.total, severity: d.severity, counts: demoResult(d).counts, photo: "", note: d.note, real: false, idx: i })).reverse();
    items.forEach((it, k) => {
      it.delta = k ? it.total - items[k - 1].total : null;
    });
    const all = items.reverse(), N = all.length, show = Math.min(Math.max(state.histShow || HIST_STEP, HIST_STEP), N), mk = (t) => fmtD(t, { month: "long", year: "numeric" });
    let last = "";
    $("#histList").innerHTML = all.slice(0, show).map((it) => {
      const m = mk(it.ts);
      let h = "";
      if (m !== last) {
        last = m;
        h = `<div class="hist-month"><span>${esc(m)}</span><i></i><small>${all.filter((x) => mk(x.ts) === m).length} pemeriksaan</small></div>`;
      }
      return h + histCard(it);
    }).join("");
    const left = N - show, more = $("#histMore");
    more.innerHTML = N <= HIST_STEP ? "" : `<span class="hm-info">Menampilkan ${show} dari ${N} pemeriksaan</span><div class="hm-btns">${left > 0 ? `<button class="btn btn-outline" type="button" data-more="step">Lihat ${Math.min(HIST_STEP, left)} lagi</button>` : ""}${left > HIST_STEP ? '<button class="btn btn-outline" type="button" data-more="all">Lihat semua</button>' : ""}${show > HIST_STEP ? '<button class="btn btn-ghost" type="button" data-more="less">Tampilkan lebih sedikit</button>' : ""}</div>`;
    fillFaces($("#histList"));
  }
  $("#histMore").addEventListener("click", (e) => {
    const b = e.target.closest("[data-more]");
    if (!b) return;
    const k = b.dataset.more, cur = state.histShow || HIST_STEP;
    state.histShow = k === "step" ? cur + HIST_STEP : k === "all" ? 9999 : HIST_STEP;
    renderHistory();
    if (k === "less") $("#histList").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  function renderChart() {
    const n = $("#chartPeriod").value, E = state.entries, A = act();
    let vals, labels;
    if (E.length) {
      if (A.length) {
        const m = n === "1 bulan" ? 1 : n === "3 bulan" ? 3 : 6, end = new Date(A[A.length - 1].ts), from = new Date(end.getFullYear(), end.getMonth() - m, end.getDate()), S = A.filter((e) => new Date(e.ts) >= from);
        vals = S.map((e) => Number(e.total));
        labels = S.map((e) => fmtD(e.ts, { day: "numeric", month: "short" }));
      } else {
        vals = [];
        labels = [];
      }
    } else {
      vals = n === "1 bulan" ? [12, 11, 12] : n === "3 bulan" ? [17, 15, 12] : [28, 24, 21, 17, 15, 12];
      labels = n === "1 bulan" ? ["M1", "M2", "M3"] : n === "3 bulan" ? ["Agu", "Sep", "Okt"] : ["Mei", "Jun", "Jul", "Agu", "Sep", "Okt"];
    }
    const wrap = $("#chartWrap"), svg = $("#chartSvg"), big = (Math.round(wrap.clientWidth) || 900) > 720, W = Math.max(300, Math.round(wrap.clientWidth) || 900), H = big ? 380 : 270, L = big ? 46 : 34, R = big ? 30 : 18, T = big ? 38 : 32, B = big ? 40 : 34, pw = W - L - R, ph = H - T - B, fs = big ? 12 : 10, top = Math.max(8, Math.ceil(Math.max(0, ...vals) * 1.25 / 4) * 4);
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    $("#chartGrid").innerHTML = [0, 1, 2, 3, 4].map((i) => {
      const y = T + ph * i / 4;
      return `<line x1="${L}" y1="${y}" x2="${W - R}" y2="${y}" stroke="#efe8ea" stroke-width="1"/><text x="${L - 10}" y="${y + 4}" text-anchor="end" font-size="${fs}" fill="#8b7580" stroke="none">${Math.round(top * (4 - i) / 4)}</text>`;
    }).join("");
    const xs = vals.map((v, i) => vals.length > 1 ? L + pw * i / (vals.length - 1) : L + pw / 2), ys = vals.map((v) => T + ph * (1 - v / top)), path = vals.length ? xs.map((x, i) => (i ? "L" : "M") + x.toFixed(1) + " " + ys[i].toFixed(1)).join(" ") : "", base = T + ph;
    const sm = vals.length ? xs.map((x, i) => {
      if (!i) return "M" + x.toFixed(1) + " " + ys[i].toFixed(1);
      const dx = (x - xs[i - 1]) / 2;
      return " C" + (xs[i - 1] + dx).toFixed(1) + " " + ys[i - 1].toFixed(1) + "," + (x - dx).toFixed(1) + " " + ys[i].toFixed(1) + "," + x.toFixed(1) + " " + ys[i].toFixed(1);
    }).join("") : "";
    $("#chartLine").setAttribute("d", sm);
    $("#chartArea").setAttribute("d", vals.length ? sm + ` L${xs[xs.length - 1].toFixed(1)} ${base} L${xs[0].toFixed(1)} ${base} Z` : "");
    state.chartGeo = { xs, ys, vals, labels, W, H, T, base };
    $("#chartTip").classList.remove("show");
    $("#chartGuide").setAttribute("opacity", 0);
    $("#chartHi").setAttribute("opacity", 0);
    const cm = $("#chartMeta");
    if (vals.length >= 2) {
      const f = vals[0], l = vals[vals.length - 1], d = l - f, avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      cm.innerHTML = `<span class="cm-chip">Awal <b>${f}</b></span><span class="cm-chip">Terbaru <b>${l}</b></span><span class="cm-chip ${d < 0 ? "down" : d > 0 ? "up" : ""}">${d === 0 ? "Stabil" : d < 0 ? "\u25BC Turun" : "\u25B2 Naik"} <b>${d === 0 ? "" : Math.abs(d)}</b></span><span class="cm-chip">Rata-rata <b>${(Math.round(avg * 10) / 10).toString().replace(".", ",")}</b></span>`;
    } else cm.innerHTML = "";
    $("#chartPoints").innerHTML = vals.length ? xs.map((x, i) => `<circle cx="${x.toFixed(1)}" cy="${ys[i].toFixed(1)}" r="${big ? 6 : 5}"/><text x="${x.toFixed(1)}" y="${(ys[i] - 14).toFixed(1)}" text-anchor="middle" font-size="${fs + 2}" font-weight="800" fill="#b5476b" stroke="none">${vals[i]}</text>`).join("") : `<text x="${W / 2}" y="${T + ph / 2}" text-anchor="middle" font-size="${fs + 2}" fill="#8b7580" stroke="none">Belum ada pemeriksaan yang dipakai untuk grafik</text>`;
    const step = Math.ceil(labels.length / (big ? 10 : 5));
    $("#chartX").innerHTML = labels.map((x, i) => i % step === 0 || i === labels.length - 1 ? `<text x="${xs[i].toFixed(1)}" y="${H - 12}" text-anchor="middle" font-size="${fs}" fill="#8b7580" stroke="none">${esc(x)}</text>` : "").join("");
  }
  window.addEventListener("resize", () => {
    if (state.route === "progress") renderChart();
  });
  {
    const wrap = $("#chartWrap"), tp = $("#chartTip");
    const near = (e) => {
      const g = state.chartGeo;
      if (!g || !g.vals.length) return;
      const r = $("#chartSvg").getBoundingClientRect(), k = g.W / r.width, x = (e.clientX - r.left) * k;
      let bi = 0;
      g.xs.forEach((v, i) => {
        if (Math.abs(v - x) < Math.abs(g.xs[bi] - x)) bi = i;
      });
      const px = g.xs[bi] / k, py = g.ys[bi] / k, gl = $("#chartGuide"), hi = $("#chartHi");
      gl.setAttribute("x1", g.xs[bi]);
      gl.setAttribute("x2", g.xs[bi]);
      gl.setAttribute("y1", g.T - 10);
      gl.setAttribute("y2", g.base);
      gl.setAttribute("opacity", 1);
      hi.setAttribute("cx", g.xs[bi]);
      hi.setAttribute("cy", g.ys[bi]);
      hi.setAttribute("opacity", 1);
      tp.innerHTML = "<b>" + g.vals[bi] + " jerawat</b><span>" + esc(g.labels[bi]) + "</span>";
      tp.style.left = Math.max(50, Math.min(px, r.width - 50)) + "px";
      tp.style.top = py - 34 + "px";
      tp.classList.add("show");
    };
    wrap.addEventListener("pointermove", near);
    wrap.addEventListener("pointerdown", near);
    wrap.addEventListener("pointerleave", () => {
      tp.classList.remove("show");
      $("#chartGuide").setAttribute("opacity", 0);
      $("#chartHi").setAttribute("opacity", 0);
    });
  }
  $("#histList").addEventListener("click", (e) => {
    const v = e.target.closest("[data-ev]"), dm = e.target.closest("[data-demo]"), d = e.target.closest("[data-ed]");
    if (v) go("results?entry=" + encodeURIComponent(v.dataset.ev));
    if (dm) go("results?demo=" + dm.dataset.demo);
    if (d) {
      const x = state.entries.find((t) => t.id === d.dataset.ed);
      if (x && confirm("Hapus catatan " + fmtD(x.ts) + "?")) {
        state.entries = state.entries.filter((t) => t.id !== x.id);
        saveEntries();
        renderProgress();
        toast("Catatan dihapus.");
      }
    }
  });
  $("#clearEntries").addEventListener("click", () => {
    if (confirm("Hapus semua catatan dan foto yang tersimpan di browser ini?")) {
      state.entries = [];
      saveEntries();
      renderProgress();
      toast("Semua catatan dihapus.");
    }
  });
  function entriesCsv() {
    return "Tanggal,Jumlah,Keparahan,Papula,Pustula,Komedo,Catatan\n" + state.entries.map((e) => ['"' + fmtD(e.ts) + '"', e.total, e.severity, e.counts?.papula ?? 0, e.counts?.pustula ?? 0, e.counts?.komedo ?? 0, '"' + String(e.note || "").replace(/"/g, '""') + '"'].join(",")).join("\n");
  }
  $("#histList").addEventListener("change", (e) => {
    const c = e.target.closest("[data-eu]");
    if (!c) return;
    const x = state.entries.find((t) => t.id === c.dataset.eu);
    if (x) {
      x.use = c.checked;
      saveEntries();
      renderProgress();
    }
  });
  $("#chartPeriod").addEventListener("change", renderChart);
  $("#exportHistory").addEventListener("click", () => state.entries.length ? downloadFile("detacne-riwayat.csv", entriesCsv()) : downloadFile("detacne-riwayat-demo.csv", "Tanggal,Jumlah contoh,Keparahan,Catatan\n28 Okt 2026,12,Ringan,Simulasi\n28 Sep 2026,15,Sedang,Simulasi\n28 Agu 2026,17,Sedang,Simulasi\n28 Jul 2026,21,Perlu dipantau,Simulasi"));
  function downloadFile(filename, text) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 500);
    toast("File berhasil disiapkan.");
  }
  function openModal(title, html) {
    $("#modalTitle").textContent = title;
    $("#modalContent").innerHTML = html;
    fillFaces($("#modalContent"));
    $("#modalBackdrop").classList.add("open");
  }
  function closeModal() {
    $("#modalBackdrop").classList.remove("open");
  }
  $("#closeModal").addEventListener("click", closeModal);
  $("#modalBackdrop").addEventListener("click", (e) => {
    if (e.target === $("#modalBackdrop")) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-go]");
    if (b) go(b.dataset.go);
  });
  $("#accountLink").addEventListener("contextmenu", (e) => {
    if (state.user) {
      e.preventDefault();
      state.user = null;
      localStorage.removeItem("detacneUser");
      toast("Berhasil keluar.");
      showRoute("home");
    }
  });
  document.querySelectorAll('a[href^="#/"]').forEach((a) => a.addEventListener("click", () => setTimeout(() => $("#mainNav").classList.remove("open"), 0)));
  $("#heroFace").innerHTML = faceSVG({ marks: 12, scan: true, boxes: HBOX });
  $("#resultFace").innerHTML = faceSVG({ marks: 12, boxes: RBOX });
  $("#loadFace").innerHTML = faceSVG({ marks: 6, scan: true });
  $("#howHome").innerHTML = HOW;
  $("#howDash").innerHTML = HOW;
  fillFaces();
  const ACNE_INFO = {
    papula: { n: "Papula", t: "Jerawat meradang, tanpa nanah", d: "Benjolan kecil kemerahan yang teraba keras dan tidak berisi nanah. Sebaiknya tidak dipencet agar radang tidak makin parah.", c: ["Pori tersumbat oleh minyak berlebih dan sel kulit mati", "Peradangan akibat bakteri penyebab jerawat (C. acnes)", "Perubahan hormon, misalnya saat pubertas, haid, atau stres", "Gesekan dari masker atau helm dan kebiasaan menyentuh wajah"] },
    pustula: { n: "Pustula", t: "Jerawat meradang, berisi nanah", d: "Mirip papula, tetapi ada nanah putih atau kekuningan di ujungnya dan kulit sekitarnya kemerahan. Memencetnya bisa memicu infeksi dan bekas.", c: ["Radang aktif saat sistem imun melawan bakteri di pori tersumbat", "Produksi minyak berlebih yang menyumbat pori", "Memencet atau menggaruk jerawat yang sudah meradang", "Perubahan hormon dan stres", "Produk atau kosmetik yang menyumbat pori"] },
    komedo: { n: "Komedo", t: "Jerawat tidak meradang", d: "Pori tersumbat minyak dan sel kulit mati tanpa peradangan berarti. Bisa terbuka (tampak hitam karena teroksidasi, bukan kotoran) atau tertutup (tampak putih kecil).", c: ["Produksi minyak berlebih", "Sel kulit mati yang menumpuk di dalam pori", "Kosmetik atau produk berbahan berat yang menyumbat pori", "Wajah kurang bersih, terutama setelah memakai makeup atau tabir surya"] },
    nodul: { n: "Nodul", t: "Jerawat meradang berat, di bawah kulit", d: "Benjolan besar, keras, dan nyeri yang tumbuh lebih dalam di bawah kulit. Cenderung meninggalkan bekas, sebaiknya diperiksakan ke dokter kulit.", c: ["Peradangan yang menjalar ke lapisan kulit lebih dalam", "Faktor hormonal", "Faktor keturunan"] },
    kista: { n: "Kista", t: "Jerawat meradang berat, berisi cairan", d: "Benjolan dalam berisi cairan atau nanah, nyeri, dan mudah meninggalkan bekas. Perlu penanganan dokter kulit.", c: ["Peradangan dalam yang parah", "Faktor hormonal", "Faktor keturunan"] }
  };
  const BAHAN = [
    { n: "Salicylic acid (BHA)", f: "Pori tersumbat", d: "Larut dalam minyak sehingga membantu membersihkan isi pori. Cocok untuk komedo, mulai dari pemakaian bertahap.", u: "Kadar umum 0,5\u20132%", ic: "dropper", t: ["komedo", "papula"] },
    { n: "Benzoyl peroxide", f: "Bakteri dan radang", d: "Membantu mengurangi bakteri penyebab jerawat meradang. Bisa membuat kulit kering dan memutihkan kain.", u: "Kadar umum 2,5\u20135%", ic: "flask", t: ["papula", "pustula"] },
    { n: "Niacinamide", f: "Kemerahan dan minyak", d: "Membantu menenangkan kemerahan dan mengatur kilap minyak. Umumnya nyaman untuk kulit sensitif.", u: "Kadar umum 2\u20135%", ic: "dropper", t: ["papula", "pustula", "komedo"] },
    { n: "Azelaic acid", f: "Radang dan noda bekas", d: "Membantu mengurangi radang dan noda kemerahan atau kecokelatan bekas jerawat. Kadar lebih tinggi umumnya perlu resep.", u: "Kadar umum sekitar 10%", ic: "flask", t: ["papula", "pustula"] },
    { n: "Retinoid topikal (mis. adapalene)", f: "Pencegah sumbatan pori", d: "Membantu mencegah pori tersumbat dan melancarkan pergantian sel kulit. Umumnya dipakai atas saran dokter dan tidak untuk ibu hamil.", u: "Sesuai anjuran dokter", ic: "tube", t: ["komedo", "nodul", "kista"] }
  ];
  const BAHAN_DASAR = [
    { n: "Ceramide, glycerin, hyaluronic acid", f: "Pelembap", d: "Menjaga lapisan pelindung kulit tetap sehat, penting saat memakai bahan aktif yang bisa mengeringkan.", u: "Pilih tekstur gel atau ringan", ic: "jar" },
    { n: "Tabir surya SPF 30+", f: "Perlindungan", d: "Pilih tekstur ringan berlabel non-comedogenic. Filter mineral seperti zinc oxide umumnya nyaman untuk kulit berjerawat.", u: "SPF 30 atau lebih", ic: "tube" }
  ];
  function renderBahan(r) {
    const cnt = r.counts || {}, sc = (b) => b.t.reduce((a, t) => a + (Number(cnt[t]) || 0), 0), pick = BAHAN.filter((b) => sc(b) > 0).sort((a, b) => sc(b) - sc(a)).slice(0, 4);
    $("#ingredientGrid").innerHTML = pick.concat(BAHAN_DASAR).map((b) => `<article class="product ingredient"><span class="tag">${b.f}</span><h4>${b.n}</h4><p>${b.d}</p><div class="price">${b.u}</div></article>`).join("");
  }
  document.addEventListener("click", (e) => {
    const sm = e.target.closest(".faq summary");
    if (!sm) return;
    e.preventDefault();
    if (e.target.closest(".faq-ico")) {
      const d = sm.parentNode;
      d.open = !d.open;
    }
  });
  document.addEventListener("keydown", (e) => {
    const ic = e.target.closest?.(".faq-ico");
    if (ic && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      const d = ic.closest("details");
      d.open = !d.open;
    }
  });
  $$(".faq details").forEach((d) => d.addEventListener("toggle", () => d.querySelector(".faq-ico").setAttribute("aria-expanded", String(d.open))));
  const cam = document.createElement("div");
  cam.className = "cam";
  cam.setAttribute("role", "dialog");
  cam.setAttribute("aria-label", "Ambil foto wajah");
  cam.innerHTML = '<div class="cam-stage" id="camStage"><video id="camVideo" autoplay playsinline muted></video><svg class="cam-mask" id="camMask" viewBox="0 0 300 400" aria-hidden="true"><path id="camMaskPath" fill="#1b0c10" fill-opacity=".62" fill-rule="evenodd" d=""/><ellipse id="camRing" cx="150" cy="190" rx="105" ry="140" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="8 7"/></svg><div id="camDbg" style="position:absolute;inset:0;pointer-events:none;display:none;font:700 11px/1.3 monospace;color:#ffe27a"></div></div><div class="cam-hint" id="camHint" aria-live="polite"></div><div class="cam-actions"><button class="btn btn-outline" id="camCancel" type="button" style="background:#fff">Batal</button><button class="shutter" id="camShot" type="button" aria-label="Ambil foto"></button></div>';
  document.body.appendChild(cam);
  let camStream = null, camTimer = null, camGate = false, camOval = { fx: 0.5, fy: 0.475, fh: 0.7 };
  function setHint(t, ok) {
    $("#camHint").textContent = t;
    $("#camHint").classList.toggle("ok", ok);
    $("#camRing").setAttribute("stroke", ok ? "#9ff0c8" : "#fff");
    if (camGate) $("#camShot").disabled = !ok;
  }
  function layoutCam() {
    const v = $("#camVideo"), st = $("#camStage");
    if (!v.videoWidth || !v.videoHeight) return;
    const A = v.videoWidth / v.videoHeight, maxW = Math.min(innerWidth - 32, 960), maxH = Math.max(160, innerHeight - 150);
    let w = Math.min(maxW, maxH * A), h = w / A;
    if (h > maxH) {
      h = maxH;
      w = h * A;
    }
    st.style.width = w + "px";
    st.style.height = h + "px";
    const rx = Math.min(0.225 * h, 0.345 * w), ry = rx / 0.75, cx = w / 2, cy = 0.475 * h;
    $("#camMask").setAttribute("viewBox", "0 0 " + w + " " + h);
    $("#camMaskPath").setAttribute("d", "M0 0H" + w + "V" + h + "H0ZM" + (cx - rx) + " " + cy + "a" + rx + " " + ry + " 0 1 0 " + 2 * rx + " 0a" + rx + " " + ry + " 0 1 0 " + -2 * rx + " 0z");
    const ring = $("#camRing");
    ring.setAttribute("cx", cx);
    ring.setAttribute("cy", cy);
    ring.setAttribute("rx", rx);
    ring.setAttribute("ry", ry);
    camOval = { fx: 2 * rx / w, fy: cy / h, fh: 2 * ry / h };
  }
  $("#camVideo").addEventListener("loadedmetadata", layoutCam);
  $("#camVideo").addEventListener("resize", layoutCam);
  window.addEventListener("resize", () => {
    if (cam.classList.contains("open")) layoutCam();
  });
  const CAM_CFG = { min: 0.9, max: 1.08, dx: 0.1, dy: 0.1, std: 0.14 };
  let camDebug = /[?&]debug/.test(location.search + location.hash);
  document.addEventListener("keydown", (e) => {
    if (e.key === "d" && cam.classList.contains("open")) {
      camDebug = !camDebug;
      $("#camDbg").style.display = camDebug ? "block" : "none";
    }
  });
  const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
  let detP = null;
  function getDetector() {
    if (detP) return detP;
    detP = (async () => {
      const M = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14", G = "https://storage.googleapis.com/mediapipe-models/";
      const m = await import(M + "/+esm");
      const fs = await m.FilesetResolver.forVisionTasks(M + "/wasm");
      try {
        const lm = await m.FaceLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: G + "face_landmarker/face_landmarker/float16/1/face_landmarker.task" }, runningMode: "VIDEO", numFaces: 1 });
        return async (v) => {
          const L = lm.detectForVideo(v, performance.now()).faceLandmarks[0];
          return L ? FACE_OVAL.map((i) => ({ x: L[i].x, y: L[i].y })) : null;
        };
      } catch {
        const d = await m.FaceDetector.createFromOptions(fs, { baseOptions: { modelAssetPath: G + "face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite" }, runningMode: "VIDEO" });
        return async (v) => {
          const r = d.detectForVideo(v, performance.now()).detections[0];
          if (!r) return null;
          const b = r.boundingBox, W = v.videoWidth, H = v.videoHeight, cx = (b.originX + b.width / 2) / W, cy = (b.originY + b.height / 2 - b.height * 0.08) / H, rx = b.width * 0.65 / W, ry = b.height * 0.675 / H;
          return Array.from({ length: 36 }, (_, k) => {
            const t = k / 36 * 2 * Math.PI;
            return { x: cx + rx * Math.cos(t), y: cy + ry * Math.sin(t) };
          });
        };
      }
    })().catch((e) => {
      detP = null;
      throw e;
    });
    return detP;
  }
  function stopCam() {
    clearInterval(camTimer);
    if (camStream) camStream.getTracks().forEach((t) => t.stop());
    camStream = null;
    cam.classList.remove("open");
  }
  async function openCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast("Kamera langsung tidak didukung, memakai kamera bawaan perangkat.");
      $("#cameraInput").click();
      return;
    }
    try {
      camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    } catch {
      toast('Kamera tidak bisa diakses. Izinkan akses kamera, atau pakai "Pilih foto".');
      return;
    }
    const stream = camStream, v = $("#camVideo");
    v.srcObject = stream;
    cam.classList.add("open");
    layoutCam();
    $("#camDbg").style.display = camDebug ? "block" : "none";
    camGate = true;
    $("#camShot").disabled = true;
    setHint("Menyiapkan deteksi wajah...", false);
    let det = null;
    try {
      det = await getDetector();
    } catch {
      det = null;
    }
    if (camStream !== stream) return;
    if (!det) {
      camGate = false;
      $("#camShot").disabled = false;
      setHint("Deteksi otomatis tidak tersedia. Posisikan wajah di dalam bingkai oval, jarak kira-kira satu lengan", false);
      return;
    }
    setHint("Mencari wajah...", false);
    let busy = false, okN = 0;
    camTimer = setInterval(async () => {
      if (busy || v.readyState < 2 || !v.videoWidth) return;
      busy = true;
      try {
        const pts = await det(v);
        if (camStream !== stream) return;
        const dbg = $("#camDbg");
        if (!pts) {
          okN = 0;
          dbg.innerHTML = "";
          setHint("Wajah belum terdeteksi, hadap lurus ke kamera", false);
        } else {
          const C = CAM_CFG, vw = v.videoWidth, vh = v.videoHeight, rxp = camOval.fx * vw / 2, ryp = camOval.fh * vh / 2, cxp = vw / 2, cyp = camOval.fy * vh;
          const rs = pts.map((p) => Math.hypot((p.x * vw - cxp) / rxp, (p.y * vh - cyp) / ryp)), n = rs.length, mean = rs.reduce((a, b) => a + b, 0) / n, std = Math.sqrt(rs.reduce((a, r) => a + (r - mean) * (r - mean), 0) / n);
          const dx = (pts.reduce((a, p) => a + p.x, 0) / n * vw - cxp) / rxp, dy = (pts.reduce((a, p) => a + p.y, 0) / n * vh - cyp) / ryp;
          let msg = null;
          if (mean < C.min) msg = "Terlalu jauh, dekatkan wajah ke kamera";
          else if (mean > C.max) msg = "Terlalu dekat, mundur sedikit";
          else if (Math.abs(dx) > C.dx) msg = "Geser wajah ke tengah bingkai";
          else if (dy < -C.dy) msg = "Wajah terlalu ke atas, turunkan sedikit";
          else if (dy > C.dy) msg = "Wajah terlalu ke bawah, naikkan sedikit";
          else if (std > C.std) msg = "Luruskan wajah, hadap lurus ke kamera";
          okN = msg ? 0 : okN + 1;
          if (camDebug) {
            dbg.innerHTML = pts.map((p) => '<i style="position:absolute;width:5px;height:5px;margin:-2px;border-radius:50%;background:#ffe27a;left:' + (1 - p.x) * 100 + "%;top:" + p.y * 100 + '%"></i>').join("") + '<div style="position:absolute;left:6px;top:6px;background:#000a;padding:3px 6px;border-radius:4px">ukuran ' + mean.toFixed(2) + " (ideal " + C.min + "-" + C.max + ")<br>dx " + dx.toFixed(2) + " dy " + dy.toFixed(2) + " miring " + std.toFixed(2) + "<br>stabil " + okN + "/3</div>";
          } else dbg.innerHTML = "";
          if (msg) setHint(msg, false);
          else if (okN < 3) setHint("Hampir pas, tahan posisi...", false);
          else setHint("Pas! Tahan posisi, lalu tekan tombol", true);
        }
      } catch {
      }
      busy = false;
    }, 300);
  }
  function captureCam() {
    const v = $("#camVideo");
    if (!v.videoWidth) return;
    const vw = v.videoWidth, vh = v.videoHeight;
    let ch = 0.9 * vh, cw = ch * 0.75;
    if (cw > vw * 0.96) {
      cw = vw * 0.96;
      ch = cw / 0.75;
    }
    const sx = (vw - cw) / 2, sy = Math.max(0, Math.min(vh - ch, camOval.fy * vh - ch / 2)), sc = Math.min(1, 1280 / Math.max(cw, ch));
    const c = document.createElement("canvas");
    c.width = Math.round(cw * sc);
    c.height = Math.round(ch * sc);
    c.getContext("2d").drawImage(v, sx, sy, cw, ch, 0, 0, c.width, c.height);
    c.toBlob((b) => {
      if (!b) {
        toast("Gagal mengambil foto, coba lagi.");
        return;
      }
      stopCam();
      acceptFile(new File([b], "kamera-" + Date.now() + ".jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.92);
  }
  $("#camShot").addEventListener("click", captureCam);
  $("#camCancel").addEventListener("click", stopCam);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && cam.classList.contains("open")) stopCam();
  });
  window.addEventListener("hashchange", stopCam);
  $("#cameraInput").addEventListener("change", (e) => acceptFile(e.target.files[0]));
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-save-login]")) {
      state.next = "results";
    }
    if (e.target.closest("#takePhoto,#retakePhoto")) openCamera();
    const s = e.target.closest("[data-scroll]");
    if (s) document.getElementById(s.dataset.scroll)?.scrollIntoView({ behavior: "smooth" });
  });
  $("#logoutBtn").addEventListener("click", () => {
    state.user = null;
    state.next = null;
    API.logout();
    localStorage.removeItem("detacneUser");
    localStorage.removeItem("detacneToken");
    toast("Kamu sudah keluar.");
    location.hash = "#/";
    showRoute("home");
  });
  function closeProfileMenu() {
    $("#profileMenu").classList.remove("open");
    $("#profileBtn").setAttribute("aria-expanded", "false");
  }
  function updateProfile() {
    closeProfileMenu();
    const u = state.user;
    if (!u) return;
    const n = String(u.name || u.email || "Teman").trim();
    $("#profileInitial").textContent = n.split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase() || "U";
    $("#profileName").textContent = n;
    $("#profileEmail").textContent = u.email || "";
  }
  $("#profileBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    const m = $("#profileMenu"), o = !m.classList.contains("open");
    m.classList.toggle("open", o);
    $("#profileBtn").setAttribute("aria-expanded", String(o));
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#profileWrap")) closeProfileMenu();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeProfileMenu();
  });
  $("#forgotBtn").addEventListener("click", () => {
    closeProfileMenu();
    openModal("Lupa kata sandi", `<p class="small">Masukkan email akunmu. Kami akan mengirim tautan untuk mengatur ulang kata sandi.</p><form id="forgotForm"><label class="form-field"><span>Email</span><input class="input" type="email" name="email" required value="${esc(state.user?.email || "")}" placeholder="nama@email.com"></label><button class="btn btn-primary" style="width:100%" type="submit">Kirim tautan reset</button></form>${false ? '<p class="form-help">Demo: tidak ada email yang benar-benar dikirim.</p>' : ""}`);
    $("#forgotForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const em = new FormData(e.currentTarget).get("email");
      API.forgot({ email: em }).then(() => forgotSent(normEmail(em))).catch((err) => toast(err.message || "Gagal mengirim tautan."));
    });
  });
  $("#nickBtn").addEventListener("click", () => {
    if (isAdmin()) return;
    closeProfileMenu();
    openModal("Ubah nama panggilan", `<p class="small">Nama ini dipakai untuk menyapamu di DETACNE.</p><form id="nickForm" novalidate><label class="form-field"><span>Nama panggilan baru</span><input class="input" name="name" type="text" required minlength="2" maxlength="250" autocomplete="nickname" value="${esc(state.user?.name || "")}" placeholder="Nama kamu (huruf saja)"><small class="field-err"></small></label><button class="btn btn-primary" style="width:100%" type="submit">Simpan nama panggilan</button></form>`);
    const f = $("#nickForm");
    f.elements.name.focus();
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const t = f.elements.name.value.trim().replace(/\s+/g, " ");
      let m = "";
      if (!t) m = "Nama panggilan wajib diisi.";
      else if (t.length < 2) m = "Minimal 2 huruf.";
      else if (t.length > 250) m = "Maksimal 250 karakter.";
      else if (!NAME_RE.test(t)) m = "Hanya huruf dan spasi, tanpa angka atau simbol.";
      f.querySelector(".field-err").textContent = m;
      f.elements.name.closest(".form-field").classList.toggle("bad", !!m);
      if (m) return;
      state.user = { ...state.user, name: t };
      try {
        localStorage.setItem("detacneUser", JSON.stringify(state.user));
      } catch {
      }
      updateProfile();
      if (state.route === "dashboard") renderDashboard();
      closeModal();
      toast("Nama panggilan berhasil diubah.");
    });
  });
  const NAME_RE = /^[\p{L}\p{M}]+(?: [\p{L}\p{M}]+)*$/u, EMAIL_RE = /^[a-z0-9]+(?:[._%+-][a-z0-9]+)*@[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)*\.[a-z]{2,}$/i;
  function normEmail(v) {
    return String(v || "").trim().toLowerCase();
  }
  function accountList() {
    try {
      const l = JSON.parse(localStorage.getItem("detacneAccounts") || "[]");
      return Array.isArray(l) ? l : [];
    } catch {
      return [];
    }
  }
  function emailTaken(e) {
    return e === "admin@detacne.id" || accountList().includes(e);
  }
  function addAccount(e) {
    const l = accountList();
    if (!l.includes(e)) {
      l.push(e);
      try {
        localStorage.setItem("detacneAccounts", JSON.stringify(l));
      } catch {
      }
    }
  }
  function regMsg(f, n) {
    const v = String(f.elements[n].value || "");
    if (n === "name") {
      const t = v.trim().replace(/\s+/g, " ");
      if (!t) return "Nama panggilan wajib diisi.";
      if (t.length < 2) return "Minimal 2 huruf.";
      if (t.length > 250) return "Maksimal 250 karakter.";
      if (!NAME_RE.test(t)) return "Hanya huruf dan spasi, tanpa angka atau simbol.";
    } else if (n === "gender") {
      if (!v) return "Pilih jenis kelamin.";
    } else if (n === "birthdate") {
      if (!v) return "Tanggal lahir wajib diisi.";
      if (v > dateKey(new Date()) || v < "1920-01-01") return "Tanggal lahir tidak valid.";
    } else if (n === "email") {
      const e = normEmail(v);
      if (!e) return "Email wajib diisi.";
      if (e.length > 254 || e.split("@")[0].length > 64 || !EMAIL_RE.test(e)) return "Format email tidak valid. Contoh: nama@email.com";
      if (false) return "Email ini sudah terdaftar. Silakan masuk.";
    } else if (n === "password") {
      if (v.length < 8) return "Minimal 8 karakter.";
      if (!/\p{L}/u.test(v) || !/\d/.test(v)) return "Harus mengandung huruf dan angka.";
    } else if (n === "confirm") {
      if (!v) return "Ulangi kata sandi.";
      if (v !== f.elements.password.value) return "Konfirmasi kata sandi belum cocok.";
    }
    return "";
  }
  function regCheck(f, n) {
    const m = regMsg(f, n), lab = f.elements[n].closest(".form-field");
    lab.classList.toggle("bad", !!m);
    const el = lab.querySelector(".field-err");
    if (el) el.textContent = m;
    return !m;
  }
  function validateRegister(f) {
    let first = null;
    ["name", "gender", "birthdate", "email", "password", "confirm"].forEach((n) => {
      if (!regCheck(f, n) && !first) first = f.elements[n];
    });
    if (first) first.focus();
    return !first;
  }
  const regForm = $("#registerForm");
  regForm.addEventListener("focusout", (e) => {
    const n = e.target.name;
    if (n && regForm.elements[n] && e.target.closest(".form-field")) regCheck(regForm, n);
  });
  regForm.addEventListener("input", (e) => {
    const n = e.target.name;
    if (!n || !e.target.closest(".form-field")) return;
    if (e.target.closest(".form-field").classList.contains("bad")) regCheck(regForm, n);
    if (n === "password" && regForm.elements.confirm.value) regCheck(regForm, "confirm");
  });
  regForm.addEventListener("change", (e) => {
    if (e.target.name === "gender" || e.target.name === "birthdate") regCheck(regForm, e.target.name);
  });
  function forgotSent(em) {
    const tok = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
    state.resetEmail = em;
    openModal("Cek emailmu", `<p class="small">Kami mengirim tautan reset ke <b>${esc(em)}</b>. Tautan berlaku 30 menit. Cek juga folder spam.</p>` + (false ? `<div class="mail-demo"><div class="mail-head"><span>Dari: DETACNE &lt;no-reply@detacne.id&gt;</span><span>Ke: ${esc(em)}</span><b>Atur ulang kata sandi DETACNE</b></div><div class="mail-body"><p>Halo,</p><p>Kami menerima permintaan untuk mengatur ulang kata sandi akunmu. Klik tombol di bawah untuk membuat kata sandi baru. Tautan ini berlaku 30 menit.</p><span class="btn btn-primary">Atur ulang kata sandi</span><p class="small">Kalau bukan kamu yang meminta, abaikan email ini. Kata sandimu tidak berubah.</p></div></div><p class="small">Ini hanya contoh tampilan email, karena di demo belum ada email yang benar-benar dikirim.</p><button class="btn btn-primary" style="width:100%" id="openResetDemo" type="button">Buka tautan reset (demo)</button>` : ""));
    const b = $("#openResetDemo");
    if (b) b.addEventListener("click", () => {
      closeModal();
      location.hash = "#/reset?token=" + tok;
    });
  }
  const resetForm = $("#resetForm");
  resetForm.addEventListener("focusout", (e) => {
    const n = e.target.name;
    if (n && resetForm.elements[n]) regCheck(resetForm, n);
  });
  resetForm.addEventListener("input", (e) => {
    const n = e.target.name;
    if (!n) return;
    if (e.target.closest(".form-field").classList.contains("bad")) regCheck(resetForm, n);
    if (n === "password" && resetForm.elements.confirm.value) regCheck(resetForm, "confirm");
  });
  resetForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const a = regCheck(resetForm, "password"), b = regCheck(resetForm, "confirm");
    if (!(a && b)) {
      toast("Periksa kembali isian yang ditandai.");
      return;
    }
    API.resetPassword({ token: new URLSearchParams(state.hashQ || "").get("token") || "", email: state.resetEmail || "", password: resetForm.elements.password.value }).then(() => {
      state.resetEmail = "";
      toast("Kata sandi berhasil diubah.");
      go(state.user ? "dashboard" : "login");
    }).catch((err) => toast(err.message || "Gagal mengubah kata sandi."));
  });
  const snoozed = [];
  function firedSet() {
    try {
      return JSON.parse(localStorage.getItem("detacneFired") || "{}");
    } catch {
      return {};
    }
  }
  function markFired(k) {
    const f = firedSet(), today = dateKey(new Date());
    Object.keys(f).forEach((x) => {
      if (!x.startsWith(today)) delete f[x];
    });
    f[k] = 1;
    try {
      localStorage.setItem("detacneFired", JSON.stringify(f));
    } catch {
    }
  }
  function notifStatus() {
    if (!("Notification" in window)) return "tidak didukung browser ini";
    if (!window.isSecureContext && location.protocol !== "file:") return "diblokir karena halaman bukan https atau localhost";
    const p = Notification.permission;
    if (p === "granted") return "aktif";
    if (location.protocol === "file:") return "kemungkinan diblokir karena halaman dibuka dari file lokal (buka lewat localhost)";
    return p === "denied" ? "diblokir di pengaturan browser" : 'belum diizinkan (klik "Aktifkan notifikasi browser")';
  }
  let titleTimer = null;
  const baseTitle = document.title;
  function flashTitle(msg) {
    clearInterval(titleTimer);
    let on = false;
    titleTimer = setInterval(() => {
      on = !on;
      document.title = on ? "\u{1F514} " + msg : baseTitle;
    }, 1e3);
  }
  let audioCtx = null;
  function unlockAudio() {
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      if (!audioCtx) audioCtx = new C();
      if (audioCtx.state === "suspended") audioCtx.resume();
    } catch {
    }
  }
  ["pointerdown", "keydown", "touchstart"].forEach((ev) => document.addEventListener(ev, unlockAudio, { passive: true }));
  function beep() {
    try {
      unlockAudio();
      const a = audioCtx;
      if (!a) return;
      const t0 = a.currentTime;
      [880, 1175].forEach((f, i) => {
        const o = a.createOscillator(), g = a.createGain(), st = t0 + i * 0.28;
        o.type = "sine";
        o.frequency.value = f;
        g.gain.setValueAtTime(1e-4, st);
        g.gain.exponentialRampToValueAtTime(0.35, st + 0.03);
        g.gain.exponentialRampToValueAtTime(1e-4, st + 0.45);
        o.connect(g);
        g.connect(a.destination);
        o.start(st);
        o.stop(st + 0.5);
      });
    } catch {
    }
  }
  function showRemind(t, title, body) {
    const el = document.createElement("div");
    el.className = "remind";
    el.setAttribute("role", "alert");
    el.innerHTML = `<b>${esc(title)}</b><small>${esc(body)}</small><div class="row"><button class="btn btn-primary" data-rdone="${esc(t.id)}" type="button">Selesai</button><button class="btn btn-outline" data-rsnooze="${esc(t.id)}" type="button">Tunda 10 menit</button><button class="btn btn-ghost" data-rclose type="button" aria-label="Tutup">\u2715</button></div>`;
    $("#remindStack").appendChild(el);
    return el;
  }
  let swReg = null;
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => navigator.serviceWorker.register("Sw.js")).then((r) => {
      swReg = r;
      state.swErr = "";
      renderRemindUI();
    }).catch((e) => {
      state.swErr = String(e && e.message || e);
      renderRemindUI();
    });
  }
  function showNotif(title, opts) {
    const viaPage = () => {
      try {
        const n = new Notification(title, opts);
        n.onclick = () => {
          window.focus();
          n.close();
        };
        return Promise.resolve("halaman");
      } catch (e) {
        return Promise.reject(e);
      }
    };
    if (!("serviceWorker" in navigator) || location.protocol === "file:") return viaPage();
    const ready = Promise.race([navigator.serviceWorker.ready, new Promise((_, no) => setTimeout(() => no(new Error("service worker belum siap")), 2500))]);
    return ready.then((r) => r.showNotification(title, opts)).then(() => "service worker").catch(viaPage);
  }
  function fireReminder(t, at, upcoming, title) {
    const ttl = title || "Waktunya: " + t.name, body = (upcoming ? "Dijadwalkan pukul " : "Seharusnya pukul ") + t.time + " \xB7 rutinitas " + rPeriod(t).toLowerCase();
    const card = showRemind(t, ttl, body + (t.id === "_test" ? " \xB7 Notifikasi browser: " + notifStatus() : ""));
    if (document.hidden) {
      flashTitle(ttl);
      beep();
    }
    if ("Notification" in window && Notification.permission === "granted") {
      const opts = { body, tag: "detacne-" + t.id + "-" + Date.now(), requireInteraction: true, icon: "icon-192.png", badge: "icon-192.png" }, sm = t.id === "_test" ? card.querySelector("small") : null, add = (x) => {
        if (t.id === "_test") {
          state.lastNotif = x;
          notifDiag();
        }
        if (sm) sm.textContent += " \xB7 " + x;
      };
      showNotif("DETACNE \xB7 " + ttl, opts).then((via) => add("\u2713 Notifikasi dikirim lewat " + via + ". Kalau tidak terlihat di layar, berarti diblokir sistem (Focus Assist atau Jangan Ganggu).")).catch((err) => add("\u2717 Gagal: " + (err && err.message || err)));
    } else if (t.id === "_test") {
      state.lastNotif = "tidak dikirim, izin notifikasi: " + notifStatus();
      notifDiag();
    }
  }
  function checkReminders() {
    if (!state.user || state.user.role === "admin") {
      $("#remindStack").innerHTML = "";
      return;
    }
    const now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate()), dk = dateKey(today), fired = firedSet();
    state.routines.forEach((t) => {
      if (!rOn(t, today)) return;
      const key = dk + "_" + t.id;
      if (fired[key] || state.tasks[key]) return;
      const [h, m] = t.time.split(":").map(Number), at = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m), rem = new Date(at.getTime() - rLead(t) * 6e4);
      if (now >= rem && now < new Date(at.getTime() + 30 * 6e4)) {
        markFired(key);
        fireReminder(t, at, now < at);
      }
    });
    for (let i = snoozed.length - 1; i >= 0; i--) {
      const q = snoozed[i];
      if (Date.now() < q.due) continue;
      snoozed.splice(i, 1);
      const t = state.routines.find((x) => x.id === q.id);
      if (t && !state.tasks[dk + "_" + t.id]) {
        const [h, m] = t.time.split(":").map(Number);
        fireReminder(t, new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m), false);
      }
    }
  }
  $("#remindStack").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const el = b.closest(".remind"), d = b.dataset;
    if (d.rdone !== void 0) {
      if (d.rdone !== "_test") {
        state.tasks[dateKey(new Date()) + "_" + d.rdone] = true;
        try {
          localStorage.setItem("detacneTasksV2", JSON.stringify(state.tasks));
        } catch {
        }
        renderRoutine();
        renderDashboard();
        toast("Rutinitas ditandai selesai.");
      }
      el.remove();
    } else if (d.rsnooze !== void 0) {
      if (d.rsnooze !== "_test") snoozed.push({ id: d.rsnooze, due: Date.now() + 6e5 });
      el.remove();
      toast("Diingatkan lagi 10 menit lagi.");
    } else if (d.rclose !== void 0) el.remove();
  });
  async function notifDiag() {
    const dg = $("#notifDiag");
    if (!dg) return;
    let sw = "tidak tersedia";
    if (location.protocol === "file:") sw = "tidak tersedia (halaman dibuka dari file lokal)";
    else if ("serviceWorker" in navigator) {
      try {
        const g = await navigator.serviceWorker.getRegistration();
        sw = g ? g.active ? "aktif" : "terdaftar, belum aktif" : "belum terdaftar" + (state.swErr ? " (" + state.swErr + ")" : "");
      } catch {
        sw = "gagal dicek";
      }
    }
    const perm = "Notification" in window ? Notification.permission : "tidak didukung", sec = window.isSecureContext ? "ya" : "tidak";
    dg.innerHTML = "<b>Status notifikasi</b><br>Izin browser: <b>" + esc(perm) + "</b> \xB7 Halaman https/localhost: <b>" + sec + "</b> \xB7 Service worker: <b>" + esc(sw) + "</b>" + (state.lastNotif ? "<br>Tes terakhir: " + esc(state.lastNotif) : "") + (perm === "granted" ? "<br>Kalau semua sudah baik tapi banner belum muncul saat kamu di tab lain, cek mode Jangan Ganggu atau Focus Assist di sistem, dan pastikan notifikasi untuk browser diizinkan di pengaturan komputer/HP." : "");
  }
  function renderRemindUI() {
    notifDiag();
    const p = "Notification" in window ? Notification.permission : "unsupported";
    $("#enableNotif").classList.toggle("hidden", p !== "default");
    $("#remindText").innerHTML = location.protocol === "file:" ? "<b>Halaman dibuka dari file lokal.</b> Browser biasanya memblokir notifikasi di sini, jadi pengingat hanya terlihat di dalam halaman ini (di tab lain hanya judul tab yang berkedip dan terdengar bunyi). Buka lewat <b>http://localhost</b> untuk mencoba notifikasi browser." : p === "granted" ? "<b>Pengingat aktif.</b> Notifikasi muncul dari DETACNE selama halaman ini terbuka di browser (boleh di tab lain), dan tetap tampil lewat service worker bila dibuka dari localhost/HTTPS." : p === "denied" ? "<b>Notifikasi browser diblokir.</b> Pengingat tetap muncul di dalam halaman DETACNE selama halaman terbuka. Untuk mengaktifkannya, izinkan notifikasi di pengaturan situs browser." : "<b>Pengingat dari DETACNE sendiri.</b> Pengingat muncul di halaman ini saat waktunya tiba, tanpa perlu aplikasi lain. Aktifkan notifikasi browser supaya tetap terlihat saat kamu di tab lain.";
  }
  $("#enableNotif").addEventListener("click", () => {
    try {
      Promise.resolve(Notification.requestPermission()).then((p) => {
        renderRemindUI();
        if (p === "granted") {
          toast("Notifikasi browser aktif.");
          try {
            new Notification("DETACNE", { body: "Notifikasi aktif. Pengingat rutinitas akan muncul seperti ini." });
          } catch {
          }
        }
      }).catch(() => renderRemindUI());
    } catch {
      toast("Browser ini tidak mendukung notifikasi.");
    }
  });
  $("#testNow").addEventListener("click", () => {
    const send = () => {
      if (!("Notification" in window)) {
        toast("Browser ini tidak mendukung notifikasi.");
        return;
      }
      if (Notification.permission !== "granted") {
        state.lastNotif = "tidak dikirim, izin notifikasi: " + notifStatus();
        notifDiag();
        toast("Notifikasi belum diizinkan.");
        return;
      }
      showNotif("DETACNE \xB7 Tes notifikasi", { body: "Kalau kamu melihat ini, notifikasi berfungsi.", tag: "detacne-test-" + Date.now(), requireInteraction: true, icon: "icon-192.png", badge: "icon-192.png" }).then((via) => {
        state.lastNotif = "\u2713 Notifikasi dikirim lewat " + via + ". Kalau tidak terlihat di layar, berarti diblokir sistem (Focus Assist atau Jangan Ganggu).";
        notifDiag();
        toast("Notifikasi tes dikirim.");
      }).catch((err) => {
        state.lastNotif = "\u2717 Gagal: " + (err && err.message || err);
        notifDiag();
        toast("Notifikasi gagal dikirim.");
      });
    };
    if ("Notification" in window && Notification.permission === "default") {
      try {
        Promise.resolve(Notification.requestPermission()).then(() => {
          renderRemindUI();
          send();
        }).catch(send);
      } catch {
        send();
      }
    } else send();
  });
  $("#testRemind").addEventListener("click", () => {
    unlockAudio();
    const run = () => {
      toast("Pindah ke tab lain sekarang. Pengingat contoh muncul 5 detik lagi.");
      setTimeout(() => {
        const n = new Date(), hh = String(n.getHours()).padStart(2, "0") + ":" + String(n.getMinutes()).padStart(2, "0");
        fireReminder({ id: "_test", name: "Cuci muka", time: hh }, n, true, "Waktunya: Cuci muka (contoh)");
      }, 5e3);
    };
    if ("Notification" in window && Notification.permission === "default") {
      try {
        Promise.resolve(Notification.requestPermission()).then(() => {
          renderRemindUI();
          run();
        }).catch(run);
      } catch {
        run();
      }
    } else run();
  });
  checkReminders();
  setInterval(checkReminders, 2e4);
  try {
    const w = new Worker(URL.createObjectURL(new Blob(["setInterval(()=>postMessage(1),15000)"], { type: "text/javascript" })));
    w.onmessage = () => checkReminders();
  } catch {
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      clearInterval(titleTimer);
      document.title = baseTitle;
      checkReminders();
    }
  });
  const ARTICLE_CATS = ["Dasar jerawat", "Perawatan kulit", "Makanan & gaya hidup", "Produk & bahan aktif", "Mitos & fakta"];
  const NOIMG = "data:image/svg+xml;base64," + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><rect width="800" height="500" fill="#f6eaee"/><g fill="none" stroke="#d3b2bd" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><rect x="325" y="185" width="150" height="130" rx="20"/><circle cx="370" cy="232" r="14"/><path d="M331 298 L392 244 L430 278 L453 258 L469 272"/></g></svg>');
  const ART = Array(12).fill(NOIMG);
  const CAT_ART = { "Dasar jerawat": 3, "Perawatan kulit": 0, "Makanan & gaya hidup": 1, "Produk & bahan aktif": 4, "Mitos & fakta": 2 };
  const OLD_IMG_RE = /^https?:\/\/(loremflickr\.com|commons\.wikimedia\.org|picsum\.photos)\//;
  const DEFAULT_IMG = ART;
  const BASE_FEATURED = ["b0", "b1", "b2", "b4", "b5"], MINI_BG = ["#f3e4e8", "#f1e5e8", "#f5edcc", "#eee9fa"];
  const BASE_DATES = ["2026-10-28", "2026-10-25", "2026-10-22", "2026-10-19", "2026-10-16", "2026-10-13", "2026-10-10", "2026-10-07", "2026-10-04", "2026-10-01", "2026-09-28", "2026-09-25"];
  const fmtDate = (d) => {
    const x = new Date(d + "T00:00:00");
    return isNaN(x) ? "" : new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(x);
  };
  const todayKey = () => {
    const n = new Date();
    return n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0") + "-" + String(n.getDate()).padStart(2, "0");
  };
  function seedArticles() {
    articles.forEach((a, i) => {
      a.id = "b" + i;
      a.img = DEFAULT_IMG[i] || "";
      a.featured = BASE_FEATURED.includes(a.id);
      a.date = BASE_DATES[i] || "2026-10-01";
    });
  }
  seedArticles();
  (function() {
    let st = null;
    try {
      st = JSON.parse(localStorage.getItem("detacneArticlesV2") || "null");
    } catch {
    }
    if (Array.isArray(st)) {
      articles.splice(0, articles.length, ...st);
      articles.forEach((a) => {
        const m = /^b(\d+)$/.exec(a.id || "");
        if (m && (!a.img || OLD_IMG_RE.test(a.img))) a.img = ART[+m[1]] || "";
        else if (!m && OLD_IMG_RE.test(a.img || "")) a.img = "";
      });
      return;
    }
    try {
      const im = JSON.parse(localStorage.getItem("detacneArticleImgs") || "{}");
      articles.forEach((a) => {
        if (im[a.title]) a.img = im[a.title];
      });
      JSON.parse(localStorage.getItem("detacneArticles") || "[]").forEach((c, k) => articles.unshift({ ...c, id: "c" + k + Date.now().toString(36), featured: false }));
    } catch {
    }
  })();
  articles.forEach((a) => {
    if (!a.date) a.date = a.custom ? todayKey() : BASE_DATES[parseInt(String(a.id).slice(1))] || "2026-10-01";
  });
  articles.forEach((a) => {
    if (/^data:image\/svg\+xml/.test(a.img || "")) a.img = "";
  });
  const isAdmin = () => state.user?.role === "admin";
  const fbImg = (a) => ART[CAT_ART[a.category] ?? 10];
  const imgFor = (a) => a.img && !/^data:image\/svg\+xml/.test(a.img) ? a.img : NOIMG;
  const saveArticles = () => {
    try {
      localStorage.setItem("detacneArticlesV2", JSON.stringify(articles));
    } catch {
      toast("Penyimpanan penuh, perubahan tidak tersimpan.");
    }
    if (isAdmin() && state.route === "dashboard") setTimeout(renderAdminDash, 0);
  };
  const metaLabel = (a) => a.custom ? "Artikel DETACNE" : "Artikel";
  function renderLayout() {
    const f = articles.filter((a) => a.featured && a.status !== "draft").slice(0, 5), box = $("#articleLayout");
    if (!f.length) {
      box.innerHTML = "";
      return;
    }
    const [m, ...r] = f;
    box.innerHTML = `<article class="article-feature"><div class="article-art"></div><div class="article-text"><span class="tag">${esc(m.category)}</span><h3>${esc(m.title)}</h3><p>${esc(m.desc)}</p><div class="article-meta">${esc(m.read)} baca \xB7 ${metaLabel(m)}</div><button class="btn btn-primary" style="margin-top:15px" data-article="${esc(m.id)}">Baca artikel</button></div></article>` + (r.length ? `<div class="article-side">${r.map((a, i) => `<article class="article-mini"><div class="mini-art" style="background:${MINI_BG[i % 4]}"></div><div><span class="tag">${esc(a.category)}</span><h4>${esc(a.title)}</h4><p>${esc(a.read)} baca \xB7 ${metaLabel(a)}</p><button class="btn btn-ghost" data-article="${esc(a.id)}">Baca</button></div></article>`).join("")}</div>` : "");
  }
  function decorateArticles() {
    $("#addArticleBtn").style.display = isAdmin() ? "" : "none";
    $$("#view-articles [data-article]").forEach((b) => {
      const box = b.closest("article"), art = box && box.querySelector(".article-art,.mini-art");
      if (!art) return;
      const a = articles.find((x) => x.id === b.dataset.article);
      if (!a) return;
      art.querySelectorAll("img,.art-edit").forEach((n) => n.remove());
      const im = document.createElement("img");
      im.src = imgFor(a);
      im.alt = a.title;
      im.loading = "lazy";
      im.referrerPolicy = "no-referrer";
      im.onerror = () => {
        if (im.src !== fbImg(a)) {
          im.src = fbImg(a);
        } else {
          im.onerror = null;
          im.remove();
        }
      };
      art.appendChild(im);
      if (isAdmin()) {
        const e = document.createElement("button");
        e.type = "button";
        e.className = "art-edit";
        e.dataset.editArticle = a.id;
        e.innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-pen"/></svg> Edit';
        art.appendChild(e);
      }
    });
  }
  function articleForm(a) {
    const edit = !!a;
    return `<label class="form-field"><span>Judul</span><input class="input" id="afTitle" value="${esc(a?.title || "")}"></label>
<label class="form-field"><span>Kategori</span><select class="input" id="afCat">${ARTICLE_CATS.map((x) => `<option${a?.category === x ? " selected" : ""}>${esc(x)}</option>`).join("")}</select></label>
<label class="form-field"><span>Waktu baca (menit)</span><input class="input" id="afRead" type="number" min="1" max="60" value="${parseInt(a?.read) || 5}"></label>
<label class="form-field"><span>Ringkasan</span><textarea class="input" id="afDesc" rows="2">${esc(a?.desc || "")}</textarea></label>
<label class="form-field"><span>Isi artikel (pisahkan paragraf dengan baris kosong; kosong = teks contoh bawaan)</span><textarea class="input" id="afBody" rows="8">${esc(a?.body || "")}</textarea></label>
<label class="form-field"><span>Link foto (https://...)</span><input class="input" id="afImg" type="url" placeholder="https://..." value="${esc(a && /^https?:\/\//i.test(a.img || "") ? a.img : "")}"></label>
<p class="small">Pakai link langsung ke gambar (.jpg/.png/.webp). Jika kosong atau link gagal dimuat, yang tampil ikon gambar kosong.</p>
<label class="form-field"><span>Status</span><select class="input" id="afStatus"><option value="published">Terbit</option><option value="draft"${a?.status === "draft" ? " selected" : ""}>Draf (tidak tampil ke pengunjung)</option></select></label>
<label class="form-field" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="afFeat"${a?.featured ? " checked" : ""}><span style="margin:0">Tampilkan di bagian atas halaman (maks. 5 artikel)</span></label>
<div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap"><button class="btn btn-primary" type="button" data-save-article="${esc(a?.id || "")}" data-mode="${edit ? "edit" : "new"}">Simpan</button>${edit ? `<button class="btn btn-outline" type="button" data-move-article="${esc(a.id)}" data-dir="-1">\u25B2 Naikkan</button><button class="btn btn-outline" type="button" data-move-article="${esc(a.id)}" data-dir="1">\u25BC Turunkan</button><button class="btn btn-outline" type="button" data-del-article="${esc(a.id)}">Hapus</button>` : ""}</div>
${edit ? "" : `<p class="small" style="margin-top:14px"><a href="#/articles" data-reset-articles style="text-decoration:underline">Pulihkan semua artikel bawaan</a> (artikel buatanmu ikut terhapus)</p>`}`;
  }
  document.addEventListener("click", (e) => {
    if (!isAdmin()) return;
    if (e.target.closest("#addArticleBtn")) {
      openModal("Tambah artikel", articleForm(null));
      return;
    }
    if (e.target.closest("#adminAddArticle")) {
      openModal("Tambah artikel", articleForm(null));
      return;
    }
    if (e.target.closest("[data-reset-articles]")) {
      e.preventDefault();
      if (confirm("Kembalikan semua artikel ke bawaan? Semua perubahan dan artikel buatanmu akan hilang.")) {
        articles.length = 0;
        articles.push(...JSON.parse(JSON.stringify(BASE_ARTICLES)));
        seedArticles();
        localStorage.removeItem("detacneArticlesV2");
        logAct("Memulihkan artikel bawaan");
        closeModal();
        renderArticles();
        if (state.route === "dashboard") renderAdminDash();
        toast("Artikel bawaan dipulihkan.");
      }
      return;
    }
    const ed = e.target.closest("[data-edit-article]");
    if (ed) {
      const a = articles.find((x) => x.id === ed.dataset.editArticle);
      if (a) openModal("Ubah artikel", articleForm(a));
      return;
    }
    const dl = e.target.closest("[data-del-article]");
    if (dl) {
      const i = articles.findIndex((x) => x.id === dl.dataset.delArticle);
      if (i >= 0 && confirm('Hapus artikel "' + articles[i].title + '"?')) {
        logAct("Menghapus artikel: " + articles[i].title);
        articles.splice(i, 1);
        saveArticles();
        closeModal();
        renderArticles();
        if (state.route === "article") go("dashboard?tab=artikel");
        toast("Artikel dihapus.");
      }
      return;
    }
    const mv = e.target.closest("[data-move-article]");
    if (mv) {
      const i = articles.findIndex((x) => x.id === mv.dataset.moveArticle), j = i + Number(mv.dataset.dir);
      if (i < 0 || j < 0 || j >= articles.length) {
        toast("Sudah di posisi paling " + (j < 0 ? "atas" : "bawah") + ".");
        return;
      }
      [articles[i], articles[j]] = [articles[j], articles[i]];
      saveArticles();
      renderArticles();
      toast("Urutan diubah.");
      return;
    }
    const sv = e.target.closest("[data-save-article]");
    if (sv) {
      const img = $("#afImg").value.trim();
      if (img && !/^https?:\/\//i.test(img)) {
        toast("Link foto harus diawali http:// atau https://");
        return;
      }
      const t = $("#afTitle").value.trim(), d = $("#afDesc").value.trim();
      if (!t || !d) {
        toast("Judul dan ringkasan wajib diisi.");
        return;
      }
      const f = { title: t, category: $("#afCat").value, read: (parseInt($("#afRead").value) || 5) + " menit", desc: d, body: $("#afBody").value.trim(), img, featured: $("#afFeat").checked, status: $("#afStatus").value };
      if (sv.dataset.mode === "edit") {
        const a = articles.find((x) => x.id === sv.dataset.saveArticle);
        if (!a) return;
        Object.assign(a, f);
      } else articles.unshift({ ...f, id: "c" + Date.now().toString(36), emoji: "pen", custom: true, date: todayKey() });
      logAct((sv.dataset.mode === "edit" ? "Mengubah artikel: " : "Menambah artikel: ") + t);
      saveArticles();
      closeModal();
      renderArticles();
      if (state.route === "article") renderArticlePage();
      toast(sv.dataset.mode === "edit" ? "Artikel diperbarui." : "Artikel ditambahkan.");
    }
  });
  const rp = document.createElement("div");
  rp.id = "readProgress";
  document.body.appendChild(rp);
  {
    const tb = $(".topbar"), tt = $("#toTop");
    let tick = false, lastS = false, lastT = false, lastW = "0";
    window.addEventListener("scroll", () => {
      if (tick) return;
      tick = true;
      requestAnimationFrame(() => {
        tick = false;
        const y = scrollY;
        let w = "0";
        if (state.route === "article") {
          const h = document.documentElement.scrollHeight - innerHeight;
          if (h > 0) w = Math.min(100, y / h * 100) + "%";
        }
        if (w !== lastW) {
          lastW = w;
          rp.style.width = w;
        }
        const a = y > 8, b = y > 600;
        if (a !== lastS) {
          lastS = a;
          tb.classList.toggle("scrolled", a);
        }
        if (b !== lastT) {
          lastT = b;
          tt.classList.toggle("show", b);
        }
      });
    }, { passive: true });
  }
  const RV = ".feature-card,.how .step,.faq details,.cta-band,.article-card,.article-feature,.article-mini,.stat,.card,.product,.step-card,.post,.hero-visual";
  const rvIO = new IntersectionObserver((es) => es.forEach((x) => {
    if (x.isIntersecting) {
      x.target.classList.add("in");
      rvIO.unobserve(x.target);
      setTimeout(() => {
        x.target.classList.remove("rv", "in");
        x.target.style.transitionDelay = "";
      }, 900);
    }
  }), { threshold: 0.08 });
  function revealInit() {
    $$(".view.active " + RV.split(",").join(",.view.active ")).forEach((el, i) => {
      if (el.dataset.rv) return;
      el.dataset.rv = "1";
      el.style.transitionDelay = Math.min(i % 6, 5) * 60 + "ms";
      el.classList.add("rv");
      rvIO.observe(el);
    });
  }
  const CAT_CLS = { "Dasar jerawat": "cat-dasar", "Perawatan kulit": "cat-rawat", "Makanan & gaya hidup": "cat-makan", "Produk & bahan aktif": "cat-produk", "Mitos & fakta": "cat-mitos" };
  function paintTags() {
    $$(".tag").forEach((t) => {
      const c = CAT_CLS[t.textContent.trim()];
      if (c && !t.classList.contains(c)) t.classList.add(c);
    });
  }
  let ptT;
  new MutationObserver(() => {
    clearTimeout(ptT);
    ptT = setTimeout(paintTags, 30);
  }).observe(document.body, { childList: true, subtree: true });
  $("#toTop").addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));
  window.addEventListener("hashchange", () => setTimeout(renderArticles, 0));
  $("#registerForm").elements.birthdate.max = dateKey(new Date());
  routeFromHash();
  renderCalendar();
  renderArticles();
  API.articles.list().then((l) => { articles = l; renderArticles(); }).catch(() => {});
}
