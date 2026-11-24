"use strict";
const $ = (s, el = document) => el.querySelector(s);
const jobsEl = $("#jobs");
const cards = new Map(); // id -> {el, signature, clipSig}
let currentTab = "link";
let status = { platforms: {}, platform_names: {} };

async function api(path, opts = {}) {
  const json = opts.body && !(opts.body instanceof FormData);
  const res = await fetch(path, { ...opts, headers: { "X-Clipia": "1", ...(json ? { "Content-Type": "application/json" } : {}), ...(opts.headers || {}) } });
  if (res.status === 401) { location.href = "/login"; throw new Error("Sesión cerrada"); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Algo salió mal");
  return data;
}

function toast(msg, ms = 2800) {
  const t = $("#toast");
  t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), ms);
}

function fmtTime(s) {
  if (s == null) return "";
  s = Math.round(s);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(sec).padStart(2, "0");
}
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

// ---------- Opciones ----------
function options() {
  const [min, max] = $("#duration").value.split("-").map(Number);
  return {
    num_clips: Number($("#num_clips").value), min_seconds: min, max_seconds: max,
    layout: $("#layout").value, subtitle_style: $("#subtitle_style").value, language: $("#language").value,
    uppercase: $("#uppercase").checked, hook_title: $("#hook_title").checked,
    max_live_minutes: Number($("#max_live_minutes").value), live_chunk_minutes: Number($("#live_chunk_minutes").value),
    instructions: $("#instructions").value.trim(),
    auto_publish: [...document.querySelectorAll("#autopub input:checked")].map(i => i.value),
  };
}
const OPT_IDS = ["num_clips", "duration", "layout", "subtitle_style", "language", "max_live_minutes", "live_chunk_minutes", "uppercase", "hook_title"];
function saveOpts() {
  try {
    const o = {}; OPT_IDS.forEach(id => { const e = $("#" + id); o[id] = e.type === "checkbox" ? e.checked : e.value; });
    o.auto_publish = options().auto_publish;
    localStorage.setItem("clipia-opts", JSON.stringify(o));
  } catch {}
}
function savedOpts() { try { return JSON.parse(localStorage.getItem("clipia-opts") || "{}"); } catch { return {}; } }
function loadOpts() {
  const o = savedOpts();
  OPT_IDS.forEach(id => { const e = $("#" + id); if (id in o) e.type === "checkbox" ? (e.checked = o[id]) : (e.value = o[id]); });
}
OPT_IDS.forEach(id => $("#" + id).addEventListener("change", saveOpts));
loadOpts();

function renderAutopub() {
  const box = $("#autopub"); box.replaceChildren();
  const chosen = new Set(savedOpts().auto_publish || []);
  let any = false;
  for (const [p, name] of Object.entries(status.platform_names || {})) {
    const ready = !!status.platforms[p]; any = any || ready;
    const lab = el("label", "check" + (ready ? "" : " disabled"));
    const inp = el("input"); inp.type = "checkbox"; inp.value = p; inp.disabled = !ready; inp.checked = ready && chosen.has(p);
    inp.addEventListener("change", saveOpts);
    lab.append(inp, " " + name); box.append(lab);
  }
  $("#autopub-hint").textContent = any ? "Útil en directos: cada clip sale publicado en cuanto está listo." : "Conecta tus cuentas en «Conexiones» para activar esto.";
}

// ---------- Pestañas ----------
document.querySelectorAll(".tab").forEach(btn => btn.addEventListener("click", () => {
  currentTab = btn.dataset.tab;
  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b === btn));
  document.querySelectorAll(".tab-panel").forEach(p => (p.hidden = p.dataset.panel !== currentTab));
}));

// ---------- Subir archivo ----------
const fileInput = $("#file"), drop = $("#drop");
fileInput.addEventListener("change", () => { $("#file-label").textContent = fileInput.files[0]?.name || "Toca para elegir un video"; });
["dragover", "dragenter"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("over"); }));
["dragleave", "drop"].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove("over")));
drop.addEventListener("drop", e => {
  e.preventDefault();
  if (e.dataTransfer.files.length) { fileInput.files = e.dataTransfer.files; fileInput.dispatchEvent(new Event("change")); }
});

