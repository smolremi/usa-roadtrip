// Logika modala dnia/parku, przełącznika języka oraz inicjalizacja mapy Leaflet.
// Dane (dayDataPL, dayDataEN, parkDataPL, parkDataEN, uiText, stops) pochodzą
// z js/data.js — wczytaj go przed tym plikiem.

let currentDayNum = null; // numer dnia aktualnie otwartego w modalu (do odświeżenia po zmianie języka)
let currentParkNum = null; // numer parku aktualnie otwartego w modalu (do odświeżenia po zmianie języka)
let currentModalType = null; // 'day' | 'park' - który rodzaj treści jest aktualnie w modalu
let currentLang = 'pl'; // aktualnie wybrany język, ustawiany przez setLanguage

function openDayModal(dayNum){
  const d = window.activeDayData[dayNum];
  currentModalType = 'day';
  currentDayNum = dayNum;
  currentParkNum = null;
  document.getElementById('modalEyebrow').textContent = uiText[currentLang].dayWord + ' ' + dayNum;
  document.getElementById('modalTitle').textContent = d.title;
  document.getElementById('modalKm').textContent = d.km || '';
  document.getElementById('modalKm').style.display = d.km ? 'block' : 'none';
  document.getElementById('modalDesc').style.display = 'block';
  document.getElementById('modalDesc').textContent = d.desc;
  const list = document.getElementById('modalList');
  list.innerHTML = '';
  d.list.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    list.appendChild(li);
  });
  renderGallery(d.photos, d.title);
  document.getElementById('dayModal').classList.add('open');
}

// Galeria zdjęć w modalu dnia. Buduje siatkę miniatur z tablicy d.photos
// (ścieżki z js/data.js). Kliknięcie miniatury otwiera zdjęcie w lightboxie.
function renderGallery(photos, title){
  const gallery = document.getElementById('modalGallery');
  gallery.innerHTML = '';
  if (!photos || !photos.length){
    gallery.style.display = 'none';
    return;
  }
  gallery.style.display = 'grid';
  photos.forEach((src, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gallery-thumb';
    btn.addEventListener('click', () => openLightbox(photos, i, title));
    const img = document.createElement('img');
    img.src = src;
    img.loading = 'lazy';
    img.alt = (title || 'Zdjęcie') + ' — ' + (i + 1);
    btn.appendChild(img);
    gallery.appendChild(btn);
  });
}

// Stan lightboxa: cała galeria danego dnia + indeks aktualnie pokazanego zdjęcia.
let lightboxPhotos = [];
let lightboxIndex = 0;
let lightboxAlt = '';

function openLightbox(photos, index, alt){
  lightboxPhotos = Array.isArray(photos) ? photos : [photos];
  lightboxIndex = index || 0;
  lightboxAlt = alt || '';
  updateLightbox();
  document.getElementById('lightbox').classList.add('open');
}

function updateLightbox(){
  const img = document.getElementById('lightboxImg');
  img.src = lightboxPhotos[lightboxIndex] || '';
  img.alt = lightboxPhotos.length > 1
    ? lightboxAlt + ' — ' + (lightboxIndex + 1) + '/' + lightboxPhotos.length
    : lightboxAlt;
  // Strzałki widoczne tylko gdy w galerii jest więcej niż jedno zdjęcie.
  const multi = lightboxPhotos.length > 1;
  document.querySelectorAll('.lightbox-nav').forEach(btn => {
    btn.style.display = multi ? 'flex' : 'none';
  });
}

// Przełącz zdjęcie w lightboxie o delta (-1 / +1), z zawijaniem w obrębie galerii dnia.
function lightboxStep(delta){
  if (lightboxPhotos.length < 2) return;
  lightboxIndex = (lightboxIndex + delta + lightboxPhotos.length) % lightboxPhotos.length;
  updateLightbox();
}

function closeLightbox(){
  document.getElementById('lightbox').classList.remove('open');
  document.getElementById('lightboxImg').src = '';
  lightboxPhotos = [];
}

// Modal karty parku - ten sam modal co dni (#dayModal), tylko bez daty/opisu,
// same fakty w modalList. Eyebrow pokazuje stan zamiast "Dzień X".
function openParkModal(parkNum){
  const p = window.activeParkData[parkNum];
  currentModalType = 'park';
  currentParkNum = parkNum;
  currentDayNum = null;
  document.getElementById('modalEyebrow').textContent = p.subtitle;
  document.getElementById('modalTitle').textContent = p.title;
  document.getElementById('modalKm').style.display = 'none';
  document.getElementById('modalDesc').style.display = 'none';
  const list = document.getElementById('modalList');
  list.innerHTML = '';
  p.list.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    list.appendChild(li);
  });
  renderGallery(null); // karty parków nie mają zdjęć
  document.getElementById('dayModal').classList.add('open');
}

function closeDayModal(){
  document.getElementById('dayModal').classList.remove('open');
  currentDayNum = null;
  currentParkNum = null;
  currentModalType = null;
}
document.addEventListener('keydown', e => {
  const lightboxOpen = document.getElementById('lightbox').classList.contains('open');
  if (lightboxOpen) {
    // Lightbox otwarty: Esc zamyka, strzałki lewo/prawo przełączają zdjęcie.
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') lightboxStep(-1);
    else if (e.key === 'ArrowRight') lightboxStep(1);
    return;
  }
  if (e.key === 'Escape') closeDayModal();
});

