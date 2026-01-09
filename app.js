// Replace with your sheet ID
const SHEET_ID = '1bDOxSoMU7ZNz8gEnoOkkPGNhNSukntizB-Rwsk1_nCU';
const SHEET_NAME = 'cviky';

// Load Google Charts (needed for Query)
google.charts.load('current', { packages: ['corechart'] });
google.charts.setOnLoadCallback(fetchSheet);

const cardsEl = document.getElementById('cards');
const catFilter = document.getElementById('categoryFilter');
const searchInput = document.getElementById('search');
const clearBtn = document.getElementById('clear');

let items = [];

function fetchSheet() {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${encodeURIComponent(SHEET_NAME)}&headers=1`;
    const query = new google.visualization.Query(url);
    query.send(handleResponse);
}

function handleResponse(response) {
    if (response.isError()) {
        cardsEl.innerHTML = `<div style="padding:20px;color:#f66">Chyba při načítání: ${response.getMessage()}</div>`;
        return;
    }
    const dt = response.getDataTable();
    const cols = dt.getNumberOfColumns();
    const rows = dt.getNumberOfRows();
    // Expecting columns: ODKAZ, NÁZEV, KATEGORIE, Popis cvičení ... but we'll read first 4 cols flexibly
    items = [];
    for (let r = 0; r < rows; r++) {
        const link = safeGet(dt, r, 0);
        const name = safeGet(dt, r, 1) || 'Bez názvu';
        const category = safeGet(dt, r, 2) || '';
        const desc = safeGet(dt, r, 3) || '';
        items.push({ link, name, category, desc });
    }
    renderFilters();
    renderCards(items);
}

function safeGet(dt, r, c) { try { return dt.getValue(r, c); } catch (e) { return ''; } }

function renderFilters() {
    const cats = Array.from(new Set(items.map(i => i.category).filter(Boolean))).sort();
    catFilter.innerHTML = '<option value="">Všechny kategorie</option>' + cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
}

function renderCards(list) {
    if (!list.length) { cardsEl.innerHTML = '<div style="padding:20px;color:var(--muted)">Nenalezeny žádné položky.</div>'; return; }
    cardsEl.innerHTML = list.map(itemToCard).join('');
    // attach listeners
    document.querySelectorAll('.openVideo').forEach(btn => btn.addEventListener('click', onOpenVideo));
}

function itemToCard(it) {
    const catClass = catClassFor(it.category);
    const shortDesc = it.desc ? (it.desc.length > 120 ? it.desc.slice(0, 120) + '…' : it.desc) : '';
    return `
  <div class="card">
    <div class="meta">
      <h3>${escapeHtml(it.name)}</h3>
      <span class="label ${catClass}">${escapeHtml(it.category)}</span>
    </div>
    <p>${escapeHtml(shortDesc)}</p>
    <div class="actions">
      <button class="btn small openVideo" data-link="${escapeAttr(it.link)}">Přehrát / náhled</button>
      <a class="btn small" href="${escapeAttr(it.link)}" target="_blank" rel="noopener">Otevřít</a>
    </div>
  </div>`;
}

function catClassFor(cat) {
    if (!cat) return '';
    const key = cat.toLowerCase();
    if (key.includes('koordin')) return 'koord';
    if (key.includes('síla') || key.includes('síla') || key.includes('sila') || key.includes('síla')) return 'sila';
    if (key.includes('reakc') || key.includes('reakce')) return 'reakce';
    if (key.includes('vytr') || key.includes('vytrvalost')) return 'vytr';
    if (key.includes('rych') || key.includes('rychlost')) return 'rych';
    return '';
}

// Search / filter
searchInput.addEventListener('input', applyFilters);
catFilter.addEventListener('change', applyFilters);
clearBtn.addEventListener('click', () => { searchInput.value = ''; catFilter.value = ''; applyFilters(); });

function applyFilters() {
    const q = searchInput.value.trim().toLowerCase();
    const cat = catFilter.value;
    const filtered = items.filter(i => {
        if (cat && i.category !== cat) return false;
        if (q && !((i.name || '').toLowerCase().includes(q) || (i.desc || '').toLowerCase().includes(q))) return false;
        return true;
    });
    renderCards(filtered);
}

// Modal handling
const modal = document.getElementById('modal');
const videoFrame = document.getElementById('videoFrame');
const closeModal = document.getElementById('closeModal');
const openExtern = document.getElementById('openExtern');

function onOpenVideo(e) {
    const link = e.currentTarget.getAttribute('data-link') || '';
    const vid = extractYouTubeId(link);
    if (vid) {
        videoFrame.src = `https://www.youtube.com/embed/${vid}?rel=0&autoplay=1`;
        openExtern.href = `https://www.youtube.com/watch?v=${vid}`;
    } else {
        // fallback open link
        openExtern.href = link || '#';
        videoFrame.src = '';
    }
    modal.setAttribute('aria-hidden', 'false');
}
closeModal.addEventListener('click', () => { closeVideo(); });
modal.addEventListener('click', (ev) => { if (ev.target === modal) closeVideo(); });
function closeVideo() { videoFrame.src = ''; modal.setAttribute('aria-hidden', 'true'); }

function extractYouTubeId(url) {
    if (!url) return null;
    try {
        // common patterns: /shorts/ID, v=ID, youtu.be/ID
        const u = url.trim();
        const m1 = u.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/i);
        if (m1) return m1[1];
        const m2 = u.match(/[?&]v=([a-zA-Z0-9_-]{6,})/i);
        if (m2) return m2[1];
        const m3 = u.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/i);
        if (m3) return m3[1];
        // last resort, extract last path segment
        const mm = u.split('/').filter(Boolean).pop();
        if (mm && mm.length >= 6) return mm;
    } catch (e) { }
    return null;
}

// helpers for safety
function escapeHtml(s) { if (!s && s !== 0) return ''; return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": "&#39;" }[c]; }); }
function escapeAttr(s) { return escapeHtml(s).replace(/"/g, '&quot;'); }

// Small UX: show a loading placeholder
cardsEl.innerHTML = '<div style="padding:20px;color:var(--muted)">Načítám data z Google Sheets…</div>';

