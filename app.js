// Replace with your sheet ID
const SHEET_ID = '1bDOxSoMU7ZNz8gEnoOkkPGNhNSukntizB-Rwsk1_nCU';
const SHEET_NAME = 'cviky';

// Load Google Charts (needed for Query)
google.charts.load('current', { packages: ['corechart'] });
google.charts.setOnLoadCallback(fetchSheet);

const cardsEl = document.getElementById('cards');
const pillsEl = document.getElementById('pills');
const searchInput = document.getElementById('search');
const clearBtn = document.getElementById('clear');

let items = [];

const countText = document.getElementById('countText');

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
    // render pills
    pillsEl.innerHTML = '';
    const all = document.createElement('button');
    all.className = 'pill active';
    all.textContent = '🌟 Vše';
    all.dataset.cat = '';
    pillsEl.appendChild(all);
    cats.forEach(c => {
        const b = document.createElement('button');
        b.className = 'pill';
        b.textContent = c;
        b.dataset.cat = c;
        pillsEl.appendChild(b);
    });
    // attach handlers
    pillsEl.querySelectorAll('.pill').forEach(p => p.addEventListener('click', onPillClick));
}

function onPillClick(e) {
    // toggle active
    pillsEl.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    const target = e.currentTarget;
    target.classList.add('active');
    applyFilters();
}

function renderCards(list) {
    countText.textContent = `Zobrazeno ${list.length} z ${items.length} cviků`;
    if (!list.length) { cardsEl.innerHTML = '<div style="padding:20px;color:var(--muted)">Nenalezeny žádné položky.</div>'; return; }
    cardsEl.innerHTML = list.map(itemToCard).join('');
    // attach listeners
    document.querySelectorAll('.openVideo').forEach(btn => btn.addEventListener('click', onOpenVideo));
}

function itemToCard(it) {
    const tagClass = tagClassFor(it.category);
    const shortDesc = it.desc ? (it.desc.length > 140 ? it.desc.slice(0, 140) + '…' : it.desc) : '';
    return `
    <div class="card">
        <div class="card-body">
            <div class="meta">
                <h3>${escapeHtml(it.name)}</h3>
                <span class="tag ${tagClass}">${escapeHtml(it.category)}</span>
            </div>
            <p>${escapeHtml(shortDesc)}</p>
            <div class="actions">
                <button class="btn openVideo" data-link="${escapeAttr(it.link)}">▶ Přehrát video</button>
                <a class="btn ghost" href="${escapeAttr(it.link)}" target="_blank" rel="noopener">Otevřít</a>
            </div>
        </div>
    </div>`;
}

function tagClassFor(cat) {
    if (!cat) return '';
    const key = cat.toLowerCase();
    if (key.includes('koordin')) return 'koord';
    if (key.includes('síla') || key.includes('sila') || key.includes('síla')) return 'sila';
    if (key.includes('reakc') || key.includes('reakce')) return 'reakce';
    if (key.includes('vytr') || key.includes('vytrvalost')) return 'vytr';
    if (key.includes('rych') || key.includes('rychlost')) return 'rych';
    return '';
}

// Search / filter
searchInput.addEventListener('input', applyFilters);
pillsEl && pillsEl.addEventListener('click', (e) => { /* delegated in renderFilters */ });
clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    // reset pills to first (Vše)
    if (pillsEl) {
        pillsEl.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        const first = pillsEl.querySelector('.pill');
        if (first) first.classList.add('active');
    }
    applyFilters();
});

function applyFilters() {
    const q = searchInput.value.trim().toLowerCase();
    const activePill = pillsEl.querySelector('.pill.active');
    const cat = activePill ? (activePill.dataset.cat || '') : '';
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

