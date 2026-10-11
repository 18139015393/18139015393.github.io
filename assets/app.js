/* 马子玉作品集 · 交互脚本（无依赖） */
(() => {
  const D = window.PORTFOLIO;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const img = (id, thumb = true) => `assets/works/${id}${thumb ? "-t" : ""}.webp`;
  const vsrc = id => `assets/video/${id}.mp4`;
  const vposter = id => `assets/video/${id}.webp`;
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
  const hoverable = matchMedia("(hover: hover)").matches;

  /* ---------------- toast & copy ---------------- */
  const toast = msg => {
    const t = $("#toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 1800);
  };
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-copy]");
    if (!b) return;
    const v = b.dataset.copy;
    (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject())
      .then(() => toast(`已复制：${v}`))
      .catch(() => { prompt("复制下面的内容：", v); });
  });

  /* ---------------- lightbox ---------------- */
  const lb = $("#lb"), stage = $("#lbStage"), cap = $("#lbCap"), cnt = $("#lbCount");
  let list = [], idx = 0, lastFocus = null;
  const render = () => {
    const it = list[idx];
    stage.innerHTML = "";
    let el;
    if (it.type === "video") {
      el = document.createElement("video");
      Object.assign(el, { src: it.src, poster: it.poster, controls: true, autoplay: true, playsInline: true, loop: true });
    } else {
      el = new Image();
      el.alt = it.caption || "作品大图";
      el.src = it.thumb;                          // instant low-res
      const hi = new Image(); hi.onload = () => { if (list[idx] === it) el.src = it.src; }; hi.src = it.src;
    }
    stage.appendChild(el);
    cap.textContent = it.caption || "";
    cnt.textContent = list.length > 1 ? `${idx + 1} / ${list.length}` : "";
    $(".lb-prev").style.visibility = $(".lb-next").style.visibility = list.length > 1 ? "visible" : "hidden";
    // preload neighbours
    [idx + 1, idx - 1].forEach(j => { const n = list[(j + list.length) % list.length]; if (n && n.type !== "video") new Image().src = n.src; });
  };
  const open = (items, i) => {
    list = items; idx = i; lastFocus = document.activeElement;
    lb.hidden = false; document.body.style.overflow = "hidden";
    render(); $(".lb-close").focus();
  };
  const close = () => {
    lb.hidden = true; stage.innerHTML = ""; document.body.style.overflow = "";
    lastFocus && lastFocus.focus && lastFocus.focus();
  };
  const go = d => { idx = (idx + d + list.length) % list.length; render(); };
  $(".lb-close").onclick = close;
  $(".lb-prev").onclick = () => go(-1);
  $(".lb-next").onclick = () => go(1);
  lb.addEventListener("click", e => { if (e.target === lb || e.target === stage) close(); });
  document.addEventListener("keydown", e => {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowLeft") go(-1);
  });
  let tx = null;
  stage.addEventListener("touchstart", e => { tx = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener("touchend", e => {
    if (tx == null) return;
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    tx = null;
  });

  /* ---------------- image gallery ---------------- */
  const CATS = {
    comics:   { label: "漫画类",   grid: true,  desc: "原创 IP 条漫与四格漫画 —— 治愈、日常、搞笑向，共 6 组连载。" },
    illus:    { label: "插画类",   grid: false, desc: "角色插画、Q 版头像、节日海报与同人创作。" },
    campus:   { label: "校园作品", grid: false, desc: "在校期间的课程与竞赛作品：场景、角色设定、分镜与国风插画。" },
    stickers: { label: "表情包类", grid: false, desc: "IP 表情包设计，覆盖静态与动态两种形式。" },
    layout:   { label: "排版类",   grid: false, desc: "活动海报与宣传物料排版。" },
  };
  const gallery = $("#gallery"), desc = $("#filterDesc");
  $$(".filter button").forEach(b => { b.querySelector("i").textContent = D[b.dataset.cat].length; });

  const toItems = (arr, label) => arr.map((w, i) => ({
    type: "img", src: img(w.id, false), thumb: img(w.id), caption: `${label} · ${String(i + 1).padStart(2, "0")}`,
  }));

  const tile = (w, i, items, extraClass = "") => {
    const f = document.createElement("figure");
    f.className = "tile " + extraClass + (i % 7 === 3 ? " taped" : "");
    f.style.setProperty("--d", `${Math.min(i, 16) * 35}ms`);
    f.style.setProperty("--tilt", `${(i % 2 ? 1 : -1) * (0.6 + (i % 3) * 0.4)}deg`);
    f.tabIndex = 0;
    f.innerHTML = `<img src="${img(w.id)}" width="${w.w}" height="${w.h}" loading="lazy" decoding="async" alt="${items[i].caption}">`;
    const openIt = () => open(items, i);
    f.onclick = openIt;
    f.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openIt(); } };
    return f;
  };

  const showCat = cat => {
    const conf = CATS[cat], arr = D[cat], items = toItems(arr, conf.label);
    gallery.className = "gallery" + (conf.grid ? " grid" : "");
    gallery.innerHTML = "";
    desc.textContent = conf.desc;
    let lastGroup = -1;
    arr.forEach((w, i) => {
      if (conf.grid && w.group !== undefined && w.group !== lastGroup) {
        lastGroup = w.group;
        const h = document.createElement("div");
        h.className = "ep"; h.textContent = `EPISODE ${String(w.group + 1).padStart(2, "0")}`;
        gallery.appendChild(h);
      }
      gallery.appendChild(tile(w, i, items));
    });
    $$(".filter button").forEach(b => b.setAttribute("aria-selected", b.dataset.cat === cat));
  };
  $$(".filter button").forEach(b => b.onclick = () => showCat(b.dataset.cat));
  showCat("comics");

  /* merch */
  const merchItems = toItems(D.merch, "同人制品");
  const merchEl = $("#merch"), merchCol = document.createElement("div");
  merchCol.className = "merch-col";
  D.merch.forEach((w, i) => (i < 2 ? merchEl : merchCol).appendChild(tile(w, i, merchItems))); // 2 posters + 3 small items
  merchEl.appendChild(merchCol);

  /* ---------------- video grids ---------------- */
  const vItems = arr => arr.map(v => ({ type: "video", src: vsrc(v.id), poster: vposter(v.id), caption: v.title }));

  const vcard = (v, i, items, opts = {}) => {
    const f = document.createElement("figure");
    f.className = "vcard";
    f.tabIndex = 0;
    const ratio = opts.ratio || `${v.w} / ${v.h}`;
    f.innerHTML = `
      <div class="vthumb" style="aspect-ratio:${ratio}">
        <img src="${vposter(v.id)}" alt="${v.title || "动画作品"} 封面" loading="lazy" decoding="async">
        <video muted loop playsinline preload="none"></video>
        <span class="play" aria-hidden="true"></span>
        <span class="dur">${fmt(v.dur)}</span>
      </div>
      <figcaption>${opts.tag ? `<span class="tag">${opts.tag}</span>` : `<span>${v.title || "原创短片"}</span>`}<small>${v.w > v.h ? "横屏" : v.w === v.h ? "方形" : "竖屏"}</small></figcaption>`;
    const video = f.querySelector("video");
    if (hoverable) {
      f.addEventListener("mouseenter", () => {
        if (!video.src) video.src = vsrc(v.id);
        video.play().then(() => f.classList.add("playing")).catch(() => {});
      });
      f.addEventListener("mouseleave", () => { video.pause(); f.classList.remove("playing"); });
    }
    const openIt = () => { video.pause(); f.classList.remove("playing"); open(items, i); };
    f.onclick = openIt;
    f.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openIt(); } };
    return f;
  };

  const i2d = vItems(D.anim2d);
  D.anim2d.forEach((v, i) => $("#grid2d").appendChild(vcard(v, i, i2d)));

  const i3d = vItems(D.anim3d);
  const feat = $("#feature3d");
  feat.appendChild(vcard(D.anim3d[0], 0, i3d, { tag: "产品宣发片" }));
  feat.appendChild(vcard(D.anim3d[1], 1, i3d, { tag: "产品展示" }));
  D.anim3d.slice(2).forEach((v, k) => $("#grid3d").appendChild(vcard(v, k + 2, i3d, { ratio: "3 / 4" })));

  /* ---------------- resume ---------------- */
  $("[data-resume]").onclick = () => open([{ type: "img", src: "assets/deco/resume.webp", thumb: "assets/deco/resume.webp", caption: "马子玉 · 个人简历" }], 0);

  /* ---------------- nav: burger, active tab, progress ---------------- */
  const nav = $(".nav"), burger = $(".burger");
  burger.onclick = () => { const o = nav.classList.toggle("open"); burger.setAttribute("aria-expanded", o); };
  $$(".tabs a").forEach(a => a.addEventListener("click", () => { nav.classList.remove("open"); burger.setAttribute("aria-expanded", false); }));

  const tabs = $$(".tabs a");
  const secObs = new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      tabs.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("section[id]").forEach(s => secObs.observe(s));

  const bar = $(".progress span");
  const onScroll = () => {
    const h = document.documentElement;
    bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100 + "%";
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------------- reveal + counters ---------------- */
  const rev = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("in"); rev.unobserve(e.target); }
  }), { threshold: 0.12 });
  $$(".reveal").forEach(el => rev.observe(el));

  const cntObs = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    cntObs.unobserve(e.target);
    const el = e.target, to = +el.dataset.count, t0 = performance.now(), dur = 1400;
    const step = t => {
      const p = Math.min(1, (t - t0) / dur), ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * ease);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }), { threshold: 0.6 });
  $$("[data-count]").forEach(el => cntObs.observe(el));
})();