// Przełącznik języka PL/EN.
function setLanguage(lang){
  localStorage.setItem('siteLang', lang);
  document.documentElement.lang = lang;
  currentLang = lang;

  // Przyciski flag - podświetlenie aktywnego języka.
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // Wszystkie elementy z tłumaczeniem w atrybutach data-pl/data-en (karty parków, tagi stanów...).
  document.querySelectorAll('[data-pl][data-en]').forEach(el => {
    el.textContent = lang === 'en' ? el.dataset.en : el.dataset.pl;
  });

  // Statyczne teksty interfejsu z obiektu uiText (nagłówki sekcji, statystyki, stopka...).
  const t = uiText[lang];
  Object.keys(t).forEach(key => {
    const el = document.getElementById('ui-' + key);
    if (el) el.textContent = t[key];
  });
  // Podpowiedź "Kliknij, żeby zobaczyć więcej →" powtarza się na każdej karcie dnia.
  document.querySelectorAll('.day-card .hint').forEach(el => {
    el.textContent = t.dayHint;
  });

  // Aktywny zestaw danych dziennika podróży, używany m.in. przez openDayModal.
  window.activeDayData = lang === 'en' ? dayDataEN : dayDataPL;
  // Aktywny zestaw faktów o parkach, używany m.in. przez openParkModal.
  window.activeParkData = lang === 'en' ? parkDataEN : parkDataPL;

  // Karty dni w sekcji "Dziennik podróży" - numer, tytuł i dystans biorą się
  // wprost z activeDayData, więc zawsze są zgodne z treścią modala.
  document.querySelectorAll('.day-card[data-day]').forEach(card => {
    const d = window.activeDayData[card.dataset.day];
    if (!d) return;
    const numEl = card.querySelector('.day-num');
    if (numEl) numEl.textContent = t.dayWord + ' ' + card.dataset.day;
    const titleEl = card.querySelector('h4');
    if (titleEl) titleEl.textContent = d.title;
    const kmEl = card.querySelector('.km');
    if (kmEl) kmEl.textContent = d.km || '';
  });

  // Jeśli modal (dnia lub parku) jest akurat otwarty, odśwież jego treść w nowym języku.
  if (document.getElementById('dayModal').classList.contains('open')) {
    if (currentModalType === 'day' && currentDayNum !== null) {
      openDayModal(currentDayNum);
    } else if (currentModalType === 'park' && currentParkNum !== null) {
      openParkModal(currentParkNum);
    }
  }
}

// Prawdziwa mapa trasy (Leaflet + OpenStreetMap)
if (typeof L === 'undefined') {
  document.getElementById('trip-map').innerHTML =
    '<div style="height:100%;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px;color:#5B4B3A;font-size:14px;">' +
    'Nie udało się załadować biblioteki mapy (brak połączenia z internetem lub zablokowane CDN).<br>Sprawdź połączenie i odśwież stronę.' +
    '</div>';
} else {
  // Standardowe kafelki OpenStreetMap - w pełni darmowe i bez klucza API
  // (kafelki CARTO powyżej pokazywały błąd "API key required" po wprowadzeniu
  // przez CARTO limitów na darmowe, niepodpisane zapytania).
  const map = L.map('trip-map').setView([40.5, -109], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  // Wyraźne granice stanów USA - dorysowane osobno dla czytelności
  fetch('https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json')
    .then(res => res.json())
    .then(geo => {
      L.geoJSON(geo, {
        style: { color:'#8C3A22', weight:1.3, opacity:0.55, fillOpacity:0 }
      }).addTo(map);
    })
    .catch(() => { /* jeśli brak połączenia, mapa działa dalej bez tej warstwy */ });

  const customIcon = L.divIcon({
    className: '',
    html: '<div style="width:16px;height:16px;background:#B5442E;border:3px solid #F3E7CC;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
    iconSize:[16,16], iconAnchor:[8,8]
  });

  stops.forEach(s => {
    L.marker([s.lat, s.lng], { icon: customIcon }).addTo(map).bindPopup(s.name);
  });

  L.polyline(stops.map(s => [s.lat, s.lng]), { color:'#8C3A22', weight:3, dashArray:'6 6' }).addTo(map);

  const bounds = L.latLngBounds(stops.map(s => [s.lat, s.lng]));
  map.fitBounds(bounds, { padding:[30,30] });
}

// Wczytaj zapamiętany język (domyślnie polski) przy starcie strony.
setLanguage(localStorage.getItem('siteLang') || 'pl');

// PASEK POSTĘPU CZYTANIA
// Szerokość paska = ile procent strony zostało przewinięte.
(function initReadingProgress(){
  const bar = document.getElementById('readingProgress');
  if (!bar) return;
  function update(){
    const el = document.documentElement;
    const scrollable = el.scrollHeight - el.clientHeight;
    const pct = scrollable > 0 ? (el.scrollTop / scrollable) * 100 : 0;
    bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

// ANIMACJE PRZY SCROLLU
// Każdej sekcji i karcie dodajemy klasę "visible" gdy wjeżdża w widok.
// Raz pokazany element pozostaje widoczny (przestajemy go obserwować).
(function initScrollAnimations(){
  const targets = document.querySelectorAll('section, .park-card, .day-card, .stat, blockquote');
  if (!('IntersectionObserver' in window) || !targets.length) return;

  document.body.classList.add('anim-ready');

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  targets.forEach(el => observer.observe(el));
})();
