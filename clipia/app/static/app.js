"use strict";
const $ = (s, el = document) => el.querySelector(s);
const jobsEl = $("#jobs");
const cards = new Map(); // id -> {el, signature}
let currentTab = "link";

async function api(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { "X-Clipia": "1", ...(opts.body && !(opts.body instanceof FormData) ? { "Content-Type": "application/json" } : {}), ...(opts.headers || {}) },
  });
  if (res.status === 401) { location.href = "/login"; throw new Error("Sesión cerrada"); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Algo salió mal");
  return data;
}

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), 2600);
}

function fmtTime(s) {
  if (s == null) return "";
  s = Math.round(s);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(sec).padStart(2, "0");
}

function options() {
  const [min, max] = $("#duration").value.split("-").map(Number);
  return {
    num_clips: Number($("#num_clips").value), min_seconds: min, max_seconds: max,
    layout: $("#layout").value, subtitle_style: $("#subtitle_style").value, language: $("#language").value,
    uppercase: $("#uppercase").checked, hook_title: $("#hook_title").checked,
    max_live_minutes: Number($("#max_live_minutes").value), instructions: $("#instructions").value.trim(),
  };
}

// Recordar las opciones elegidas en este navegador
const OPT_IDS = ["num_clips", "duration", "layout", "subtitle_style", "language", "max_live_minutes", "uppercase", "hook_title"];
function saveOpts() {
  try {
    const o = {}; OPT_IDS.forEach(id => { const el = $("#" + id); o[id] = el.type === "checkbox" ? el.checked : el.value; });
    localStorage.setItem("clipia-opts", JSON.stringify(o));
  } catch {}
}
function loadOpts() {
  try {
    const o = JSON.parse(localStorage.getItem("clipia-opts") || "{}");
    OPT_IDS.forEach(id => { const el = $("#" + id); if (id in o) el.type === "checkbox" ? (el.checked = o[id]) : (el.value = o[id]); });
  } catch {}
}
OPT_IDS.forEach(id => $("#" + id).addEventListener("change", saveOpts));
loadOpts();

// Pestañas
document.querySelectorAll(".tab").forEach(btn => btn.addEventListener("click", () => {
  currentTab = btn.dataset.tab;
  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b === btn));
  document.querySelectorAll(".tab-panel").forEach(p => (p.hidden = p.dataset.panel !== currentTab));
}));

// Archivo
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
    } else {
      const f = fileInput.files[0];
      if (!f) throw new Error("Elige un video primero");
      await uploadWithProgress(f, options());
      fileInput.value = ""; $("#file-label").textContent = "Toca para elegir un video o arrástralo aquí";
    }
    toast("¡En marcha! Te avisamos aquí abajo cuando esté listo");
    refresh();
  } catch (ex) { err.textContent = ex.message; err.hidden = false; }
  finally { buttons.forEach(b => (b.disabled = false)); }
});

// Lista de trabajos
function actionButton(label, cls, fn) {
  const b = document.createElement(cls === "link" ? "a" : "button");
  b.className = "btn ghost small"; b.textContent = label;
  if (cls === "link") b.href = fn; else { b.type = "button"; b.addEventListener("click", fn); }
  return b;
}

function renderJob(job) {
  let entry = cards.get(job.id);
  if (!entry) {
    const el = $("#job-tpl").content.firstElementChild.cloneNode(true);
    entry = { el, signature: "", clipCount: -1 };
    cards.set(job.id, entry);
  }
  const { el } = entry;
  const sig = [job.status, job.progress, job.message, job.title, job.clips.length].join("|");
  if (sig === entry.signature) return el;
  entry.signature = sig;

  el.className = "card job " + job.status;
  $(".job-title", el).textContent = job.title || job.url;
  const meta = [];
  if (job.is_live) meta.push("🔴 Directo");
  if (job.duration) meta.push("Duración " + fmtTime(job.duration));
  if (job.status === "done") meta.push(job.clips.length + " clips" + (job.used_ai === false ? " · modo básico" : ""));
  meta.push(new Date(job.created * 1000).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" }));
  $(".job-meta", el).textContent = meta.join(" · ");
  $(".bar span", el).style.width = (job.status === "error" ? 100 : job.progress) + "%";
  $(".job-msg", el).textContent = job.status === "error" ? job.error : job.message;

  const actions = $(".job-actions", el); actions.replaceChildren();
  const active = job.status === "queued" || job.status === "processing";
  if (active && job.is_live && job.stage === "download")
    actions.append(actionButton("Terminar grabación y sacar clips", "", async () => { await api(`/api/jobs/${job.id}/stop-recording`, { method: "POST" }); toast("Cortando la grabación…"); }));
  if (active) actions.append(actionButton("Cancelar", "", async () => { await api(`/api/jobs/${job.id}/cancel`, { method: "POST" }); refresh(); }));
  if (job.clips.length && job.status === "done") actions.append(actionButton("Descargar todo (.zip)", "link", `/api/jobs/${job.id}/zip`));
  if (job.status === "error" || job.status === "cancelled") actions.append(actionButton("Reintentar", "", async () => { try { await api(`/api/jobs/${job.id}/retry`, { method: "POST" }); refresh(); } catch (e) { toast(e.message); } }));
  if (!active) actions.append(actionButton("Borrar", "", async () => {
    if (!confirm("¿Borrar este trabajo y sus clips?")) return;
    await api(`/api/jobs/${job.id}`, { method: "DELETE" }); cards.get(job.id)?.el.remove(); cards.delete(job.id); refresh();
  }));

  if (entry.clipCount !== job.clips.length) {
    entry.clipCount = job.clips.length;
    const box = $(".clips", el); box.replaceChildren();
    job.clips.forEach(c => box.append(renderClip(job, c)));
  }
  return el;
}

function renderClip(job, c) {
  const el = $("#clip-tpl").content.firstElementChild.cloneNode(true);
  const v = $("video", el);
  v.src = `/media/${job.id}/${c.video}`; v.poster = `/media/${job.id}/${c.thumb}`;
  if (c.width > c.height) $(".player", el).classList.add("wide");
  $(".score", el).textContent = c.score ? `🔥 ${c.score}/100` : `Clip ${c.index}`;
  $(".time", el).textContent = `${fmtTime(c.start)} → ${fmtTime(c.end)} · ${Math.round(c.duration)} s`;
  $(".clip-title", el).textContent = c.title;
  $(".clip-reason", el).textContent = c.reason;
  const text = [c.caption, c.hashtags.map(h => "#" + h).join(" ")].filter(Boolean).join("\n\n");
  $(".caption", el).value = text;
  const dl = $(".dl", el); dl.href = `/media/${job.id}/${c.video}?download=1`; dl.setAttribute("download", "");
  $(".copy", el).addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(text); toast("Texto copiado"); }
    catch { $(".caption", el).select(); document.execCommand("copy"); toast("Texto copiado"); }
  });
  return el;
}

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
      els.forEach((el, i) => { if (jobsEl.children[i] !== el) jobsEl.insertBefore(el, jobsEl.children[i] || null); });
    }
    const busy = jobs.some(j => j.status === "queued" || j.status === "processing");
    timer = setTimeout(refresh, busy ? 2500 : 15000);
  } catch { timer = setTimeout(refresh, 5000); }
}

api("/api/status").then(s => {
  const b = $("#ai-badge");
  b.textContent = s.ai ? "IA activa" : "Modo básico (sin IA)";
  b.className = "badge " + (s.ai ? "on" : "off");
  b.title = s.ai ? "Claude elige los momentos" : "Falta ANTHROPIC_API_KEY en el .env";
}).catch(() => {});
refresh();
