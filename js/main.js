// Logika modala dnia, przełącznika języka oraz inicjalizacja mapy Leaflet.
// Dane (dayDataPL, dayDataEN, uiText, stops) pochodzą z js/data.js — wczytaj go przed tym plikiem.

let currentDayNum = null; // numer dnia aktualnie otwartego w modalu (do odświeżenia po zmianie języka)
let currentLang = 'pl'; // aktualnie wybrany język, ustawiany przez setLanguage

function openDayModal(dayNum){
  const d = window.activeDayData[dayNum];
  currentDayNum = dayNum;
  document.getElementById('modalEyebrow').textContent = uiText[currentLang].dayWord + ' ' + dayNum;
  document.getElementById('modalTitle').textContent = d.title;
  document.getElementById('modalKm').textContent = d.km || '';
  document.getElementById('modalKm').style.display = d.km ? 'block' : 'none';
  document.getElementById('modalDesc').textContent = d.desc;
  const list = document.getElementById('modalList');
  list.innerHTML = '';
  d.list.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    list.appendChild(li);
  });
  document.getElementById('dayModal').classList.add('open');
}
function closeDayModal(){
  document.getElementById('dayModal').classList.remove('open');
  currentDayNum = null;
}
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeDayModal(); });

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

  // Jeśli modal dnia jest akurat otwarty, odśwież jego treść w nowym języku.
  if (document.getElementById('dayModal').classList.contains('open') && currentDayNum !== null) {
    openDayModal(currentDayNum);
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