function uploadWithProgress(file, opts) {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file); fd.append("options", JSON.stringify(opts));
    const xhr = new XMLHttpRequest();
    const bar = $("#upload-progress"); bar.hidden = false;
    xhr.upload.onprogress = e => { if (e.lengthComputable) $("span", bar).style.width = (e.loaded / e.total * 100) + "%"; };
    xhr.onload = () => {
      bar.hidden = true;
      let data = {}; try { data = JSON.parse(xhr.responseText); } catch {}
      xhr.status < 300 ? resolve(data) : reject(new Error(data.detail || "No se pudo subir"));
    };
    xhr.onerror = () => { bar.hidden = true; reject(new Error("Se cortó la subida")); };
    xhr.open("POST", "/api/jobs/upload"); xhr.setRequestHeader("X-Clipia", "1"); xhr.send(fd);
  });
}

$("#job-form").addEventListener("submit", async e => {
  e.preventDefault();
  const err = $("#form-error"); err.hidden = true;
  const buttons = e.target.querySelectorAll("button[type=submit]");
  buttons.forEach(b => (b.disabled = true));
  try {
    if (currentTab === "link") {
      const url = $("#url").value.trim();
      if (!url) throw new Error("Pega un enlace primero");
      await api("/api/jobs", { method: "POST", body: JSON.stringify({ url, options: options() }) });
      $("#url").value = "";
      toast("¡En marcha! Si es un directo, verás los clips aparecer mientras sigue.");
    } else if (currentTab === "file") {
      const f = fileInput.files[0];
      if (!f) throw new Error("Elige un video primero");
      await uploadWithProgress(f, options());
      fileInput.value = ""; $("#file-label").textContent = "Toca para elegir un video o arrástralo aquí";
      toast("¡En marcha! Te avisamos aquí abajo cuando esté listo");
    } else {
      const url = $("#watch-url").value.trim();
      if (!url) throw new Error("Pega la dirección de tu canal");
      await api("/api/watchers", { method: "POST", body: JSON.stringify({ url, options: options() }) });
      $("#watch-url").value = "";
      toast("Canal vigilado. Cuando empiece un directo, arranca solo.");
      refreshWatchers();
    }
    refresh();
  } catch (ex) { err.textContent = ex.message; err.hidden = false; }
  finally { buttons.forEach(b => (b.disabled = false)); }
});

// ---------- Canales vigilados ----------
async function refreshWatchers() {
  try {
    const list = await api("/api/watchers");
    $("#watchers-section").hidden = !list.length;
    const box = $("#watchers"); box.replaceChildren();
    for (const w of list) {
      const row = el("div", "card watcher");
      const info = el("div", "watcher-info");
      const live = w.status && w.status.startsWith("en vivo");
      const title = el("div", "watcher-url"); if (live) title.append(el("span", "live-dot"));
      title.append(w.name || w.url);
      const last = w.last_check ? " · revisado " + new Date(w.last_check * 1000).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }) : "";
      info.append(title, el("div", "watcher-status muted", (w.enabled ? (w.status || "pendiente") : "en pausa") + last));
      const actions = el("div", "watcher-actions");
      const tog = el("button", "btn ghost small", w.enabled ? "Pausar" : "Reanudar"); tog.type = "button";
      tog.onclick = async () => { await api(`/api/watchers/${w.id}/toggle`, { method: "POST", body: JSON.stringify({ enabled: !w.enabled }) }); refreshWatchers(); };
      const del = el("button", "btn ghost small", "Quitar"); del.type = "button";
      del.onclick = async () => { if (!confirm("¿Dejar de vigilar este canal?")) return; await api(`/api/watchers/${w.id}`, { method: "DELETE" }); refreshWatchers(); };
      actions.append(tog, del); row.append(info, actions); box.append(row);
    }
  } catch {}
}

// ---------- Trabajos ----------
function actionButton(label, cls, fn) {
  const b = document.createElement(cls === "link" ? "a" : "button");
  b.className = "btn ghost small"; b.textContent = label;
  if (cls === "link") b.href = fn; else { b.type = "button"; b.addEventListener("click", fn); }
  return b;
}

