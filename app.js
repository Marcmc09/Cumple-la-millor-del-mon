/*
 * EL REGAL DE LA BERTA — FUNCIONAMENT
 * app.js · versió 0.2
 *
 * Desa'l al costat d'index.html, contingut.js i estils.css.
 * Els textos personals s'editen a contingut.js, no aquí.
 * Sense biblioteques ni compilació: index.html carrega aquest script amb defer.
 *
 * El progrés, els esborranys, els preferits i l'historial es guarden al
 * localStorage del mateix navegador. Esborrar les dades del navegador els
 * elimina; no hi ha compte ni sincronització entre dispositius.
 *
 * ENVIAMENTS (desactivats amb formEndpoint buit)
 * Només es prepara un enviament en confirmar un desig, un record o un pla.
 * Obrir la web, reprendre o repetir una partida MAI reenvia respostes.
 * Els reintents són explícits. Un ID estable acompanya cada resposta:
 * un tall després que el servidor la rebi pot requerir revisar duplicats
 * al formulari; aquest client no pot garantir recepció exactament una vegada.
 * HTTP 2xx confirma l'acceptació del servei, no la lectura d'un correu.
 * Referència: https://formspree.io/blog/formspree-ajax/
 */

(() => {
  "use strict";

  const C = window.CONTINGUT;
  const app = document.getElementById("app");
  const viewer = document.getElementById("viewer");
  const notice = document.getElementById("notice");
  const STORAGE_KEY = "berta-regal-v1";
  const STATE_VERSION = 2;
  const RESPONSE_TYPES = ["desig", "record", "plans"];
  const SENT = "sent";
  const PENDING = "pending";

  // PIN de «Vulguis una sorpresa»: sis números entre cometes.
  // Canvia només 123456 pel teu codi; també pot començar amb zero.
  const PINS_CARTES = {
  faltar: "120526",
  trista: "124578",
  riure: "313131",
  dormir: "444444",
  recordar: "555555",
  sorpresa: "666666",
  dificil: "777777",
};
  let cancelSurprisePin = null;

  if (!app || !viewer || !notice) return;

  // 1. VALIDACIÓ I UTILITATS ------------------------------------------

  const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);
  const text = value => typeof value === "string" ? value : "";
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
  const normalize = value => text(value).normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
  const boundedInt = (value, low, high, fallback = low) =>
    Number.isInteger(value) && value >= low && value <= high ? value : fallback;
  const unique = values => [...new Set(values)];
  const photo = id => C.fotos.find(item => item.id === id);
  const activeLetters = () => [...C.sobres, ...C.cartes.filter(item => item.activa)];
  const letter = id => activeLetters().find(item => item.id === id);
  const item = id => photo(id) || letter(id);

  function imageURL(src) {
    try {
      const url = new URL(text(src), document.baseURI);
      return ["https:", "http:", "file:"].includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  }

  function validateContent() {
    if (!isObject(C)) throw new Error("No s'ha carregat contingut.js.");
    for (const key of ["fotos", "proves", "sobres", "cartes", "frases", "expressions", "plans"]) {
      if (!Array.isArray(C[key])) throw new Error(`Falta la llista ${key} a contingut.js.`);
    }
    if (C.proves.length !== 6 || C.sobres.length !== 6 || C.plans.length !== 4 ||
        C.frases.length !== 5 || C.expressions.length !== 3) {
      throw new Error("Calen sis proves, sis sobres, quatre plans, cinc frases i tres expressions.");
    }
    if (!C.fotos.length || !photo(C.puzzleFoto)) throw new Error("Falta la foto del puzle.");
    const records = [...C.fotos, ...C.sobres, ...C.cartes, ...C.plans];
    if (records.some(r => !isObject(r) || !/^[a-zA-Z0-9_-]+$/.test(r.id))) {
      throw new Error("Cada element necessita un id amb lletres, números, guions o guions baixos.");
    }
    if (unique(records.map(r => r.id)).length !== records.length) throw new Error("Hi ha id repetits.");
    if (C.fotos.some(p => !text(p.src).trim() || !imageURL(p.src))) throw new Error("Revisa les rutes de les fotos.");
    if (unique(C.fotos.map(p => imageURL(p.src))).length !== C.fotos.length) throw new Error("Hi ha fitxers de foto repetits al catàleg.");
    if (C.racoFoto && !photo(C.racoFoto)) throw new Error("La foto de portada del racó no existeix al catàleg.");
    if (!Array.isArray(C.album) || C.album.some(id => !photo(id)) || unique(C.album).length !== C.album.length) {
      throw new Error("Revisa la llista album: ha de contenir id de fotos existents, sense repetir-los.");
    }
    for (const l of [...C.sobres, ...C.cartes]) {
      if (!text(l.titol).trim() || !Array.isArray(l.paragrafs) || l.paragrafs.some(p => typeof p !== "string")) {
        throw new Error("Revisa el títol i els paràgrafs de les cartes.");
      }
    }
    for (const r of [...C.sobres, ...C.cartes, ...C.plans]) {
      if (r.foto && !photo(r.foto)) throw new Error(`La foto de ${r.id} no existeix a la llista.`);
      // Opcional: fotos addicionals d'una carta, sense canviar la resta del fitxer.
      if (r.fotos && (!Array.isArray(r.fotos) || r.fotos.some(id => !photo(id)))) {
        throw new Error(`Revisa les fotos addicionals de ${r.id}.`);
      }
    }
    if (C.frases.some(f => !isObject(f) || !["berta", "tu"].includes(f.autor) || typeof f.text !== "string")) {
      throw new Error("L'autor de cada frase ha de ser berta o tu.");
    }
    if (C.expressions.some(e => !isObject(e) || !Array.isArray(e.respostes) ||
        !e.respostes.length || e.respostes.some(r => !text(r).trim()))) {
      throw new Error("Cada expressió necessita almenys una resposta vàlida.");
    }
    if (!isObject(C.record) || !Array.isArray(C.record.opcions) || !Array.isArray(C.record.pistes) ||
        C.record.opcions.length !== 3 || C.record.pistes.length !== 3 ||
        [...C.record.opcions, ...C.record.pistes].some(value => !text(value).trim()) ||
        !Number.isInteger(C.record.correcta) || C.record.correcta < 0 || C.record.correcta > 2) {
      throw new Error("El record necessita tres opcions, tres pistes i una resposta correcta de 0 a 2.");
    }
  }

  try { validateContent(); } catch (error) {
    app.innerHTML = `<main class="paper"><h1>El regal s’està preparant</h1>
      <p>${escapeHTML(error.message)}</p><p>Revisa el contingut i torna a obrir la pàgina.</p></main>`;
    return;
  }

  function shuffleTiles() {
    const tiles = Array.from({ length: 9 }, (_, index) => index);
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    if (tiles.every((value, index) => value === index)) [tiles[0], tiles[1]] = [tiles[1], tiles[0]];
    return tiles;
  }

  function newGame() {
    return {
      started: false, done: 0, pending: null, finished: false, checkpoint: "overview",
      tiles: shuffleTiles(), selected: null, reference: false, hint: 1,
      phrase: 0, phraseChoice: null, expression: 0, expressionOK: false, expressionHint: false,
    };
  }

  function newState() {
    return { version: STATE_VERSION, game: newGame(), read: [], fav: [], drafts: {}, history: [], lastSurprise: "" };
  }

  function validResponseValue(type, value) {
    if (type === "desig" || type === "record") return typeof value === "string" && value.trim().length > 0;
    return type === "plans" && isObject(value) && typeof value.plan === "string" &&
      typeof value.titol === "string" && typeof value.extra === "string";
  }

  function sanitizeHistory(raw) {
    const source = Array.isArray(raw.history) ? raw.history : [];
    // Compatibilitat amb l'esborrany anterior: conservar pendents i últimes respostes.
    if (raw.version === 1) {
      const pending = Array.isArray(raw.outbox) ? raw.outbox : [];
      const answers = isObject(raw.answers) ? Object.values(raw.answers) : [];
      for (const entry of [...answers, ...pending]) {
        if (isObject(entry)) source.push({ ...entry, createdAt: entry.date,
          status: pending.some(p => p?.id === entry.id) ? PENDING : SENT });
      }
    }
    const byId = new Map();
    for (const entry of source) {
      if (!isObject(entry) || !text(entry.id) || !RESPONSE_TYPES.includes(entry.type) ||
          !validResponseValue(entry.type, entry.value)) continue;
      byId.set(entry.id, {
        id: entry.id, type: entry.type, value: entry.value,
        createdAt: Number.isFinite(Date.parse(entry.createdAt)) ? entry.createdAt : new Date().toISOString(),
        status: entry.status === SENT ? SENT : PENDING,
        sentAt: text(entry.sentAt),
      });
    }
    return [...byId.values()];
  }

  function sanitizeState(raw) {
    const result = newState();
    if (!isObject(raw) || ![1, STATE_VERSION].includes(raw.version)) return result;
    result.history = sanitizeHistory(raw);
    result.read = unique((Array.isArray(raw.read) ? raw.read : []).filter(id => typeof id === "string"));
    result.fav = unique((Array.isArray(raw.fav) ? raw.fav : []).filter(id => typeof id === "string"));
    result.lastSurprise = text(raw.lastSurprise);
    if (isObject(raw.drafts)) {
      for (const key of ["wish", "memory", "plan", "extra", "expression"]) {
        if (typeof raw.drafts[key] === "string") result.drafts[key] = raw.drafts[key];
      }
    }
    if (isObject(raw.game)) {
      const old = raw.game, g = result.game;
      g.done = boundedInt(old.done, 0, 6);
      g.started = old.started === true || g.done > 0;
      g.pending = Number.isInteger(old.pending) && old.pending === g.done - 1 && old.pending >= 0
        ? old.pending : null;
      g.finished = g.done === 6 && g.pending === null;
      g.checkpoint = g.pending !== null ? (old.checkpoint === "letter" ? "letter" : "reward")
        : old.checkpoint === "game" && g.done < 6 ? "game" : "overview";
      if (Array.isArray(old.tiles) && old.tiles.length === 9 && unique(old.tiles).length === 9 &&
          old.tiles.every(n => Number.isInteger(n) && n >= 0 && n < 9)) g.tiles = [...old.tiles];
      g.selected = Number.isInteger(old.selected) && old.selected >= 0 && old.selected < 9 ? old.selected : null;
      g.reference = old.reference === true;
      g.hint = boundedInt(old.hint, 1, C.record.pistes.length, 1);
      g.phrase = boundedInt(old.phrase, 0, C.frases.length - 1);
      g.phraseChoice = ["berta", "tu"].includes(old.phraseChoice) ? old.phraseChoice : null;
      if (raw.version === 1 && old.revealed) g.phraseChoice = C.frases[g.phrase].autor;
      g.expression = boundedInt(old.expression, 0, C.expressions.length - 1);
      g.expressionOK = old.expressionOK === true;
      g.expressionHint = old.expressionHint === true;
    }
    return result;
  }

  // 2. GUARDAT LOCAL I HISTORIAL --------------------------------------

  let storageOK = true;
  let loadWarning = "";
  let state = newState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) state = sanitizeState(JSON.parse(raw));
  } catch (error) {
    storageOK = false;
    loadWarning = "No s’ha pogut recuperar el progrés desat. Pots continuar amb aquesta sessió.";
  }

  const ui = {
    page: "welcome", // El pastís reapareix en cada càrrega, sense esborrar el joc.
    letterId: "", letterFrom: "corner", letterScroll: 0,
    galleryFav: false, surpriseId: "", entryBlown: false,
    photoStatus: "loading", photoRatio: 16 / 9,
  };
  let noticeTimer;
  let blowTimer;
  let blowing = false;

  function notify(message) {
    notice.textContent = message;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { notice.textContent = ""; }, 6500);
  }

  function refreshStorageNotice() {
    const el = document.getElementById("storage-warning");
    if (!el) return;
    el.hidden = storageOK;
    el.textContent = storageOK ? "" : "El navegador no ha pogut desar els canvis. Es conservaran només mentre aquesta pàgina continuï oberta.";
  }

  function persist() {
    const wasOK = storageOK;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      storageOK = true;
    } catch { storageOK = false; }
    refreshStorageNotice();
    if (wasOK && !storageOK) notify("No s’ha pogut desar. Mantén aquesta pàgina oberta per conservar els canvis.");
    return storageOK;
  }

  function latest(type) {
    for (let i = state.history.length - 1; i >= 0; i--) {
      if (state.history[i].type === type) return state.history[i];
    }
    return null;
  }

  function sameResponse(a, b) {
    if (typeof a === "string" || typeof b === "string") return a === b;
    return a.plan === b.plan && a.extra === b.extra;
  }

  function responseId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `berta-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function recordResponse(type, value) {
    if (!validResponseValue(type, value)) return null;
    const previous = latest(type);
    // Mateixa resposta: conservar-la, sense duplicar ni tornar a enviar.
    if (previous && sameResponse(previous.value, value)) return previous;
    const entry = { id: responseId(), type, value, createdAt: new Date().toISOString(), status: PENDING, sentAt: "" };
    state.history.push(entry);
    persist();
    enqueueResponses([entry.id]);
    return entry;
  }

  // 3. ENVIAMENT OPCIONAL A FORMSPREE ---------------------------------

  const scheduled = new Set();
  let sendChain = Promise.resolve();

  function endpoint() {
    if (!text(C.formEndpoint).trim()) return "";
    try {
      const url = new URL(C.formEndpoint);
      if (url.protocol !== "https:" || url.hostname !== "formspree.io" ||
          url.username || url.password || url.search || url.hash || !/^\/f\/[a-z0-9]+\/?$/i.test(url.pathname)) return null;
      return url.href;
    } catch { return null; }
  }

  function enqueueResponses(ids) {
    const url = endpoint();
    if (url === "") return; // Sense configuració, ni tan sols fem una petició.
    if (url === null) {
      notify("Cal revisar l’adreça del formulari. Les respostes queden pendents aquí.");
      return;
    }
    for (const id of unique(ids)) {
      const entry = state.history.find(e => e.id === id);
      if (!entry || entry.status === SENT || scheduled.has(id)) continue;
      scheduled.add(id);
      sendChain = sendChain.then(() => sendResponse(entry, url)).finally(() => {
        scheduled.delete(id);
        refreshResponseNotices();
      });
    }
    refreshResponseNotices();
  }

  async function sendResponse(entry, url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const form = new FormData();
      form.set("id_resposta", entry.id);
      form.set("tipus", entry.type);
      form.set("data", entry.createdAt);
      if (entry.type === "plans") {
        form.set("pla", entry.value.titol);
        form.set("id_pla", entry.value.plan);
        form.set("aportacio", entry.value.extra);
      } else form.set("resposta", entry.value);
      const response = await fetch(url, {
        method: "POST", body: form, headers: { Accept: "application/json" },
        signal: controller.signal, credentials: "omit", redirect: "error",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      entry.status = SENT;
      entry.sentAt = new Date().toISOString();
      persist();
      notify("Resposta enviada.");
    } catch {
      entry.status = PENDING;
      persist();
      notify(storageOK
        ? "No s’ha pogut confirmar l’enviament. La resposta queda desada per reintentar-ho."
        : "No s’ha pogut enviar ni desar. Mantén la pàgina oberta per tornar-ho a intentar.");
    } finally { clearTimeout(timeout); }
  }

  function pendingText() {
    const pending = state.history.filter(e => e.status === PENDING).length;
    if (!pending) return "";
    if (scheduled.size) return "S’està confirmant l’enviament. Pots continuar amb el regal.";
    if (!storageOK) return "Hi ha respostes pendents en aquesta sessió. Mantén la pàgina oberta.";
    if (!endpoint()) return "Les respostes es guarden aquí; els enviaments encara no estan configurats.";
    return `${pending} ${pending === 1 ? "resposta pendent" : "respostes pendents"} d’enviament.`;
  }

  function responseNotices() {
    return `<div id="response-notices"><p class="status" id="response-status" role="status"></p>
      ${button("Reintentar l’enviament", "retry", {}, "skip")}</div>`;
  }

  function refreshResponseNotices() {
    const wrap = document.getElementById("response-notices");
    if (!wrap) return;
    const message = pendingText();
    wrap.hidden = !message;
    wrap.querySelector("p").textContent = message;
    const retry = wrap.querySelector("button");
    retry.hidden = !endpoint() || !message;
    retry.disabled = scheduled.size > 0;
  }

  // 4. COMPONENTS I NAVEGACIÓ -----------------------------------------

  function button(label, action, attrs = {}, className = "main") {
    const attributes = Object.entries(attrs).map(([key, value]) =>
      value === false || value == null ? "" : value === true ? ` ${key}` : ` ${key}="${escapeHTML(value)}"`).join("");
    return `<button type="button" class="${escapeHTML(className)}" data-action="${escapeHTML(action)}"${attributes}>${label}</button>`;
  }

  function image(id, className = "", lazy = false) {
    const p = photo(id);
    return p ? `<img class="${escapeHTML(className)}" src="${escapeHTML(imageURL(p.src))}"
      alt="${escapeHTML(p.alt || p.text || "Un record nostre")}" decoding="async" loading="${lazy ? "lazy" : "eager"}">` : "";
  }

  function photoFrame(id) {
    const p = photo(id);
    return p ? `<figure class="photo-frame">${image(id)}
      ${p.text ? `<figcaption>${escapeHTML(p.text)}</figcaption>` : ""}</figure>` : "";
  }

  function heart(id) {
    const selected = state.fav.includes(id);
    return button(`${selected ? "♥" : "♡"} Preferit`, "favorite", {
      "data-id": id, "aria-pressed": String(selected),
      "aria-label": `${selected ? "Treure de" : "Afegir a"} preferits: ${item(id)?.titol || photo(id)?.text || "fotografia"}`,
    }, "heart-button");
  }

function nav() {
  const desDeLlista =
    ui.page === "letter" &&
    ["all-letters", "when"].includes(ui.letterFrom);

  const textTornar = ui.letterFrom === "when"
    ? "← Obre’m quan…"
    : "← Tornar als sobres";

  return `<nav class="topnav" aria-label="Navegació del regal">
    ${desDeLlista
      ? button(textTornar, "letter-back", {}, "back")
      : button("← El nostre racó", "corner", {}, "back")}
    ${desDeLlista
      ? button("El nostre racó", "corner", {}, "back")
      : button("Els sobres", "overview", {}, "back")}
  </nav>`;
}

  function shell(title, body, { welcome = false, heading = "" } = {}) {
    app.innerHTML = `<main class="paper ${welcome ? "" : "inner"}" aria-labelledby="screen-title">
      <div class="edition"><span>Només per a tu</span><span>${escapeHTML(C.data)}</span></div>
      ${welcome ? "" : nav()}
      ${heading || `<${welcome ? "h1" : "h2"} id="screen-title" tabindex="-1">${escapeHTML(title)}</${welcome ? "h1" : "h2"}>`}
      ${body}
      <p id="storage-warning" class="status" role="status" hidden></p>
      ${C.provisional ? '<p class="test">Versió de prova · els textos entre claudàtors estan pendents.</p>' : ""}
    </main>`;
    document.title = welcome ? `Per a tu, ${C.nom} · ${C.edat}` : `${title} · Per a tu, ${C.nom}`;
    refreshStorageNotice();
    refreshResponseNotices();
  }

  function focusScreen() {
    app.querySelector("#screen-title")?.focus({ preventScroll: true });
  }

  function go(page, { scroll = 0, focus = true } = {}) {
    if (cancelSurprisePin) cancelSurprisePin(false);
    if (ui.page !== page) leaveExtras(ui.page);
    ui.page = page;
    render();
    if (focus) focusScreen();
    window.scrollTo(0, scroll);
  }

  function rerender(focusSelector) {
    const scroll = window.scrollY;
    render();
    if (focusSelector) app.querySelector(focusSelector)?.focus({ preventScroll: true });
    window.scrollTo(0, scroll);
  }

  function markRead(id) {
    if (!state.read.includes(id)) { state.read.push(id); persist(); }
  }

  // PIN de la sorpresa. No es desa ni el codi escrit ni el desbloqueig.
  function askSurprisePin(id, onSuccess) {
  const pin = PINS_CARTES[id];
    if (cancelSurprisePin) return;
    if (typeof pin !== "string" || !/^[0-9]{6}$/.test(pin)) {
      notify("Cal configurar un PIN de sis números a app.js.");
      return;
    }
    const opener = document.activeElement;
    const dialog = document.createElement("dialog");
    dialog.id = "surprise-pin";
    dialog.setAttribute("aria-labelledby", "surprise-pin-title");
    dialog.setAttribute("aria-describedby", "surprise-pin-hint");
    dialog.innerHTML = `<form novalidate>
      <span class="pin-heart" aria-hidden="true">♡</span>
      <h2 id="surprise-pin-title">Una sorpresa t’espera</h2>
      <p id="surprise-pin-hint">La clau te la donaré jo, quan arribi el moment.</p>
      <label class="sr-only" for="surprise-pin-input">PIN de sis números</label>
      <div class="pin-field">
        <div class="pin-dots" aria-hidden="true">${"<i></i>".repeat(6)}</div>
        <input id="surprise-pin-input" type="password" inputmode="numeric"
          pattern="[0-9]{6}" maxlength="6" autocomplete="off" autocapitalize="off"
          spellcheck="false" aria-describedby="surprise-pin-hint surprise-pin-error">
      </div>
      <p id="surprise-pin-error" role="status" aria-live="polite" aria-atomic="true"></p>
      <button type="submit" class="pin-open">Obrir la sorpresa</button>
      <button type="button" class="pin-cancel">Ara no</button>
    </form>`;
    const input = dialog.querySelector("input");
    const error = dialog.querySelector("#surprise-pin-error");
    const dots = [...dialog.querySelectorAll(".pin-dots i")];
    const paintDots = () => dots.forEach((dot, i) => dot.classList.toggle("filled", i < input.value.length));
    let finished = false;
    function finish(accepted, restoreFocus = true) {
      if (finished) return;
      finished = true;
      cancelSurprisePin = null;
      input.value = "";
      if (dialog.open) dialog.close();
      dialog.remove();
      document.documentElement.classList.remove("surprise-pin-open");
      if (accepted) onSuccess();
      else if (restoreFocus && opener?.isConnected) opener.focus({ preventScroll: true });
    }
    function checkPin() {
      if (finished) return;
      if (!/^[0-9]{6}$/.test(input.value)) {
        error.textContent = "Escriu els sis números de la clau.";
        input.setAttribute("aria-invalid", "true");
        input.focus({ preventScroll: true });
        return;
      }
   if (input.value === pin) { finish(true); return; }
      error.textContent = "Encara no… Aquesta no és la clau 🤭";
      input.value = "";
      input.setAttribute("aria-invalid", "true");
      paintDots();
      input.focus({ preventScroll: true });
    }
    input.addEventListener("input", () => {
      input.value = input.value.replace(/[^0-9]/g, "").slice(0, 6);
      input.removeAttribute("aria-invalid");
      error.textContent = "";
      paintDots();
      if (input.value.length === 6) checkPin();
    });
    dialog.querySelector("form").addEventListener("submit", event => {
      event.preventDefault();
      checkPin();
    });
    dialog.querySelector(".pin-cancel").addEventListener("click", () => finish(false));
    dialog.addEventListener("cancel", event => { event.preventDefault(); finish(false); });
    dialog.addEventListener("close", () => finish(false));
    dialog.addEventListener("click", event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right ||
          event.clientY < rect.top || event.clientY > rect.bottom)) finish(false);
    });
    document.body.append(dialog);
    cancelSurprisePin = (restoreFocus = true) => finish(false, restoreFocus);
    try {
      dialog.showModal();
      document.documentElement.classList.add("surprise-pin-open");
      input.focus({ preventScroll: true });
    } catch {
      finish(false);
      notify("Obre el regal en un navegador actualitzat per introduir el PIN.");
    }
  }

  function openLetter(id, from = ui.page) {
    if (!letter(id)) return;
    const show = () => {
      ui.letterId = id;
      ui.letterFrom = from;
      ui.letterScroll = window.scrollY;
      if (from === "game") { state.game.checkpoint = "letter"; persist(); }
      markRead(id);
      go("letter");
    };
    if (C.cartes.some(carta => carta.id === id)) {
  askSurprisePin(id, show);
}
    else show();
  }

  // PANTALLES
  // Es defineixen a continuació; tots els continguts personals es llegeixen de C.

  // 5. BENVINGUDA, REPRENDRE I SOBRES ---------------------------------

  function welcomeScreen() {
    const previous = latest("desig");
    shell(`${C.nom}.`, `<p class="intro">Per molts anys · ${escapeHTML(C.edat)}</p>
      <p class="hand">${escapeHTML(C.benvinguda)}</p>
      <div class="cake-scene" role="img" aria-label="Pastís amb espelmes del número ${escapeHTML(C.edat)}">
        <div class="plate"></div><div class="cake"><div class="icing"></div>
          <div class="cake-heart" aria-hidden="true">♥</div></div>
        <div class="candles" aria-hidden="true">${String(C.edat).split("").map(n =>
          `<div class="candle">${escapeHTML(n)}<div class="flame"></div></div>`).join("")}</div>
      </div>
      <label for="wish">Abans de començar… demana un desig.</label>
      <textarea id="wish" data-draft="wish" rows="3" placeholder="El meu desig es...">${escapeHTML(state.drafts.wish ?? previous?.value ?? "")}</textarea>
      ${button("Bufar les espelmes", "blow")}
      ${previous ? button("Conservar el desig anterior i bufar", "keep-wish", {}, "main outline") : ""}
      ${button("Saltar aquest pas", "entry", {}, "skip")}`, { welcome: true });
  }

  function entryScreen() {
    shell("Aquest regal és per tu", `<p class="entry-message">Sis sobres, una mica de joc i moltes coses nostres.</p>
      ${button("Començar el regal", "start")}
      ${button("Anar al nostre racó", "corner", {}, "main outline")}
      ${responseNotices()}`);
    if (ui.entryBlown) { ui.entryBlown = false; confetti(); }
  }

  function resumeScreen() {
    shell("Continuem?", `<p class="hand">Tens ${state.game.done} dels sis sobres descoberts.</p>
      ${button("Continuar on ho vaig deixar", "resume")}
      ${button("Tornar a començar", "restart-ask", {}, "main outline")}`);
  }

  function restartScreen() {
    shell("Comencem de nou?", `<p class="hint">La partida tornarà al primer sobre.
      Conservaràs les cartes llegides, els preferits, els plans i les teves respostes.</p>
      ${button("Sí, tornar a començar", "restart-confirm")}
      ${button("Continuar la partida actual", "resume", {}, "main outline")}`);
  }

  function overviewScreen() {
    const g = state.game;
    shell("Un sobre, un tros de nosaltres", `<p class="hint">Cada prova obre una carta. Fes-ho al teu ritme.</p>
      ${g.pending !== null ? '<p class="hand">Tens una carta esperant-te.</p>' : ""}
      <div class="envelopes">${C.proves.map((title, i) => {
        const locked = i > g.done || (i === g.done && g.pending !== null);
        const badge = g.pending === i ? "La teva recompensa" : i < g.done ? "Per tornar a llegir" : locked ? "Encara tancat" : "Comencem?";
        return button(`<span>${i + 1}</span>${escapeHTML(title)}<small>${badge}</small>`, "envelope",
          { "data-index": i, disabled: locked, "aria-label": `Sobre ${i + 1}: ${title}. ${badge}` }, "envelope");
      }).join("")}</div>
      ${g.finished ? button("Tornar a jugar", "start", {}, "main outline") : ""}`);
  }

  function startGame() {
    if (state.game.started && !state.game.finished) { go("resume"); return; }
    resetGame();
  }

  function resetGame() {
    state.game = newGame();
    state.game.started = true;
    // Només es neteja el camp d'una expressió, que no és una resposta enviada.
    delete state.drafts.expression;
    persist();
    go("overview");
  }

  function resumeGame() {
    const g = state.game;
    if (g.pending !== null) {
      if (g.checkpoint === "letter") openLetter(C.sobres[g.pending].id, "game");
      else go("reward");
    } else if (g.checkpoint === "game" && g.done < 6) go("game");
    else go("overview");
  }

  function completeStep(expected) {
    const g = state.game;
    if (ui.page !== "game" || g.done !== expected || g.pending !== null) return;
    g.done++;
    g.pending = expected;
    g.checkpoint = "reward";
    g.selected = null;
    persist();
    go("reward");
  }

  function finishLetter() {
    const g = state.game;
    if (ui.letterFrom !== "game" || g.pending === null) return;
    g.pending = null;
    g.finished = g.done === 6;
    g.checkpoint = "overview";
    persist();
    go(g.finished ? "corner" : "overview");
  }

  // 6. SIS PROVES ----------------------------------------------------

  function progress(index) {
    return `<div class="progress" role="img" aria-label="Prova ${index + 1} de 6">
      ${C.proves.map((_, i) => `<i class="${i <= index ? "done" : ""}" aria-hidden="true"></i>`).join("")}</div>`;
  }

  function puzzleGame() {
    const g = state.game;
    if (ui.photoStatus === "error") return `<p class="hint">No s’ha pogut carregar la foto del puzle.</p>
      ${button("Tornar a carregar la foto", "retry-photo")}
      ${button("Llegir la carta al racó", "letter", { "data-id": C.sobres[0].id }, "main outline")}`;
    return `<p class="hint">Toca dues peces per intercanviar-les i reconstruir el nostre record.</p>
      <div class="puzzle-board" role="group" aria-label="Puzle de nou peces">
        ${g.tiles.map((value, index) => button("", "tile", {
          "data-index": index, "data-piece": value,
          "aria-label": `Peça de la posició ${index + 1}${g.selected === index ? ", seleccionada" : ""}`,
          "aria-pressed": String(g.selected === index),
        }, `puzzle-tile ${g.selected === index ? "selected" : ""}`)).join("")}
      </div>
      <p class="puzzle-message" role="status">${g.selected === null ? "Tria una peça." : "Ara toca la peça amb què la vols canviar."}</p>
      ${button(g.reference ? "Amagar la foto" : "Veure la foto", "reference", { "aria-expanded": String(g.reference) }, "skip")}
      ${g.reference ? image(C.puzzleFoto, "reference") : ""}`;
  }

  function memoryGame() {
    const g = state.game, r = C.record;
    return `<p class="entry-message">${escapeHTML(r.pregunta)}</p>
      <div role="group" aria-label="Pistes">${r.pistes.slice(0, g.hint).map((p, i) =>
        `<p class="hint">Pista ${i + 1}: ${escapeHTML(p)}</p>`).join("")}</div>
      ${r.opcions.map((option, i) => button(escapeHTML(option), "guess", { "data-index": i }, "choice")).join("")}
      ${g.hint < r.pistes.length ? button("Una altra pista", "hint", {}, "skip")
        : button("Descobrir el record", "reveal-memory", {}, "skip")}`;
  }

  function phrasesGame() {
    const g = state.game, phrase = C.frases[g.phrase];
    let controls;
    if (g.phraseChoice !== null) {
      const who = phrase.autor === "berta" ? `${C.nom} · «Jo»` : "Qui t’ha preparat el regal · «Tu»";
      controls = `<p class="hint">${g.phraseChoice === phrase.autor ? "oleee amoorr!" : "Aquí tens la resposta:"}</p>
        <p><strong>${escapeHTML(who)}</strong></p><p class="hint">${escapeHTML(phrase.context)}</p>
        ${button(g.phrase === C.frases.length - 1 ? "Descobrir el sobre" : "Següent frase", "phrase-next")}`;
    } else {
      controls = `<div class="row">${button("Jo", "author", { "data-author": "berta" }, "main outline")}
        ${button("Tu", "author", { "data-author": "tu" }, "main outline")}</div>
        <p class="hint">Jo = ${escapeHTML(C.nom)} · Tu = Marc el millor i qui t’ha preparat el regal</p>`;
    }
    return `<p class="eyebrow">Frase ${g.phrase + 1} de ${C.frases.length}</p>
      <p class="entry-message">«${escapeHTML(phrase.text)}»</p>${controls}`;
  }

  function expressionsGame() {
    const g = state.game, expression = C.expressions[g.expression];
    const counter = `<p class="eyebrow">Expressió ${g.expression + 1} de ${C.expressions.length}</p>`;
    if (g.expressionOK) {
      const answer = expression.respostes[0];
      const full = /_{2,}|…/.test(expression.text)
        ? expression.text.replace(/_{2,}|…/, ` ${answer}`) : `${expression.text} ${answer}`;
      return `${counter}<p class="entry-message">${escapeHTML(full)}</p>
        ${button(g.expression === C.expressions.length - 1 ? "Descobrir el sobre" : "Següent expressió", "expression-next")}`;
    }
    return `${counter}<form id="expression-form" novalidate>
      <label for="expression">${escapeHTML(expression.text)}</label>
      <input id="expression" name="expression" data-draft="expression" autocomplete="off"
        value="${escapeHTML(state.drafts.expression ?? "")}" placeholder="Escriu la paraula">
      <button type="submit" class="main">Comprovar</button></form>
      ${button("Una pista", "expression-hint", {}, "skip")}
      ${g.expressionHint ? `<p class="hint">${escapeHTML(expression.pista)}</p>
        ${button("Veure la resposta", "expression-answer", {}, "skip")}` : ""}`;
  }

  function openQuestionGame() {
    const previous = latest("record");
    return `<label for="memory">${escapeHTML(C.preguntaOberta)}</label>
      <textarea id="memory" data-draft="memory" rows="6" placeholder="T’escolto…">${escapeHTML(state.drafts.memory ?? previous?.value ?? "")}</textarea>
      <p class="hint">No hi ha cap resposta correcta. Escriu tant o tan poc com vulguis.</p>
      ${button("Guardar i obrir el sobre", "save-memory")}
      ${previous ? button("Conservar la resposta anterior i continuar", "keep-memory", {}, "main outline") : ""}`;
  }

  function selectedPlan() {
    return state.drafts.plan ?? latest("plans")?.value.plan ?? "";
  }

  function plansGame() {
    const previous = latest("plans");
    return `<p class="hint">Quin d’aquests plans t’agradaria que féssim primer?</p>
      <div role="group" aria-label="Tria un pla">${C.plans.map(p => button(
        `${p.foto ? image(p.foto) : ""}<strong>${escapeHTML(p.titol)}</strong><small>${escapeHTML(p.text)}</small>`,
        "choose-plan", { "data-id": p.id, "aria-pressed": String(selectedPlan() === p.id) },
        `choice ${selectedPlan() === p.id ? "chosen" : ""}`)).join("")}</div>
      <label for="extra">I tu, què hi afegiries?</label>
      <textarea id="extra" data-draft="extra" rows="3" placeholder="Si et ve de gust…">${escapeHTML(state.drafts.extra ?? previous?.value.extra ?? "")}</textarea>
      ${button("Guardar i obrir l’últim sobre", "save-plan")}
      ${previous ? button("Conservar el text anterior i continuar", "keep-plan", {}, "main outline") : ""}`;
  }

  function gameScreen() {
    if (state.game.pending !== null) { ui.page = "reward"; rewardScreen(); return; }
    const index = state.game.done;
    if (index >= 6) { ui.page = "corner"; cornerScreen(); return; }
    const games = [puzzleGame, memoryGame, phrasesGame, expressionsGame, openQuestionGame, plansGame];
    shell(C.proves[index], progress(index) + games[index]());
    if (index === 0) stylePuzzleTiles();
  }

  function stylePuzzleTiles() {
    const src = imageURL(photo(C.puzzleFoto).src);
    for (const tile of app.querySelectorAll(".puzzle-tile")) {
      const value = Number(tile.dataset.piece);
      // Assignació per propietats DOM, sense inserir noms de fitxer dins del CSS HTML.
      tile.style.backgroundImage = `url(${JSON.stringify(src)})`;
      tile.style.backgroundPosition = `${(value % 3) * 50}% ${Math.floor(value / 3) * 50}%`;
      tile.style.aspectRatio = String(ui.photoRatio);
    }
  }

  function rewardScreen() {
    const index = state.game.pending;
    if (index === null) { ui.page = "overview"; overviewScreen(); return; }
    const result = index === 0 ? `<p class="hand">Peça a peça, aquí estem.</p>${photoFrame(C.puzzleFoto)}`
      : index === 1 ? `<p class="entry-message">${escapeHTML(C.record.opcions[C.record.correcta])}</p>`
        : '<p class="hand">Una altra peça de nosaltres.</p>';
    shell("Aquest sobre és per a tu", `${result}<div class="reward">
      ${button(`<span>${index + 1}</span>Obrir el meu sobre`, "reward-open", {}, "envelope")}</div>
      ${responseNotices()}`);
  }

  // 7. RACÓ, CARTES, GALERIA I SORPRESES -------------------------------

  function letterBody(l) {
    const photos = unique([l.foto, ...(l.fotos || [])].filter(Boolean));
    const first = photos.shift();
    const paragraphs = l.paragrafs.map((p, i) => `<p>${escapeHTML(p)}</p>${photos[i] ? photoFrame(photos[i]) : ""}`).join("");
    return `${first ? photoFrame(first) : ""}<article class="letter-copy">
      ${paragraphs}${photos.slice(l.paragrafs.length).map(photoFrame).join("")}
      <p class="signature">${escapeHTML(C.signatura)}</p></article>`;
  }

  function letterScreen() {
    const l = letter(ui.letterId);
    if (!l) { ui.page = "corner"; cornerScreen(); return; }
    const inGame = ui.letterFrom === "game" && state.game.pending !== null;
    shell(l.titol, `${letterBody(l)}<div class="letter-tools">${heart(l.id)}</div>
      ${inGame ? button(state.game.done === 6 ? "Entrar al nostre racó" : "Continuar amb els sobres", "finish-letter")
        : button("← Tornar", "letter-back", {}, "back")}
      ${inGame ? responseNotices() : ""}`);
  }

  function cornerScreen() {
    const cards = [
      ["all-letters", "mini-envelope", "Els nostres sobres", "Tornar a llegir-nos"],
      ["when", "mini-letter", "Obre’m quan…", "Una carta per a cada moment"],
      ["gallery", "mini-photo", "Els nostres records", "Les fotos que guardem"],
      ["postcard", "mini-postcard", "Una postal nostra", "Un record per guardar"],
    ];
    shell("El nostre racó", `<figure class="hero-memory">${C.racoFoto ? image(C.racoFoto) : '<div class="paper-memory" aria-hidden="true"><span>nosaltres</span><b>♡</b><small>un lloc on tornar</small></div>'}
      ${C.racoFoto && photo(C.racoFoto).text ? `<figcaption>${escapeHTML(photo(C.racoFoto).text)}</figcaption>` : ""}</figure>
      <div class="memory-grid">${cards.map(([action, art, title, subtitle]) => button(
        `<div class="tile-art" aria-hidden="true"><div class="${art}">
          ${art === "mini-photo" ? '<span aria-hidden="true">♡</span>' : art === "mini-postcard" ? '<span aria-hidden="true">♥</span>' : ""}
        </div></div><strong>${title}</strong><small>${subtitle}</small>`, action, {}, "memory-tile")).join("")}</div>
      ${button('<span class="pair-mark" aria-hidden="true">♡ ♡</span><span><strong>Una estona més amb tu</strong><small>El nostre Memory · 9 parelles</small></span><span aria-hidden="true">→</span>', "pairs", {}, "pairs-entry")}
      <div class="corner-extras">${button("✧ Sorprèn-me", "surprise", {}, "")}${button("♡ Preferits", "favorites", {}, "")}</div>
      ${button(state.game.started && !state.game.finished ? "Continuar jugant" : "Tornar a jugar", "start", {}, "main outline")}
      ${responseNotices()}`, {
        heading: `<div class="corner-intro"><p class="eyebrow">Un lloc on tornar</p>
          <h3 id="screen-title" tabindex="-1">El nostre racó</h3>
          <p class="subtitle">Tot allò que ens fa ser nosaltres.</p></div>`,
      });
  }

  function lettersScreen(when) {
    const list = when ? C.cartes.filter(l => l.activa) : C.sobres;
    shell(when ? "Obre’m quan…" : "Els nostres sobres", `<p class="hand">
      ${when ? "Tria la carta que necessitis avui." : "Són teus. Pots obrir-los sempre que vulguis."}</p>
      <div class="open-when">${list.map(l => button(
        `<span>${state.read.includes(l.id) ? "Ja llegida" : "Per descobrir"}</span>${escapeHTML(l.titol)}`,
        "letter", { "data-id": l.id }, "")).join("")}</div>
      ${list.length ? "" : '<p class="hint">Aquí hi haurà les teves cartes.</p>'}`);
  }

function albumPhotos() {
  if (!ui.albumOrder) {
    ui.albumOrder = shuffled([...new Set(C.album)]);
  }

  return ui.albumOrder.map(photo).filter(Boolean);
}

  function galleryPhotos() {
    return albumPhotos().filter(p => !ui.galleryFav || state.fav.includes(p.id));
  }

  function galleryScreen() {
    const photos = galleryPhotos();
    shell("Els nostres records", `${button('▷ Veure en mode cinema', 'cinema-start', { disabled: !albumPhotos().length }, 'main outline')}
      <div class="row" role="group" aria-label="Filtrar les fotografies">
      ${button("Totes", "gallery-all", { "aria-pressed": String(!ui.galleryFav) }, "main outline")}
      ${button("Preferides", "gallery-fav", { "aria-pressed": String(ui.galleryFav) }, "main outline")}</div>
      <div class="gallery">${photos.map(p => `<figure class="photo-frame">
        ${button(image(p.id, "", true), "photo", { "data-id": p.id, "aria-label": `Ampliar: ${p.text || p.alt || "fotografia"}` }, "photo-button")}
        ${p.text ? `<figcaption>${escapeHTML(p.text)}</figcaption>` : ""}${heart(p.id)}</figure>`).join("")}</div>
      ${photos.length ? "" : `<p class="hint">${ui.galleryFav ? 'Toca el cor d’una foto de l’àlbum per trobar-la aquí.' : 'Aquest àlbum està esperant les nostres fotos.'}</p>`}`);
  }

  function favoritesScreen() {
    const entries = [...C.fotos, ...activeLetters()].filter(p => state.fav.includes(p.id));
    shell("Els teus preferits", entries.length ? entries.map(p => `<div class="photo-frame">
      ${button(`${p.src ? image(p.id, "", true) : ""}${escapeHTML(p.titol || p.text || "Un record nostre")}`,
        p.src ? "photo" : "letter", { "data-id": p.id }, "choice")}${heart(p.id)}</div>`).join("")
      : '<p class="hand">Encara no hi ha cap preferit.</p><p class="hint">Toca el cor d’una foto o carta per guardar-la aquí.</p>');
  }

  function pickSurprise() {
    const pool = [...C.fotos, ...activeLetters().filter(l => state.read.includes(l.id))];
    const alternatives = pool.filter(p => pool.length === 1 || p.id !== state.lastSurprise);
    if (!alternatives.length) { notify("Encara no hi ha records disponibles."); return; }
    const chosen = alternatives[Math.floor(Math.random() * alternatives.length)];
    const show = () => {
      ui.surpriseId = chosen.id;
      state.lastSurprise = chosen.id;
      persist();
      go("surprise");
    };
  if (C.cartes.some(carta => carta.id === chosen.id)) {
  askSurprisePin(chosen.id, show);
}
    else show();
  }

  function surpriseScreen() {
    const chosen = item(ui.surpriseId);
    if (!chosen) { ui.page = "corner"; cornerScreen(); return; }
    shell(chosen.titol || "Un record per a tu", `${chosen.src ? photoFrame(chosen.id) : letterBody(chosen)}
      ${heart(chosen.id)}${button("Una altra sorpresa", "surprise")}
      ${button("Tornar al racó", "corner", {}, "back")}`);
  }

  function render() {
    const screens = {
      welcome: welcomeScreen, entry: entryScreen, resume: resumeScreen, restart: restartScreen,
      overview: overviewScreen, game: gameScreen, reward: rewardScreen, letter: letterScreen,
      corner: cornerScreen, when: () => lettersScreen(true), "all-letters": () => lettersScreen(false),
      gallery: galleryScreen, favorites: favoritesScreen, surprise: surpriseScreen,
      pairs: pairsScreen, cinema: cinemaScreen, postcard: postcardScreen,
      "photo-page": photoPageScreen,
    };
    (screens[ui.page] || cornerScreen)();
  }

  // 8. MEMORY, CINEMA I POSTALS ---------------------------------------
  // Cap d'aquestes funcions envia dades ni modifica la partida de sobres.

  function shuffled(values) {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function loadAsset(id) {
    return new Promise((resolve, reject) => {
      const p = photo(id);
      if (!p) { reject(new Error("Falta la fotografia.")); return; }
      const img = new Image();
      const url = imageURL(p.src);
      // Permet fotos externes només si el servidor autoritza l'ús en canvas.
      if (/^https?:/.test(url) && new URL(url).origin !== window.location.origin) img.crossOrigin = "anonymous";
      const timeout = setTimeout(() => finish(false), 10000);
      function finish(loaded) {
        clearTimeout(timeout);
        img.onload = img.onerror = null;
        if (loaded && img.naturalWidth && img.naturalHeight) resolve(img);
        else reject(new Error("No s’ha pogut carregar aquesta foto. Torna-ho a provar."));
      }
      img.onload = () => finish(true);
      img.onerror = () => finish(false);
      img.src = url;
    });
  }

  const SAMPLE_SYMBOLS = ["♡", "☀", "☾", "✿", "✧", "♫", "☁", "∞", "☺"];
  const pairs = { deck: [], open: [], matched: new Set(), moves: 0, timer: null, token: 0, loading: false, demo: false, error: "" };

  function pairsScreen() {
    const playing = pairs.deck.length === 18;
    const won = playing && pairs.matched.size === 9;
    shell("De dos en dos", `<p class="hand">Sempre hi ha algú que encaixa amb tu.</p>
      <p class="hint">Troba les nou parelles, al teu ritme.</p>
      ${pairs.demo && playing ? '<p class="test">Partida de mostra amb símbols. Amb nou fotos disponibles podràs jugar amb les vostres.</p>' : ""}
      <p id="pairs-status" class="pairs-status" role="status">${pairs.loading ? "Preparem les cartes…" : playing ? `${pairs.matched.size} de 9 parelles · ${pairs.moves} ${pairs.moves === 1 ? 'intent' : 'intents'}` : ""}</p>
      ${playing ? `<div class="pairs-board" aria-label="Memory de nou parelles">${pairs.deck.map((id, i) => {
        const face = pairs.open.includes(i) || pairs.matched.has(id);
        const found = pairs.matched.has(id);
        return button(`<span class="pair-back" aria-hidden="true">♡</span><span class="pair-front" aria-hidden="true">${pairs.demo ? `<span>${SAMPLE_SYMBOLS[Number(id)]}</span>` : image(id)}</span>`, "pairs-flip", {
          "data-index": i, "aria-pressed": String(face), "aria-label": found ? `Parella trobada, carta ${i + 1}` : face ? `Carta ${i + 1}: ${pairs.demo ? SAMPLE_SYMBOLS[Number(id)] : photo(id).alt || 'foto descoberta'}` : `Girar carta ${i + 1}`,
          "aria-disabled": String(found || pairs.open.includes(i) || pairs.open.length === 2),
        }, `pair-card${face ? ' is-face' : ''}${found ? ' is-found' : ''}`);
      }).join("")}</div>` : ""}
      ${won ? '<div class="pairs-finish" role="status"><p class="hand">Totes les peces, al seu lloc. ♡</p><p>Una altra estona junts?</p></div>' : ""}
      ${pairs.error ? `<p class="status" role="alert">${escapeHTML(pairs.error)}</p>` : ""}
      ${C.fotos.length >= 9 ? button(playing ? "Una altra partida amb fotos" : "Jugar amb les nostres fotos", "pairs-start", { disabled: pairs.loading }, "main") : '<p class="hint">El Memory amb fotos estarà disponible quan hi hagi nou fotografies diferents.</p>'}
      ${C.provisional && C.fotos.length < 9 ? button(playing ? "Tornar a provar" : "Provar amb cartes de mostra", "pairs-demo", { disabled: pairs.loading }, "main outline") : ""}`);
  }

  async function startPairs(demo) {
    if (ui.page !== "pairs" || pairs.loading || (demo && !C.provisional)) return;
    if (!demo && C.fotos.length < 9) return;
    clearTimeout(pairs.timer);
    const token = ++pairs.token;
    pairs.loading = true;
    pairs.deck = []; pairs.open = []; pairs.matched = new Set(); pairs.moves = 0; pairs.error = "";
    pairs.demo = demo;
    rerender();
    const ids = demo ? SAMPLE_SYMBOLS.map((_, i) => String(i)) : shuffled(C.fotos.map(p => p.id)).slice(0, 9);
    try {
      if (!demo) await Promise.all(ids.map(loadAsset));
      if (token !== pairs.token || ui.page !== "pairs") return;
      pairs.deck = shuffled([...ids, ...ids]);
      pairs.loading = false;
      rerender('[data-action="pairs-flip"]');
    } catch {
      if (token !== pairs.token || ui.page !== "pairs") return;
      pairs.loading = false;
      pairs.error = "Alguna foto no s’ha pogut carregar. Comprova la connexió i torna a començar la partida.";
      rerender('[data-action="pairs-start"]');
    }
  }

  function flipPair(index) {
    if (ui.page !== "pairs" || pairs.loading || !Number.isInteger(index) || index < 0 || index >= pairs.deck.length ||
        pairs.open.length === 2 || pairs.open.includes(index) || pairs.matched.has(pairs.deck[index])) return;
    pairs.open.push(index);
    if (pairs.open.length === 2) {
      pairs.moves++;
      const [first, second] = pairs.open;
      if (pairs.deck[first] === pairs.deck[second]) {
        pairs.matched.add(pairs.deck[first]);
        pairs.open = [];
        if (pairs.matched.size === 9) notify("Has trobat les nou parelles! ♡");
      } else {
        const token = pairs.token;
        pairs.timer = setTimeout(() => {
          if (token !== pairs.token || ui.page !== "pairs") return;
          const focused = document.activeElement?.dataset.index;
          pairs.open = [];
          rerender(focused !== undefined ? `[data-action="pairs-flip"][data-index="${focused}"]` : undefined);
        }, 1100);
      }
    }
    rerender(`[data-action="pairs-flip"][data-index="${index}"]`);
  }

  const cinema = { ids: [], index: 0, playing: false, random: false, ended: false, timer: null, scroll: 0 };

  function startCinema() {
    if (!albumPhotos().length) return;
    cinema.scroll = window.scrollY;
    cinema.ids = albumPhotos().map(p => p.id);
    if (cinema.random) cinema.ids = shuffled(cinema.ids);
    cinema.index = 0; cinema.ended = false;
    cinema.playing = !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    go("cinema");
  }

  function cinemaScreen() {
    if (!cinema.ids.length) { ui.page = "gallery"; galleryScreen(); return; }
    shell("El nostre petit cinema", `<p class="hand">Hi ha moments que mereixen tornar-los a veure</p>
      <div class="cinema-stage" id="cinema-stage"></div>
      <p id="cinema-count" class="status" role="status" aria-live="off"></p>
      <div class="cinema-controls">${button("←", "cinema-prev", { "aria-label": "Foto anterior" }, "main outline")}
      ${button("Pausa", "cinema-play", {}, "main")}${button("→", "cinema-next", { "aria-label": "Foto següent" }, "main outline")}</div>
      <div class="row cinema-modes" role="group" aria-label="Ordre de les fotos">
        ${button("En ordre", "cinema-mode", { "data-mode": "ordered" }, "main outline")}
        ${button("Barrejades", "cinema-mode", { "data-mode": "random" }, "main outline")}</div>
      ${button("← Tornar a l’àlbum", "cinema-back", {}, "back")}`);
    paintCinema();
  }

  function paintCinema() {
    clearTimeout(cinema.timer);
    if (ui.page !== "cinema") return;
    const id = cinema.ids[cinema.index];
    const stage = document.getElementById("cinema-stage");
    stage.innerHTML = `<figure>${image(id)}<figcaption>${escapeHTML(photo(id)?.text || "")}</figcaption></figure>`;
    document.getElementById("cinema-count").textContent = cinema.ended ? "Fins aquí, de moment. Ens en queden tantes per fer…" : `${cinema.index + 1} / ${cinema.ids.length}`;
    const play = app.querySelector('[data-action="cinema-play"]');
    play.textContent = cinema.playing ? "Pausa" : cinema.ended ? "Tornar a veure" : "Reproduir";
    play.setAttribute("aria-pressed", String(cinema.playing));
    app.querySelector('[data-action="cinema-prev"]').disabled = cinema.index === 0;
    app.querySelector('[data-action="cinema-next"]').disabled = cinema.index === cinema.ids.length - 1;
    for (const b of app.querySelectorAll('[data-action="cinema-mode"]')) b.setAttribute("aria-pressed", String((b.dataset.mode === "random") === cinema.random));
    // El temps de lectura comença quan s'ha carregat la fotografia.
    const frame = stage.firstElementChild;
    const img = stage.querySelector("img");
    let scheduledFrame = false;
    const schedule = () => {
      if (scheduledFrame || !frame.isConnected || !cinema.playing || document.hidden) return;
      scheduledFrame = true;
      cinema.timer = setTimeout(() => {
        if (ui.page !== "cinema" || !cinema.playing || document.hidden) return;
        if (cinema.index < cinema.ids.length - 1) cinema.index++;
        else { cinema.ended = true; cinema.playing = false; }
        paintCinema();
      }, 2000);
    };
    img.addEventListener("load", schedule, { once: true });
    img.addEventListener("error", schedule, { once: true });
    if (img.complete) schedule();
  }

  function moveCinema(direction) {
    if (ui.page !== "cinema") return;
    cinema.index = Math.max(0, Math.min(cinema.ids.length - 1, cinema.index + direction));
    cinema.ended = false;
    paintCinema();
  }

  function changeCinemaMode(mode) {
    if (ui.page !== "cinema" || !["ordered", "random"].includes(mode)) return;
    const current = cinema.ids[cinema.index];
    cinema.random = mode === "random";
    cinema.ids = albumPhotos().map(p => p.id);
    if (cinema.random) cinema.ids = [current, ...shuffled(cinema.ids.filter(id => id !== current))];
    cinema.index = Math.max(0, cinema.ids.indexOf(current));
    cinema.ended = false;
    paintCinema();
  }

  const POSTCARD_STYLES = [
    { id: "print", title: "Foto impresa", note: "Una mica de nostàlgia" },
    { id: "classic", title: "Postal elegant", note: "Per guardar ben a prop" },
    { id: "tape", title: "Paper amb cinta", note: "Com al nostre àlbum" },
  ];
  const postal = { id: C.fotos[0].id, style: "print", phrase: "", seq: 0, loaded: null, loadedId: "", ready: false, generating: false, url: "", file: null };

  function postcardScreen() {
    shell("Una postal nostra", `<p class="hand">Un trosset de nosaltres, per endur-te’l.</p>
      <label for="postcard-photo">1. Un record</label>
      <select id="postcard-photo">${C.fotos.map((p, i) => `<option value="${escapeHTML(p.id)}" ${p.id === postal.id ? 'selected' : ''}>${String(i + 1).padStart(3, '0')} · ${escapeHTML(p.text || p.alt || 'Una foto nostra')}</option>`).join("")}</select>
      <p class="field-label">2. El paper</p><div class="postcard-styles" role="group" aria-label="Disseny de la postal">${POSTCARD_STYLES.map(s => button(`<span class="style-swatch swatch-${s.id}" aria-hidden="true">♡</span><strong>${s.title}</strong>`, "postcard-style", { "data-style": s.id, "aria-pressed": String(s.id === postal.style) }, "style-choice")).join("")}</div>
      <label for="postcard-phrase">3. Unes paraules teves</label>
      <textarea id="postcard-phrase" rows="2" maxlength="140" placeholder="Si et ve de gust…">${escapeHTML(postal.phrase)}</textarea>
      <p class="hint">Opcional · fins a 140 caràcters</p>
      <div class="postcard-preview"><canvas id="postcard-canvas" width="1200" height="1500" role="img" aria-label="Previsualització de la postal"></canvas></div>
      <p id="postcard-status" class="status" role="status">Preparem el teu record…</p>
      ${button("Preparar la imatge", "postcard-generate", { disabled: true })}
      <div id="postcard-result" hidden></div>`);
    updatePostcard();
  }

  function clearPostcardResult() {
    if (postal.url) URL.revokeObjectURL(postal.url);
    postal.url = ""; postal.file = null;
    const result = document.getElementById("postcard-result");
    if (result) { result.hidden = true; result.replaceChildren(); }
  }

  async function updatePostcard() {
    if (ui.page !== "postcard") return;
    clearPostcardResult();
    const seq = ++postal.seq;
    postal.ready = false; postal.generating = false;
    const canvas = document.getElementById("postcard-canvas");
    const status = document.getElementById("postcard-status");
    const generate = app.querySelector('[data-action="postcard-generate"]');
    generate.disabled = true;
    generate.textContent = "Preparar la imatge";
    status.textContent = "Preparem el teu record…";
    for (const b of app.querySelectorAll('[data-action="postcard-style"]')) b.setAttribute("aria-pressed", String(b.dataset.style === postal.style));
    try {
      if (postal.loadedId !== postal.id || !postal.loaded) {
        const id = postal.id;
        const img = await loadAsset(id);
        if (seq !== postal.seq || ui.page !== "postcard") return;
        postal.loaded = img; postal.loadedId = id;
      }
      if (seq !== postal.seq || !canvas.isConnected) return;
      drawPostcard(canvas, postal.loaded, postal.style, postal.phrase);
      postal.ready = true; generate.disabled = false;
      status.textContent = "Així quedarà la teva postal.";
    } catch (error) {
      if (seq !== postal.seq || !canvas.isConnected) return;
      canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
      status.textContent = error.message || "No s’ha pogut preparar la postal. Tria una altra foto.";
    }
  }

  function drawPostcard(canvas, img, style, phrase) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Aquest navegador no pot dibuixar la postal. Prova-ho a Safari o Chrome.");
    const W = 1200, H = 1500;
    canvas.width = W; canvas.height = H;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    const fill = (color, x, y, w, h) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
    const label = (value, x, y, size, color = "#762d3c", italic = false) => {
      ctx.font = `${italic ? 'italic ' : ''}${size}px Georgia, serif`;
      ctx.fillStyle = color; ctx.textAlign = "center"; ctx.fillText(value, x, y);
    };
    const contained = (x, y, w, h) => {
      fill("#eee4d8", x, y, w, h);
      const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
      ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    };
    fill(style === "tape" ? "#e9dbca" : "#f6ede0", 0, 0, W, H);
    if (style === "classic") {
      ctx.strokeStyle = "#762d3c"; ctx.lineWidth = 2;
      ctx.strokeRect(42, 42, W - 84, H - 84); ctx.strokeRect(54, 54, W - 108, H - 108);
      label("U N   R E C O R D   N O S T R E", W / 2, 128, 25);
      label("Tu i jo.", W / 2, 220, 74, "#762d3c", true);
      contained(104, 274, 992, 820);
      label("♡", W / 2, 1410, 50);
    } else if (style === "tape") {
      ctx.strokeStyle = "#d9c7b255"; ctx.lineWidth = 1;
      for (let y = 45; y < H; y += 45) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.save(); ctx.shadowColor = "#4b261e22"; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12;
      fill("#fffaf3", 68, 120, 1064, 1010); ctx.restore();
      contained(94, 150, 1012, 920);
      for (const [x, y, angle] of [[135, 126, -.30], [1060, 112, .35]]) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(angle); fill("#c3a37aaa", -100, -30, 200, 60); ctx.restore();
      }
      label("un lloc on tornar", W / 2, 1420, 28, "#705950", true);
    } else {
      ctx.save(); ctx.shadowColor = "#4b261e22"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
      fill("#fffdf8", 58, 58, 1084, 1368); ctx.restore();
      contained(94, 94, 1012, 1000);
      label("♡", W / 2, 1385, 45);
    }
    const words = (phrase.trim() || "Un record per guardar.").replace(/\s+/g, " ").split(" ");
    let lines = [], size = 48;
    for (; size >= 24; size -= 2) {
      ctx.font = `italic ${size}px Georgia, serif`; lines = []; let line = "";
      for (const word of words) {
        if (ctx.measureText([line, word].filter(Boolean).join(" ")).width <= 960) { line = [line, word].filter(Boolean).join(" "); continue; }
        if (line) { lines.push(line); line = ""; }
        for (const char of word) {
          if (ctx.measureText(line + char).width > 960) { lines.push(line); line = char; } else line += char;
        }
      }
      if (line) lines.push(line);
      if (lines.length <= 4 && lines.length * size * 1.3 <= 180) break;
    }
    const lineHeight = size * 1.3;
    lines.forEach((line, i) => label(line, W / 2, 1250 - (lines.length - 1) * lineHeight / 2 + i * lineHeight, size, "#762d3c", true));
  }

  async function generatePostcard() {
    if (ui.page !== "postcard" || !postal.ready || postal.generating) return;
    const seq = postal.seq;
    postal.generating = true;
    const control = app.querySelector('[data-action="postcard-generate"]');
    control.disabled = true;
    document.getElementById("postcard-status").textContent = "Preparem la imatge per guardar…";
    try {
      const canvas = document.getElementById("postcard-canvas");
      // PNG conserva el text nítid. El resultat és la mateixa composició que la previsualització.
      const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("No s’ha pogut generar la imatge.")), "image/png"));
      if (seq !== postal.seq || ui.page !== "postcard") return;
      clearPostcardResult();
      postal.url = URL.createObjectURL(blob);
      if (typeof File === "function") postal.file = new File([blob], "una-postal-nostra.png", { type: "image/png" });
      let canShare = false;
      try { canShare = Boolean(postal.file && navigator.share && navigator.canShare?.({ files: [postal.file] })); } catch { /* Descàrrega disponible. */ }
      const result = document.getElementById("postcard-result");
      result.hidden = false;
      result.innerHTML = `<p class="hand">Ja la pots guardar. ♡</p>
        <img class="postcard-export" src="${postal.url}" alt="La teva postal, preparada per guardar">
        ${canShare ? button("Guardar o compartir…", "postcard-share") : ""}
        <a class="main" href="${postal.url}" download="una-postal-nostra.png">Descarregar la imatge</a>
        <p class="hint">A l’iPhone també pots mantenir premuda aquesta imatge i triar l’opció de desar-la.</p>`;
      document.getElementById("postcard-status").textContent = "Imatge preparada. Tria com la vols guardar.";
    } catch {
      if (seq !== postal.seq || ui.page !== "postcard") return;
      document.getElementById("postcard-status").textContent = "No s’ha pogut generar la imatge. Si has obert un fitxer local, prova-ho des de l’enllaç de la web o del servidor local. També pots provar una altra foto.";
    } finally {
      if (seq === postal.seq && ui.page === "postcard") { postal.generating = false; control.disabled = false; }
    }
  }

  async function sharePostcard() {
    if (ui.page !== "postcard" || !postal.file || !navigator.share) return;
    try { await navigator.share({ files: [postal.file], title: "Una postal nostra" }); }
    catch (error) { if (error.name !== "AbortError") notify("Pots guardar la postal amb el botó de descàrrega o mantenint premuda la imatge."); }
  }

  function leaveExtras(page) {
    if (page === "pairs") {
      clearTimeout(pairs.timer); pairs.token++; pairs.loading = false; pairs.open = [];
    }
    if (page === "cinema") { clearTimeout(cinema.timer); cinema.playing = false; }
    if (page === "postcard") { postal.seq++; postal.ready = false; postal.generating = false; clearPostcardResult(); }
  }

  document.addEventListener("visibilitychange", () => {
    if (ui.page === "cinema" && document.hidden) { cinema.playing = false; paintCinema(); }
  });
  window.addEventListener("pagehide", () => {
    if (cancelSurprisePin) cancelSurprisePin(false);
    leaveExtras(ui.page);
  });

  // 9. VISOR DE FOTOS ------------------------------------------------

  let viewing = null;
  let swipeStart = null;

  function viewerMarkup() {
    if (!viewing) return "";
    const p = photo(viewing.ids[viewing.index]);
    return `<div class="controls">
      ${button("←", "photo-prev", { "aria-label": "Foto anterior", disabled: viewing.ids.length < 2 }, "")}
      ${button("Tancar ×", "photo-close", { "aria-label": "Tancar la fotografia" }, "")}
      ${button("→", "photo-next", { "aria-label": "Foto següent", disabled: viewing.ids.length < 2 }, "")}</div>
      ${image(p.id)}${p.text ? `<p>${escapeHTML(p.text)}</p>` : ""}
      <div class="controls">${heart(p.id)}
        <span role="status" aria-live="polite">Foto ${viewing.index + 1} de ${viewing.ids.length}</span></div>`;
  }

  function paintViewer() {
    const focusAction = viewer.contains(document.activeElement) ? document.activeElement.dataset.action : "photo-close";
    viewer.innerHTML = viewerMarkup();
    viewer.querySelector(`[data-action="${focusAction || "photo-close"}"]`)?.focus({ preventScroll: true });
  }

  function openPhoto(id, opener) {
    if (!photo(id)) return;
    let photos = ui.page === "gallery" ? galleryPhotos()
      : ui.page === "favorites" ? C.fotos.filter(p => state.fav.includes(p.id)) : C.fotos;
    if (!photos.some(p => p.id === id)) photos = [photo(id)];
    viewing = { ids: photos.map(p => p.id), index: photos.findIndex(p => p.id === id),
      page: ui.page, scroll: window.scrollY, opener, dirty: false };
    if (typeof viewer.showModal === "function") {
      try {
        viewer.innerHTML = viewerMarkup();
        viewer.showModal();
        viewer.querySelector('[data-action="photo-close"]')?.focus({ preventScroll: true });
        return;
      } catch { /* Navegador sense suport complet: pantalla normal a sota. */ }
    }
    viewer.replaceChildren();
    go("photo-page");
  }

  function photoPageScreen() {
    if (!viewing) { ui.page = "gallery"; galleryScreen(); return; }
    shell("Un record nostre", viewerMarkup());
  }

  function movePhoto(direction) {
    if (!viewing || viewing.ids.length < 2) return;
    viewing.index = (viewing.index + direction + viewing.ids.length) % viewing.ids.length;
    if (viewer.open) paintViewer();
    else rerender('[data-action="photo-close"]');
  }

  function restorePhotoPage() {
    if (!viewing) return;
    const saved = viewing;
    viewing = null;
    swipeStart = null;
    if (ui.page === "photo-page") go(saved.page, { scroll: saved.scroll, focus: false });
    else if (saved.dirty) render();
    viewer.replaceChildren();
    const original = saved.opener?.isConnected ? saved.opener
      : app.querySelector(`[data-action="photo"][data-id="${saved.ids[saved.index]}"]`);
    if (original) original.focus({ preventScroll: true });
    else focusScreen();
    window.scrollTo(0, saved.scroll);
  }

  function closePhoto() {
    if (viewer.open && typeof viewer.close === "function") viewer.close();
    else restorePhotoPage();
  }

  viewer.addEventListener("close", restorePhotoPage);
  viewer.addEventListener("keydown", event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      movePhoto(event.key === "ArrowLeft" ? -1 : 1);
    }
  });

  // No es bloqueja el gest de pinça ni el desplaçament vertical.
  viewer.addEventListener("touchstart", event => {
    swipeStart = event.touches.length === 1 && event.target.matches("img")
      ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  viewer.addEventListener("touchend", event => {
    if (!swipeStart || event.touches.length || !event.changedTouches.length) { swipeStart = null; return; }
    const dx = event.changedTouches[0].clientX - swipeStart.x;
    const dy = event.changedTouches[0].clientY - swipeStart.y;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) movePhoto(dx < 0 ? 1 : -1);
    swipeStart = null;
  }, { passive: true });
  viewer.addEventListener("touchcancel", () => { swipeStart = null; }, { passive: true });

  // 10. ACCIONS ------------------------------------------------------

  function currentGame(index) {
    return ui.page === "game" && state.game.done === index && state.game.pending === null;
  }

  function fieldValue(id, fallback = "") {
    return document.getElementById(id)?.value ?? fallback;
  }

  function blowCandles(keepPrevious) {
    if (ui.page !== "welcome" || blowing) return;
    const previous = latest("desig");
    const value = keepPrevious && previous ? previous.value : fieldValue("wish").trim();
    state.drafts.wish = value;
    if (value && !keepPrevious) recordResponse("desig", value);
    persist();
    blowing = true;
    app.querySelector(".cake-scene")?.classList.add("out");
    app.querySelector(".cake-scene")?.setAttribute("aria-label", `Pastís amb les espelmes ${C.edat} apagades`);
    for (const control of app.querySelectorAll("button, textarea")) control.disabled = true;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    blowTimer = setTimeout(() => {
      blowing = false;
      ui.entryBlown = true;
      go("entry");
    }, reduced ? 0 : 550);
  }

  function confetti() {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const particles = document.createElement("div");
    particles.className = "confetti";
    particles.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 24; i++) {
      const piece = document.createElement("i");
      piece.style.setProperty("--x", `${Math.random() * 100}%`);
      piece.style.setProperty("--delay", `${i * 0.025}s`);
      particles.append(piece);
    }
    app.querySelector(".paper")?.append(particles);
    setTimeout(() => particles.remove(), 2400);
  }

  function toggleFavorite(id) {
    if (!item(id)) return;
    state.fav = state.fav.includes(id) ? state.fav.filter(value => value !== id) : [...state.fav, id];
    persist();
    const selected = state.fav.includes(id);
    for (const control of document.querySelectorAll(`[data-action="favorite"][data-id="${id}"]`)) {
      control.textContent = `${selected ? "♥" : "♡"} Preferit`;
      control.setAttribute("aria-pressed", String(selected));
      control.setAttribute("aria-label", `${selected ? "Treure de" : "Afegir a"} preferits: ${item(id).titol || photo(id)?.text || "fotografia"}`);
    }
    if (viewing) viewing.dirty = true;
    else if (ui.page === "favorites" || (ui.page === "gallery" && ui.galleryFav)) {
      rerender();
      focusScreen();
    }
  }

  function checkExpression() {
    if (!currentGame(3) || state.game.expressionOK) return;
    const expression = C.expressions[state.game.expression];
    const value = fieldValue("expression");
    state.drafts.expression = value;
    if (expression.respostes.some(answer => normalize(answer) === normalize(value))) {
      state.game.expressionOK = true;
      persist();
      rerender('[data-action="expression-next"]');
    } else {
      persist();
      document.getElementById("expression")?.setAttribute("aria-invalid", "true");
      notify("Prova una altra paraula. Tens una pista si la necessites.");
    }
  }

  function act(action, control) {
    const apartatsRaco = {
      "all-letters": "Els nostres sobres",
      "when": "Obre’m quan…",
      "gallery": "Els nostres records",
      "postcard": "Una postal nostra",
      "pairs": "Una estona més amb tu · Memory",
      "surprise": "Sorprèn-me",
      "favorites": "Preferits",
      "start": "Tornar a jugar / Continuar jugant"
    };

    if (
      ui.page === "corner" &&
      Object.prototype.hasOwnProperty.call(apartatsRaco, action) &&
      typeof window.goatcounter?.count === "function"
    ) {
      try {
        window.goatcounter.count({
          path: "raco-" + action,
          title: apartatsRaco[action],
          event: true
        });
      } catch (error) {
        // La navegació continua encara que fallin les estadístiques.
      }
    }

    const g = state.game;
    const pages = ["entry", "corner", "overview", "when", "all-letters", "gallery", "favorites", "pairs", "postcard"];
    if (pages.includes(action)) {
      if (blowing) return;
      if (ui.page === "photo-page") viewing = null;
      go(action);
      return;
    }
    switch (action) {
      case "pairs-start": startPairs(false); break;
      case "pairs-demo": startPairs(true); break;
      case "pairs-flip": flipPair(Number(control.dataset.index)); break;
      case "cinema-start": startCinema(); break;
      case "cinema-back": go("gallery", { scroll: cinema.scroll }); break;
      case "cinema-play": cinema.playing = !cinema.playing; cinema.ended = false; if (cinema.playing && cinema.index === cinema.ids.length - 1) cinema.index = 0; paintCinema(); break;
      case "cinema-prev": moveCinema(-1); break;
      case "cinema-next": moveCinema(1); break;
      case "cinema-mode": changeCinemaMode(control.dataset.mode); break;
      case "postcard-style":
        if (POSTCARD_STYLES.some(s => s.id === control.dataset.style)) { postal.style = control.dataset.style; updatePostcard(); }
        break;
      case "postcard-generate": generatePostcard(); break;
      case "postcard-share": sharePostcard(); break;
      case "blow": blowCandles(false); break;
      case "keep-wish": if (latest("desig")) blowCandles(true); break;
      case "start": startGame(); break;
      case "resume": resumeGame(); break;
      case "restart-ask": go("restart"); break;
      case "restart-confirm": if (ui.page === "restart") resetGame(); break;
      case "envelope": {
        const index = Number(control.dataset.index);
        if (!Number.isInteger(index) || index < 0 || index >= 6) return;
        if (index === g.pending) resumeGame();
        else if (index < g.done) openLetter(C.sobres[index].id, "overview");
        else if (index === g.done && g.pending === null) {
          g.started = true; g.checkpoint = "game"; persist(); go("game");
        }
        break;
      }
      case "tile": {
        if (!currentGame(0) || ui.photoStatus === "error") return;
        const index = Number(control.dataset.index);
        if (!Number.isInteger(index) || index < 0 || index > 8) return;
        if (g.selected === null) g.selected = index;
        else if (g.selected === index) g.selected = null;
        else {
          [g.tiles[index], g.tiles[g.selected]] = [g.tiles[g.selected], g.tiles[index]];
          g.selected = null;
        }
        persist();
        if (g.tiles.every((value, position) => value === position)) completeStep(0);
        else rerender(`[data-action="tile"][data-index="${index}"]`);
        break;
      }
      case "reference":
        if (currentGame(0)) { g.reference = !g.reference; persist(); rerender('[data-action="reference"]'); }
        break;
      case "retry-photo": if (currentGame(0)) loadPuzzlePhoto(); break;
      case "hint":
        if (currentGame(1)) { g.hint = Math.min(g.hint + 1, C.record.pistes.length); persist(); rerender(); }
        break;
      case "guess":
        if (!currentGame(1)) return;
        if (Number(control.dataset.index) === C.record.correcta) completeStep(1);
        else notify("Encara no… prova una altra opció o demana una pista.");
        break;
      case "reveal-memory": if (currentGame(1) && g.hint === C.record.pistes.length) completeStep(1); break;
      case "author":
        if (currentGame(2) && g.phraseChoice === null && ["berta", "tu"].includes(control.dataset.author)) {
          g.phraseChoice = control.dataset.author; persist(); rerender('[data-action="phrase-next"]');
        }
        break;
      case "phrase-next":
        if (!currentGame(2) || g.phraseChoice === null) return;
        if (g.phrase === C.frases.length - 1) completeStep(2);
        else { g.phrase++; g.phraseChoice = null; persist(); go("game"); }
        break;
      case "expression-hint":
        if (currentGame(3) && !g.expressionOK) { g.expressionHint = true; persist(); rerender('[data-action="expression-hint"]'); }
        break;
      case "expression-answer":
        if (currentGame(3) && g.expressionHint) { g.expressionOK = true; persist(); rerender('[data-action="expression-next"]'); }
        break;
      case "expression-next":
        if (!currentGame(3) || !g.expressionOK) return;
        if (g.expression === C.expressions.length - 1) completeStep(3);
        else {
          g.expression++; g.expressionOK = false; g.expressionHint = false;
          delete state.drafts.expression; persist(); go("game");
        }
        break;
      case "save-memory": {
        if (!currentGame(4)) return;
        const value = fieldValue("memory").trim();
        if (!value) {
          document.getElementById("memory")?.setAttribute("aria-invalid", "true");
          document.getElementById("memory")?.focus();
          notify("Escriu un record abans d’obrir el sobre."); return;
        }
        state.drafts.memory = value;
        recordResponse("record", value);
        completeStep(4);
        break;
      }
      case "keep-memory":
        if (currentGame(4) && latest("record")) { state.drafts.memory = latest("record").value; completeStep(4); }
        break;
      case "choose-plan":
        if (currentGame(5) && C.plans.some(p => p.id === control.dataset.id)) {
          state.drafts.extra = fieldValue("extra"); state.drafts.plan = control.dataset.id;
          persist(); rerender(`[data-action="choose-plan"][data-id="${control.dataset.id}"]`);
        }
        break;
      case "save-plan": {
        if (!currentGame(5)) return;
        const chosen = C.plans.find(p => p.id === selectedPlan());
        if (!chosen) { notify("Tria un dels quatre plans."); return; }
        const value = { plan: chosen.id, titol: chosen.titol, extra: fieldValue("extra").trim() };
        state.drafts.plan = value.plan; state.drafts.extra = value.extra;
        recordResponse("plans", value);
        completeStep(5);
        break;
      }
      case "keep-plan":
        if (currentGame(5) && latest("plans")) {
          state.drafts.plan = latest("plans").value.plan; state.drafts.extra = latest("plans").value.extra;
          completeStep(5);
        }
        break;
      case "reward-open":
        if (ui.page === "reward" && g.pending !== null) openLetter(C.sobres[g.pending].id, "game");
        break;
      case "finish-letter": finishLetter(); break;
      case "letter": openLetter(control.dataset.id, ui.page === "game" ? "corner" : ui.page); break;
      case "letter-back": go(ui.letterFrom, { scroll: ui.letterScroll }); break;
      case "favorite": toggleFavorite(control.dataset.id); break;
      case "gallery-all": ui.galleryFav = false; go("gallery"); break;
      case "gallery-fav": ui.galleryFav = true; go("gallery"); break;
      case "photo": openPhoto(control.dataset.id, control); break;
      case "photo-prev": movePhoto(-1); break;
      case "photo-next": movePhoto(1); break;
      case "photo-close": closePhoto(); break;
      case "surprise": pickSurprise(); break;
      case "retry": enqueueResponses(state.history.filter(e => e.status === PENDING).map(e => e.id)); break;
    }
  }

  // 11. ESDEVENIMENTS I ARRANCADA -------------------------------------

  for (const root of [app, viewer]) {
    root.addEventListener("click", event => {
      const control = event.target.closest("button[data-action]");
      if (!control || !root.contains(control) || control.disabled || event.detail > 1) return;
      if (root === app && viewer.open) return;
      act(control.dataset.action, control);
    });
    root.addEventListener("error", event => {
      if (event.target.tagName !== "IMG") return;
      const fallback = document.createElement("p");
      fallback.className = "hint";
      fallback.textContent = "Aquesta foto encara no està disponible.";
      event.target.replaceWith(fallback);
    }, true);
  }

  app.addEventListener("input", event => {
    if (event.target.id === "postcard-phrase") {
      postal.phrase = event.target.value.slice(0, 140);
      updatePostcard();
      return;
    }
    const key = event.target.dataset.draft;
    if (!["wish", "memory", "expression", "extra"].includes(key)) return;
    state.drafts[key] = event.target.value;
    event.target.removeAttribute("aria-invalid");
    persist(); // Cap enviament mentre escriu.
  });

  app.addEventListener("change", event => {
    if (event.target.id === "postcard-photo" && photo(event.target.value)) {
      postal.id = event.target.value;
      updatePostcard();
    }
  });

  app.addEventListener("submit", event => {
    event.preventDefault();
    if (event.target.id === "expression-form") checkExpression();
  });

  let puzzleImage;
  function loadPuzzlePhoto() {
    ui.photoStatus = "loading";
    const loading = new Image();
    puzzleImage = loading;
    loading.onload = () => {
      if (puzzleImage !== loading) return;
      ui.photoStatus = "ready";
      if (loading.naturalWidth > 0 && loading.naturalHeight > 0) ui.photoRatio = loading.naturalWidth / loading.naturalHeight;
      if (currentGame(0)) stylePuzzleTiles();
    };
    loading.onerror = () => {
      if (puzzleImage !== loading) return;
      ui.photoStatus = "error";
      if (currentGame(0)) rerender();
    };
    loading.src = imageURL(photo(C.puzzleFoto).src);
    if (currentGame(0)) rerender();
  }

  // Recuperar una pestanya des de la memòria del navegador també torna al pastís.
  window.addEventListener("pageshow", event => {
    if (!event.persisted) return;
    clearTimeout(blowTimer);
    blowing = false;
    // Tancar el visor aquí no ha de restaurar el desplaçament de l'àlbum
    // després de mostrar el pastís (l'esdeveniment close pot ser asíncron).
    viewing = null;
    if (viewer.open && typeof viewer.close === "function") viewer.close();
    viewer.replaceChildren();
    go("welcome");
  });

  render();
  refreshStorageNotice();
  loadPuzzlePhoto();
  if (loadWarning) notify(loadWarning);

  // No s'executa cap enviament en arrencar. Només en confirmar o reintentar.

})();
