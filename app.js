(function () {
  "use strict";

  // --- Config ---
  const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
  const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
  const DEFAULT_CENTER = [52.23, 21.01]; // Warsaw fallback
  const DEFAULT_ZOOM = 13;

  // --- State ---
  let map;
  let searchMarker;
  let searchLat = DEFAULT_CENTER[0];
  let searchLon = DEFAULT_CENTER[1];
  let trailLayers = L.featureGroup();

  // --- DOM refs ---
  const radiusInput = document.getElementById("radius");
  const radiusValue = document.getElementById("radius-value");
  const searchBtn = document.getElementById("search-btn");
  const statusEl = document.getElementById("status");
  const locationInput = document.getElementById("location-input");
  const locationBtn = document.getElementById("location-btn");
  const locationResults = document.getElementById("location-results");
  const loadingOverlay = document.getElementById("loading-overlay");

  // --- Init map ---
  function initMap() {
    map = L.map("map").setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    trailLayers.addTo(map);

    // Click on map to set search point and auto-search
    map.on("click", function (e) {
      setSearchPoint(e.latlng.lat, e.latlng.lng);
      fetchTrails();
    });

    // Try geolocation
    if (navigator.geolocation) {
      setStatus("Szukam lokalizacji...", "loading");
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          setSearchPoint(pos.coords.latitude, pos.coords.longitude);
          map.setView([searchLat, searchLon], DEFAULT_ZOOM);
          setStatus("Kliknij na mapę lub wyszukaj lokalizację.", "info");
        },
        function () {
          setStatus("Brak geolokalizacji. Kliknij na mapę lub wyszukaj miejsce.", "info");
        }
      );
    }
  }

  function setSearchPoint(lat, lon) {
    searchLat = lat;
    searchLon = lon;
    if (searchMarker) {
      searchMarker.setLatLng([lat, lon]);
    } else {
      searchMarker = L.marker([lat, lon], {
        title: "Punkt wyszukiwania",
      }).addTo(map);
      searchMarker.bindPopup("Punkt wyszukiwania").openPopup();
    }
  }

  // --- Status bar with states ---
  function setStatus(text, state) {
    statusEl.textContent = text;
    statusEl.className = ""; // reset
    if (state === "loading") {
      statusEl.classList.add("status-loading");
    } else if (state === "success") {
      statusEl.classList.add("status-success");
    } else if (state === "error") {
      statusEl.classList.add("status-error");
    } else {
      statusEl.classList.add("status-info");
    }
  }

  // --- Loading overlay ---
  function showLoading() {
    loadingOverlay.classList.add("visible");
  }

  function hideLoading() {
    loadingOverlay.classList.remove("visible");
  }

  // --- Select a Nominatim result and auto-search ---
  function selectLocation(result) {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    setSearchPoint(lat, lon);

    // Use boundingbox from Nominatim for better zoom
    if (result.boundingbox) {
      const bb = result.boundingbox.map(parseFloat);
      // boundingbox = [south, north, west, east]
      map.fitBounds([
        [bb[0], bb[2]],
        [bb[1], bb[3]],
      ]);
    } else {
      map.setView([lat, lon], DEFAULT_ZOOM);
    }

    locationResults.innerHTML = "";
    locationInput.value = result.display_name.split(",").slice(0, 3).join(", ");

    // Auto-search trails after selecting location
    fetchTrails();
  }

  // --- Location search (Nominatim geocoding) ---
  async function searchLocation() {
    const query = locationInput.value.trim();
    if (!query) return;

    locationBtn.disabled = true;
    locationResults.innerHTML = "";
    setStatus("Szukam miejsca...", "loading");

    try {
      const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=pl`;
      const resp = await fetch(url, {
        headers: { "User-Agent": "TrailFinder/1.0" },
      });
      const results = await resp.json();

      if (results.length === 0) {
        setStatus("Nie znaleziono miejsca.", "error");
        return;
      }

      // Auto-select if exactly 1 result
      if (results.length === 1) {
        selectLocation(results[0]);
        return;
      }

      for (const r of results) {
        const div = document.createElement("div");
        div.className = "loc-item";
        div.textContent = r.display_name.split(",").slice(0, 3).join(", ");
        div.addEventListener("click", function () {
          selectLocation(r);
        });
        locationResults.appendChild(div);
      }
      setStatus("Wybierz lokalizację z listy.", "info");
    } catch (err) {
      setStatus("Błąd wyszukiwania: " + err.message, "error");
    } finally {
      locationBtn.disabled = false;
    }
  }

  locationBtn.addEventListener("click", searchLocation);
  locationInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") searchLocation();
  });

  // --- Radius slider ---
  radiusInput.addEventListener("input", function () {
    radiusValue.textContent = radiusInput.value;
  });

  // --- Overpass query ---
  function buildOverpassQuery(lat, lon, radiusKm) {
    const radiusM = radiusKm * 1000;
    return `[out:json][timeout:30];
(
  relation["route"~"hiking|foot|walking"](around:${radiusM},${lat},${lon});
  way["highway"~"path|footway|track"](around:${radiusM},${lat},${lon});
);
out body;
>;
out skel qt;`;
  }

  async function fetchTrails() {
    const radiusKm = parseInt(radiusInput.value, 10);
    const query = buildOverpassQuery(searchLat, searchLon, radiusKm);

    searchBtn.disabled = true;
    setStatus("Pobieram trasy...", "loading");
    showLoading();
    trailLayers.clearLayers();

    try {
      const resp = await fetch(OVERPASS_URL, {
        method: "POST",
        body: "data=" + encodeURIComponent(query),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      if (!resp.ok) throw new Error("Overpass API error: " + resp.status);

      const data = await resp.json();
      const result = parseOverpassData(data);
      renderTrails(result);

      const totalTrails = result.routes.length + result.paths.length;

      if (totalTrails > 0) {
        // Fit map to show all found trails
        const bounds = trailLayers.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [30, 30] });
        }
        setStatus(`Znaleziono: ${result.routes.length} szlaków, ${result.paths.length} ścieżek.`, "success");
      } else {
        setStatus("Nie znaleziono tras w tym obszarze. Spróbuj zwiększyć promień.", "error");
      }
    } catch (err) {
      setStatus("Błąd: " + err.message, "error");
      console.error(err);
    } finally {
      searchBtn.disabled = false;
      hideLoading();
    }
  }

  // --- Parse Overpass response ---
  function parseOverpassData(data) {
    const nodes = {};
    const ways = {};
    const routes = [];
    const paths = [];

    // Index nodes
    for (const el of data.elements) {
      if (el.type === "node") {
        nodes[el.id] = { lat: el.lat, lon: el.lon };
      }
    }

    // Index ways
    for (const el of data.elements) {
      if (el.type === "way") {
        const coords = [];
        for (const nid of el.nodes) {
          if (nodes[nid]) {
            coords.push([nodes[nid].lat, nodes[nid].lon]);
          }
        }
        ways[el.id] = { coords, tags: el.tags || {} };
      }
    }

    // Process relations (hiking routes)
    for (const el of data.elements) {
      if (el.type === "relation") {
        const memberCoords = [];
        for (const member of el.members) {
          if (member.type === "way" && ways[member.ref]) {
            memberCoords.push(ways[member.ref].coords);
          }
        }
        if (memberCoords.length > 0) {
          routes.push({
            name: (el.tags && el.tags.name) || "Szlak bez nazwy",
            type: "route",
            segments: memberCoords,
            tags: el.tags || {},
          });
        }
      }
    }

    // Collect used way IDs (those belonging to relations)
    const usedWayIds = new Set();
    for (const el of data.elements) {
      if (el.type === "relation") {
        for (const member of el.members) {
          if (member.type === "way") usedWayIds.add(member.ref);
        }
      }
    }

    // Process standalone ways (paths/footways not in any relation)
    for (const el of data.elements) {
      if (el.type === "way" && !usedWayIds.has(el.id) && ways[el.id] && ways[el.id].coords.length > 1) {
        const w = ways[el.id];
        paths.push({
          name: (w.tags.name) || tagToLabel(w.tags.highway),
          type: "path",
          segments: [w.coords],
          tags: w.tags,
        });
      }
    }

    return { routes, paths };
  }

  function tagToLabel(highway) {
    const labels = {
      path: "Ścieżka",
      footway: "Chodnik / droga piesza",
      track: "Droga gruntowa",
    };
    return labels[highway] || highway || "Ścieżka";
  }

  // --- Render trails on map ---
  function renderTrails(result) {
    for (const trail of result.routes) {
      drawTrail(trail, "#e63946", 4);
    }
    for (const trail of result.paths) {
      drawTrail(trail, "#457b9d", 3);
    }
  }

  function drawTrail(trail, color, weight) {
    const totalLength = calcTotalLength(trail.segments);
    for (const segment of trail.segments) {
      const polyline = L.polyline(segment, {
        color: color,
        weight: weight,
        opacity: 0.75,
      });
      polyline.bindPopup(buildPopupContent(trail, totalLength));
      polyline.on("mouseover", function () {
        this.setStyle({ weight: weight + 3, opacity: 1 });
      });
      polyline.on("mouseout", function () {
        this.setStyle({ weight: weight, opacity: 0.75 });
      });
      trailLayers.addLayer(polyline);
    }
  }

  function buildPopupContent(trail, lengthKm) {
    const typeLabel = trail.type === "route" ? "Szlak pieszy" : "Ścieżka";
    return `<strong>${trail.name}</strong><br/>
Typ: ${typeLabel}<br/>
Długość: ${lengthKm.toFixed(2)} km`;
  }

  // --- Distance calculation (Haversine) ---
  function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function calcTotalLength(segments) {
    let total = 0;
    for (const seg of segments) {
      for (let i = 1; i < seg.length; i++) {
        total += haversineDistance(seg[i - 1][0], seg[i - 1][1], seg[i][0], seg[i][1]);
      }
    }
    return total;
  }

  // --- Events ---
  searchBtn.addEventListener("click", fetchTrails);

  // --- Boot ---
  initMap();
})();