function renderJob(job) {
  let entry = cards.get(job.id);
  if (!entry) {
    entry = { el: $("#job-tpl").content.firstElementChild.cloneNode(true), signature: "", clipSig: "" };
    cards.set(job.id, entry);
  }
  const { el: card } = entry;
  const clipSig = JSON.stringify(job.clips.map(c => [c.index, c.published]));
  const sig = [job.status, job.progress, job.message, job.title, clipSig].join("|");
  if (sig === entry.signature) return card;
  entry.signature = sig;

  const active = job.status === "queued" || job.status === "processing";
  const liveNow = active && job.is_live && job.live && job.live.recording;
  card.className = "card job " + job.status + (job.is_live && active ? " live" : "");
  const t = $(".job-title", card); t.replaceChildren();
  if (liveNow) t.append(el("span", "live-dot"));
  t.append(job.title || job.url);
  const meta = [];
  if (job.is_live) meta.push(liveNow ? "En vivo" : "Directo");
  if (job.duration) meta.push((job.is_live ? "Grabado " : "Duración ") + fmtTime(job.duration));
  if (job.status === "done") meta.push(job.clips.length + " clips" + (job.used_ai === false ? " · modo básico" : ""));
  meta.push(new Date(job.created * 1000).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" }));
  $(".job-meta", card).textContent = meta.join(" · ");
  $(".bar span", card).style.width = (job.status === "error" ? 100 : job.progress) + "%";
  $(".job-msg", card).textContent = job.status === "error" ? job.error : job.message;

  const actions = $(".job-actions", card); actions.replaceChildren();
  if (liveNow) actions.append(actionButton("Terminar grabación", "", async () => {
    if (!confirm("¿Dejar de grabar? Se sacan los clips de lo que falta y se termina.")) return;
    await api(`/api/jobs/${job.id}/stop-recording`, { method: "POST" }); toast("Cortando la grabación…");
  }));
  if (active) actions.append(actionButton("Cancelar", "", async () => {
    if (!confirm("¿Cancelar este trabajo?")) return;
    await api(`/api/jobs/${job.id}/cancel`, { method: "POST" }); refresh();
  }));
  if (job.clips.length && !active) actions.append(actionButton("Descargar todo (.zip)", "link", `/api/jobs/${job.id}/zip`));
  if (job.status === "error" || job.status === "cancelled") actions.append(actionButton("Reintentar", "", async () => { try { await api(`/api/jobs/${job.id}/retry`, { method: "POST" }); refresh(); } catch (e) { toast(e.message); } }));
  if (!active) actions.append(actionButton("Borrar", "", async () => {
    if (!confirm("¿Borrar este trabajo y sus clips?")) return;
    await api(`/api/jobs/${job.id}`, { method: "DELETE" }); cards.get(job.id)?.el.remove(); cards.delete(job.id); refresh();
  }));

  if (entry.clipSig !== clipSig) {
    const box = $(".clips", card);
    const existing = new Map([...box.children].map(c => [c.dataset.index, c]));
    const keep = new Set(job.clips.map(c => String(c.index)));
    for (const [idx, node] of existing) if (!keep.has(idx)) { node.remove(); existing.delete(idx); }
    job.clips.forEach((c, i) => {
      let node = existing.get(String(c.index));
      if (!node) { node = renderClip(job, c); box.insertBefore(node, box.children[i] || null); }
      renderPubStatus(node, c);
    });
    entry.clipSig = clipSig;
  }
  return card;
}

const PUB_LABEL = { queued: "en cola", uploading: "subiendo…", done: "publicado", error: "error" };
function renderPubStatus(node, c) {
  const box = $(".pub-status", node); box.replaceChildren();
  for (const [p, st] of Object.entries(c.published || {})) {
    const name = status.platform_names[p] || p;
    const isLink = st.status === "done" && st.url && st.url.startsWith("http");
    const pill = el(isLink ? "a" : "span", "pill " + st.status, `${name}: ${PUB_LABEL[st.status] || st.status}`);
    if (isLink) { pill.href = st.url; pill.target = "_blank"; pill.rel = "noopener"; pill.textContent += " ↗"; }
    if (st.status === "done" && st.url === "tiktok://inbox") pill.textContent = "TikTok: en tus borradores";
    if (st.error) pill.title = st.error;
    if (st.status === "error") pill.addEventListener("click", () => toast(st.error, 6000));
    box.append(pill);
  }
}

function clipText(c) { return [c.caption, (c.hashtags || []).map(h => "#" + h).join(" ")].filter(Boolean).join("\n\n"); }

function renderClip(job, c) {
  const node = $("#clip-tpl").content.firstElementChild.cloneNode(true);
  node.dataset.index = c.index;
  const v = $("video", node);
  v.src = `/media/${job.id}/${c.video}`; v.poster = `/media/${job.id}/${c.thumb}`;
  if (c.width > c.height) $(".player", node).classList.add("wide");
  $(".score", node).textContent = c.score ? `🔥 ${c.score}/100` : `Clip ${c.index}`;
  const from = c.live_start ?? c.start, to = c.live_end ?? c.end;
  $(".time", node).textContent = `${fmtTime(from)} → ${fmtTime(to)} · ${Math.round(c.duration)} s`;
  $(".clip-title", node).textContent = c.title;
  $(".clip-reason", node).textContent = c.reason;
  const text = clipText(c);
  $(".caption", node).value = text;
  const dl = $(".dl", node); dl.href = `/media/${job.id}/${c.video}?download=1`; dl.setAttribute("download", "");
  $(".copy", node).addEventListener("click", () => copyText(`${c.title}\n\n${text}`));

  // Compartir directo a TikTok / Instagram / YouTube desde el celular
  const share = $(".share", node);
  if (navigator.canShare && navigator.canShare({ files: [new File([""], "x.mp4", { type: "video/mp4" })] })) {
    share.hidden = false;
    share.addEventListener("click", async () => {
      share.disabled = true; share.textContent = "Preparando…";
      try {
        const blob = await (await fetch(`/media/${job.id}/${c.video}`)).blob();
        const file = new File([blob], `${c.title || "clip"}.mp4`.replace(/[\\/:*?"<>|]/g, ""), { type: "video/mp4" });
        await copyText(`${c.title}\n\n${text}`, true);
        await navigator.share({ files: [file], title: c.title, text: `${c.title}\n\n${text}` });
      } catch (e) { if (e.name !== "AbortError") toast("No se pudo compartir: " + e.message); }
      finally { share.disabled = false; share.textContent = "Compartir"; }
    });
  }
  $(".pub", node).addEventListener("click", () => openPublish(job, c));
  return node;
}

async function copyText(t, quiet) {
  try { await navigator.clipboard.writeText(t); }
  catch { const ta = el("textarea"); ta.value = t; document.body.append(ta); ta.select(); document.execCommand("copy"); ta.remove(); }
  if (!quiet) toast("Texto copiado");
}

// ---------- Publicar ----------
let pubTarget = null;
function openPublish(job, c) {
  pubTarget = { job, c };
  $("#pub-title").value = c.title || "";
  $("#pub-caption").value = clipText(c);
  $("#pub-error").hidden = true;
  const box = $("#pub-platforms"); box.replaceChildren();
  let any = false;
  for (const [p, name] of Object.entries(status.platform_names)) {
    const ready = !!status.platforms[p]; any = any || ready;
    const done = c.published && c.published[p] && c.published[p].status === "done";
    const lab = el("label", "check" + (ready ? "" : " disabled"));
    const inp = el("input"); inp.type = "checkbox"; inp.value = p; inp.disabled = !ready; inp.checked = ready && !done;
    lab.append(inp, " " + name + (done ? " (ya publicado)" : "")); box.append(lab);
  }
  $("#pub-hint").textContent = any ? "" : "No hay cuentas conectadas. Abre «Conexiones» o usa «Compartir» desde el celular.";
  $("#pub-dialog").showModal();
}
$("#pub-go").addEventListener("click", async () => {
  const platforms = [...document.querySelectorAll("#pub-platforms input:checked")].map(i => i.value);
  const err = $("#pub-error"); err.hidden = true;
  if (!platforms.length) { err.textContent = "Elige al menos una plataforma"; err.hidden = false; return; }
  try {
    const r = await api(`/api/jobs/${pubTarget.job.id}/clips/${pubTarget.c.index}/publish`, {
      method: "POST", body: JSON.stringify({ platforms, title: $("#pub-title").value, caption: $("#pub-caption").value }),
    });
    $("#pub-dialog").close();
    toast("Publicando en " + r.accepted.map(p => status.platform_names[p]).join(", ") + "…");
    refresh();
  } catch (e) { err.textContent = e.message; err.hidden = false; }
});

// ---------- Conexiones ----------
async function loadConnections() {
  const data = await api("/api/connections");
  for (const sec of document.querySelectorAll(".conn")) {
    const p = sec.dataset.platform, c = data[p];
    const red = $("[data-redirect]", sec); if (red) red.textContent = c.redirect_uri;
    for (const inp of sec.querySelectorAll("input, select")) {
      const v = c[inp.name];
      if (typeof v === "boolean") { inp.value = ""; inp.placeholder = v ? "(guardado)" : ""; }
      else if (v != null && v !== "") inp.value = v;
    }
    let state, ok;
    if (p === "meta") {
      ok = data.available.instagram || data.available.facebook;
      state = ok ? [c.ig_username && "@" + c.ig_username, c.page_name].filter(Boolean).join(" · ") || "conectado" : "sin conectar";
    } else {
      ok = data.available[p];
      state = ok ? "conectado" + (c.channel || c.account ? ": " + (c.channel || c.account) : "") : "sin conectar";
    }
    const pill = $("[data-state]", sec); pill.textContent = state; pill.className = "pill " + (ok ? "done" : "");
  }
}
document.querySelectorAll(".conn").forEach(sec => {
  const p = sec.dataset.platform;
  $("[data-save]", sec).addEventListener("click", async () => {
    const body = {}; sec.querySelectorAll("input, select").forEach(i => (body[i.name] = i.value));
    const err = $("#conn-error"); err.hidden = true;
    try { await api(`/api/connections/${p}`, { method: "POST", body: JSON.stringify(body) }); toast("Guardado"); await loadConnections(); loadStatus(); }
    catch (e) { err.textContent = e.message; err.hidden = false; }
  });
  $("[data-clear]", sec).addEventListener("click", async () => {
    if (!confirm("¿Desconectar y borrar estas credenciales?")) return;
    await api(`/api/connections/${p}`, { method: "DELETE" });
    sec.querySelectorAll("input").forEach(i => (i.value = ""));
    await loadConnections(); loadStatus();
  });
});
$("#open-conn").addEventListener("click", async () => { $("#conn-error").hidden = true; $("#conn-dialog").showModal(); try { await loadConnections(); } catch (e) { toast(e.message); } });
$("#conn-close").addEventListener("click", () => $("#conn-dialog").close());

// Vuelta de "Conectar mi canal"
(() => {
  const q = new URLSearchParams(location.search);
  if (q.get("connected")) toast("¡Cuenta conectada!", 4000);
  if (q.get("connect_error")) toast("No se pudo conectar: " + (q.get("msg") || ""), 7000);
  if (q.toString()) history.replaceState(null, "", "/");
})();

// ---------- Actualización periódica ----------
let timer;
async function refresh() {
  clearTimeout(timer);
  try {
    const jobs = await api("/api/jobs");
    if (!jobs.length) jobsEl.innerHTML = '<p class="muted">Todavía no hay nada. Pega tu primer enlace arriba.</p>';
    else {
      const ids = new Set(jobs.map(j => j.id));
      for (const [id, e] of cards) if (!ids.has(id)) { e.el.remove(); cards.delete(id); }
      const els = jobs.map(renderJob);
      if (jobsEl.firstElementChild?.tagName === "P") jobsEl.replaceChildren();
      els.forEach((e, i) => { if (jobsEl.children[i] !== e) jobsEl.insertBefore(e, jobsEl.children[i] || null); });
    }
    const busy = jobs.some(j => j.status === "queued" || j.status === "processing" ||
      j.clips.some(c => Object.values(c.published || {}).some(s => s.status === "queued" || s.status === "uploading")));
    timer = setTimeout(refresh, busy ? 3000 : 15000);
  } catch { timer = setTimeout(refresh, 5000); }
}

async function loadStatus() {
  try {
    status = await api("/api/status");
    const b = $("#ai-badge");
    b.textContent = status.ai ? "IA activa" : "Modo básico (sin IA)";
    b.className = "badge " + (status.ai ? "on" : "off");
    b.title = status.ai ? "Claude elige los momentos" : "Falta ANTHROPIC_API_KEY en el .env";
    renderAutopub();
  } catch {}
}

loadStatus().then(refresh);
refreshWatchers();
setInterval(refreshWatchers, 30000);
