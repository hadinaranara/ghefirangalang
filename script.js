/* ===== PENGATURAN — ubah di sini ===== */
const CONFIG = {
  weddingDate: "2026-11-21T08:00:00+07:00", // waktu akad (WIB)
  eventTitle: "Pernikahan Ghefira & Galang",
  location: "Gedung Pernikahan, Bogor"
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const pointer = { x: 0, y: 0, tx: 0, ty: 0 }; // posisi mouse/tilt (-1..1)
let scrollY = 0;

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast.id); toast.id = setTimeout(() => t.classList.remove("show"), 2200);
}

/* Samakan lebar tulisan nama dengan lebar panggung (tetap pas walau font berbeda/ belum termuat) */
function fitNames() {
  const h = $(".op-names"), s = h && h.firstElementChild; if (!s) return;
  h.style.fontSize = "";
  const target = Math.min(h.clientWidth * .86, innerWidth * .92), w = s.getBoundingClientRect().width;
  if (w) h.style.fontSize = (parseFloat(getComputedStyle(h).fontSize) * target / w) + "px";
}

/* Cover: urutan sinematik. Ubah angka milidetik untuk mengatur tempo */
function initCover() {
  fitNames(); addEventListener("resize", fitNames); if (document.fonts) document.fonts.ready.then(fitNames);
  const cover = $("#cover"), env = $(".env"); let timers = [], done = false, started = false;
  const at = (ms, fn) => timers.push(setTimeout(fn, reduced ? 0 : ms));
  const add = c => () => cover.classList.add(c);
  function reveal() {                                   // 5) kamera zoom out + halaman utama muncul
    if (done) return; done = true; timers.forEach(clearTimeout);
    cover.classList.add("out"); env.classList.add("cam");
    $("#main").hidden = false; $("#musicBtn").hidden = false;
    document.body.classList.remove("locked"); scrollTo(0, 0);
    setTimeout(initScrollAnimations, reduced ? 0 : 600);
    initButterflies();
  }
  $("#openBtn").addEventListener("click", () => {
    if (started) return; started = true;
    cover.classList.add("opening", "zoom");            // 1) zoom masuk ke pintu wayang, pintu terbuka
    at(2900, add("show"));                             // 2) satu wayang muncul
    at(4100, add("fan"));                              // 3) wayang mengipas menjadi banyak
    at(5800, add("bloom"));                            // 4) bunga muncul satu per satu
    at(7000, add("write"));                            // 5) nama ditulis
    at(7400, add("flutter"));                              // 6) kupu-kupu muncul & terbang
    at(10300, reveal);                                 // 7) masuk ke halaman utama
    setTimeout(() => cover.addEventListener("click", reveal), 500); // ketuk untuk skip
    $("#bgm").play().then(() => $("#musicBtn").classList.add("on")).catch(() => {});
  });
}

/* Kupu-kupu: terbang halus & realistis di halaman utama.
   Ubah angka di CONFIG kecil di bawah untuk mengatur kecepatan dan jumlah. */
