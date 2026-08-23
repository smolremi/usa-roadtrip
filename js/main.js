// Logika modala dnia oraz inicjalizacja mapy Leaflet.
// Dane (dayData, stops) pochodzą z js/data.js — wczytaj go przed tym plikiem.

function openDayModal(dayNum){
  const d = dayData[dayNum];
  document.getElementById('modalEyebrow').textContent = 'Dzień ' + dayNum;
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
}
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeDayModal(); });

// Prawdziwa mapa trasy (Leaflet + OpenStreetMap/CARTO)
if (typeof L === 'undefined') {
  document.getElementById('trip-map').innerHTML =
    '<div style="height:100%;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px;color:#5B4B3A;font-size:14px;">' +
    'Nie udało się załadować biblioteki mapy (brak połączenia z internetem lub zablokowane CDN).<br>Sprawdź połączenie i odśwież stronę.' +
    '</div>';
} else {
  const map = L.map('trip-map').setView([40.5, -109], 5);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 18
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