function initButterflies() {
  const src = ($(".op-bf") || {}).src;
  if (reduced || !src || $(".bfm")) return;
  const SPEED = [28, 55];            // kecepatan jelajah (px per detik) — makin kecil makin lambat
  const COUNT = innerWidth < 600 ? 4 : 6;
  const layer = document.createElement("div"); layer.className = "bfm"; layer.setAttribute("aria-hidden", "true"); document.body.append(layer);
  const rnd = (a, c) => a + Math.random() * (c - a), clamp = (v, a, c) => Math.max(a, Math.min(c, v));
  const pick = b => { b.tx = rnd(30, innerWidth - 30); b.ty = rnd(40, innerHeight - 40); };
  const bs = Array.from({ length: COUNT }, () => {
    const wrap = document.createElement("div"), img = document.createElement("img");
    wrap.className = "bw"; wrap.style.width = rnd(26, 48) + "px"; img.src = src; img.alt = ""; wrap.append(img); layer.append(wrap);
    setTimeout(() => wrap.style.opacity = rnd(.8, 1), 100);
    const b = { wrap, img, x: rnd(0, innerWidth), y: -60, h: Math.PI / 2, spd: rnd(...SPEED), t: rnd(0, 10), ph: rnd(0, 6), amp: .55, glide: false, gt: rnd(1, 3) };
    pick(b); return b;
  });
  let last = performance.now();
  (function loop(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    bs.forEach(b => {
      b.t += dt;
      const dx = b.tx - b.x, dy = b.ty - b.y;
      if (Math.hypot(dx, dy) < 90) pick(b);
      // arah: menuju tujuan + lengkungan lembut; belok perlahan (tidak patah-patah)
      const want = Math.atan2(dy, dx) + Math.sin(b.t * .7) * .55;
      let diff = Math.atan2(Math.sin(want - b.h), Math.cos(want - b.h));
      b.h += clamp(diff * dt * 1.8, -1.2 * dt, 1.2 * dt);
      // pola kepakan: kepak cepat bergantian dengan meluncur pelan
      b.gt -= dt; if (b.gt < 0) { b.glide = !b.glide; b.gt = b.glide ? rnd(.6, 1.4) : rnd(1.5, 3.5); }
      b.ph += (b.glide ? 3 : 15) * dt;
      b.amp += ((b.glide ? .2 : .55) - b.amp) * Math.min(1, dt * 5);
      const flapV = .5 + .5 * Math.sin(b.ph);
      const speed = b.spd * (b.glide ? .75 : 1) * (.8 + .4 * flapV);   // laju sedikit berdenyut mengikuti kepakan
      b.x += Math.cos(b.h) * speed * dt; b.y += Math.sin(b.h) * speed * .8 * dt;
      const bob = Math.sin(b.ph) * (b.glide ? 1 : 3);                  // naik-turun kecil saat mengepak
      // Kepala kupu-kupu (butterfly.png) menghadap ATAS; 90 = putaran agar kepala mengikuti arah terbang.
      const heading = (b.h + 90 * Math.PI / 180) * 180 / Math.PI;
      b.wrap.style.transform = `translate3d(${b.x}px,${b.y + bob}px,0) rotate(${heading}deg)`;
      b.img.style.transform = `scaleX(${1 - b.amp * flapV})`;           // sayap membuka-menutup
    });
    requestAnimationFrame(loop);
  })(last);
}

/* Navigasi: smooth scroll (CSS) + highlight section aktif */
function initNavigation() {
  const links = $$(".nav a");
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(l => l.classList.toggle("active", l.hash === "#" + e.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach(s => io.observe(s));
}

/* Parallax 3D: mouse, device orientation, scroll -> satu loop rAF */
function initParallax() {
  if (reduced) return;
  const layers = $$(".layer"), env = $(".env");
  addEventListener("mousemove", e => {
    pointer.tx = e.clientX / innerWidth * 2 - 1; pointer.ty = e.clientY / innerHeight * 2 - 1;
  }, { passive: true });
  addEventListener("deviceorientation", e => {
    if (e.gamma == null) return;
    pointer.tx = Math.max(-1, Math.min(1, e.gamma / 30)); pointer.ty = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
  }, { passive: true });
  addEventListener("scroll", () => scrollY = window.scrollY, { passive: true });
  (function loop() {
    pointer.x += (pointer.tx - pointer.x) * 0.06; pointer.y += (pointer.ty - pointer.y) * 0.06; // easing halus
    layers.forEach(l => {
      const d = +l.dataset.depth;                         // 0.2 / 0.5 / 1
      const x = -pointer.x * 30 * d, y = -pointer.y * 30 * d - scrollY * 0.05 * d;
      l.style.transform = `translate3d(${x}px,${y}px,0) rotateX(${-pointer.y * 1.5 * d}deg) rotateY(${pointer.x * 1.5 * d}deg)`;
    });
    requestAnimationFrame(loop);
  })();
}

/* Partikel emas melayang (canvas, ringan) */
function initParticles() {
  const c = $("#particles"), ctx = c.getContext("2d");
  let ps = [];
  const size = () => { c.width = innerWidth; c.height = innerHeight; };
  size(); addEventListener("resize", size);
  const n = innerWidth < 600 ? 25 : 50;
  for (let i = 0; i < n; i++) ps.push({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, r: Math.random() * 2 + .5, vx: (Math.random() - .5) * .3, vy: -Math.random() * .4 - .1 });
  if (reduced) return;
  (function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "rgba(184,149,90,.55)";
    ps.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.y < -5) { p.y = c.height + 5; p.x = Math.random() * c.width; }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
    });
    requestAnimationFrame(draw);
  })();
}

/* Countdown */
function initCountdown() {
  const target = new Date(CONFIG.weddingDate).getTime();
  const pad = n => String(n).padStart(2, "0");
  const tick = () => {
    let s = Math.max(0, Math.floor((target - Date.now()) / 1000));
    const values = {
      d: pad(Math.floor(s / 86400)),
      h: pad(Math.floor(s % 86400 / 3600)),
      m: pad(Math.floor(s % 3600 / 60)),
      s: pad(s % 60)
    };
    for (const [unit, value] of Object.entries(values)) {
      $(`#cd-${unit}`).textContent = value;
      $(`#hero-cd-${unit}`).textContent = value;
      $(`#cover-cd-${unit}`).textContent = value;
    }
  };
  tick(); setInterval(tick, 1000);
  // Tombol kalender: unduh file .ics
  $("#calBtn").addEventListener("click", () => {
    const f = d => new Date(d).toISOString().replace(/[-:]|\.\d{3}/g, "");
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${CONFIG.eventTitle}\nDTSTART:${f(CONFIG.weddingDate)}\nDTEND:${f(new Date(target + 6 * 3600e3))}\nLOCATION:${CONFIG.location}\nEND:VEVENT\nEND:VCALENDAR`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" })); a.download = "wedding.ics"; a.click();
  });
}

/* Galeri + lightbox */
function initGallery() { $$(".g").forEach((img, i) => {
  img.addEventListener("click", () => openLightbox(i));
  img.addEventListener("keydown", e => e.key === "Enter" && openLightbox(i));
}); }
let lbIndex = 0;
function openLightbox(i) { lbIndex = i; showLb(); $("#lightbox").hidden = false; }
function showLb() { const imgs = $$(".g"); const im = imgs[(lbIndex + imgs.length) % imgs.length]; $("#lbImg").src = im.src; $("#lbImg").alt = im.alt; }
function initLightbox() {
  const lb = $("#lightbox"), step = d => { lbIndex += d; showLb(); };
  $("#lbClose").onclick = () => lb.hidden = true;
  $("#lbPrev").onclick = () => step(-1); $("#lbNext").onclick = () => step(1);
  lb.addEventListener("click", e => e.target === lb && (lb.hidden = true));
  addEventListener("keydown", e => {
    if (lb.hidden) return;
    if (e.key === "Escape") lb.hidden = true; if (e.key === "ArrowLeft") step(-1); if (e.key === "ArrowRight") step(1);
  });
}

/* Musik */
function initMusicPlayer() {
  const a = $("#bgm"), b = $("#musicBtn");
  b.addEventListener("click", () => {
    if (a.paused) a.play().then(() => b.classList.add("on")).catch(() => toast("Audio belum tersedia"));
    else { a.pause(); b.classList.remove("on"); }
  });
}

/* Salin nomor rekening */
function initCopyButton() {
  $$(".copy-account").forEach(button => {
    button.addEventListener("click", async () => {
      const num = button.closest(".gift").querySelector("b").textContent;
      try { await navigator.clipboard.writeText(num); }
      catch { const t = document.createElement("textarea"); t.value = num; document.body.append(t); t.select(); document.execCommand("copy"); t.remove(); }
      toast("Account number copied");
    });
  });
}

/* RSVP + ucapan (Supabase) */
function initRSVP() {
  const list = $("#wishList"), form = $("#rsvpForm"), status = $("#rsvpMsg");
  const localFile = location.protocol === "file:";
  const settings = window.SUPABASE_CONFIG;
  let client = null;
  if (settings?.url && settings?.anonKey && window.supabase?.createClient) {
    try {
      const projectUrl = new URL(settings.url);
      if (projectUrl.protocol !== "https:" || !projectUrl.hostname.endsWith(".supabase.co")) {
        throw new Error("URL harus berupa URL project Supabase, bukan alamat REST atau dashboard.");
      }
      client = window.supabase.createClient(projectUrl.origin, settings.anonKey);
    } catch (error) {
      console.error("Konfigurasi URL Supabase tidak valid:", error);
    }
  }
  const errorDetails = error => {
    const code = error?.code ? ` (${error.code})` : "";
    const message = error?.message || "Periksa koneksi internet dan konfigurasi Supabase.";
    return `${message}${code}`;
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function render(wishes) {
    list.innerHTML = wishes.map(w => `<article class="wish reveal"><b>${esc(w.name)}</b><p>${esc(w.message)}</p><small>${new Date(w.created_at).toLocaleDateString("id-ID")}</small></article>`).join("");
    $$(".wish", list).forEach(w => w.classList.add("in")); // langsung terlihat; animasi lewat transition
  }
  async function loadWishes() {
    if (localFile) {
      list.innerHTML = '<p class="wish">Jalankan halaman melalui server web, bukan file://, agar dapat terhubung ke Supabase.</p>';
      return;
    }
    if (!client) {
      list.innerHTML = '<p class="wish">Supabase belum terhubung. Periksa URL project pada supabase-config.js.</p>';
      return;
    }
    try {
      const { data, error } = await client.from("rsvps").select("name,message,created_at").neq("message", "").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      render(data);
    } catch (error) {
      console.error("Gagal memuat ucapan dari Supabase:", error);
      list.innerHTML = `<p class="wish">Ucapan gagal dimuat: ${esc(errorDetails(error))}</p>`;
    }
  }
  loadWishes();
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const name = $("#f-name").value.trim();
    const guests = Number($("#f-guests").value);
    const attendance = $("#f-att").value;
    const message = $("#f-msg").value.trim();
    if (!name || name.length > 100) { status.textContent = "Nama wajib diisi (maksimal 100 karakter)."; $("#f-name").focus(); return; }
    if (!Number.isInteger(guests) || guests < 1 || guests > 10) { status.textContent = "Jumlah tamu harus antara 1 dan 10."; $("#f-guests").focus(); return; }
    if (message.length > 1000) { status.textContent = "Ucapan maksimal 1000 karakter."; $("#f-msg").focus(); return; }
    if (localFile) { status.textContent = "Halaman dibuka dari file lokal. Jalankan melalui server web, misalnya http://localhost:8000."; return; }
    if (!client) { status.textContent = "Supabase belum terhubung. Periksa URL project dan anon key pada supabase-config.js."; return; }

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    status.textContent = "Mengirim konfirmasi...";
    try {
      const { error } = await client.from("rsvps").insert({ name, guests, attendance, message });
      if (error) throw error;
      form.reset();
      status.textContent = message
        ? `Terima kasih, ${name}! RSVP dan ucapan Anda berhasil dikirim.`
        : `Terima kasih, ${name}! Konfirmasi Anda berhasil dikirim.`;
      await loadWishes();
    } catch (error) {
      console.error("Gagal mengirim RSVP ke Supabase:", error);
      status.textContent = `Konfirmasi gagal dikirim: ${errorDetails(error)}`;
    } finally {
      submitButton.disabled = false;
    }
  });
}

/* Scroll animations (IntersectionObserver) + garis timeline + tilt foto */
function initScrollAnimations() {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    if (e.target.classList.contains("item")) e.target.parentElement.classList.add("go");
    io.unobserve(e.target);
  }), { threshold: .15 });
  $$(".reveal").forEach((el, i) => { el.style.transitionDelay = (i % 3) * 0.12 + "s"; io.observe(el); });
  $$(".tilt").forEach(f => { // efek miring 3D saat hover
    f.addEventListener("mousemove", e => {
      const r = f.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      f.style.transform = `perspective(600px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale(1.03)`;
    });
    f.addEventListener("mouseleave", () => f.style.transform = "");
  });
}

/* Custom cursor (desktop) */
function initCursor() {
  if (!matchMedia("(hover:hover) and (pointer:fine)").matches) return;
  document.body.classList.add("has-cursor");
  const dot = $(".cursor-dot"), ring = $(".cursor-ring");
  let mx = 0, my = 0, rx = 0, ry = 0;
  addEventListener("mousemove", e => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px)`; }, { passive: true });
  (function loop() { rx += (mx - rx) * .15; ry += (my - ry) * .15; ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(loop); })();
  document.addEventListener("mouseover", e => ring.classList.toggle("big", !!e.target.closest("a,button,img,input,select,textarea")));
}

document.addEventListener("DOMContentLoaded", () => {
  initCover(); initNavigation(); initParallax(); initParticles(); initCountdown();
  initGallery(); initLightbox(); initMusicPlayer(); initCopyButton(); initRSVP(); initCursor();
});
