// Main app — map overview + trip detail. Uses Leaflet for the map and
// React for the UI overlay.

const { useState, useEffect, useMemo, useRef, useCallback } = React;

// ─── TWEAK DEFAULTS ─────────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "title": "WANDERLOG",
  "subtitle": "Memories from Ben & Janna's adventures",
  "mapTheme": "voyager",
  "trackColor": "#586048",
  "showElevation": true
} /*EDITMODE-END*/;

const TITLE_OPTIONS = ["WANDERLOG", "TRAIL ATLAS", "BOOTPRINTS", "TWO BOOTS"];
const THEME_OPTIONS = ["voyager", "positron", "watercolor"];

// ─── LEAFLET TILE SOURCES ───────────────────────────────────────────────

const TILE_URLS = {
  voyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    sub: 'abcd'
  },
  positron: {
    url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    sub: 'abcd'
  },
  watercolor: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    sub: 'abcd'
  }
};

// ─── MARKER HTML ─────────────────────────────────────────────────────────

function markerHtml(trip) {
  return `
    <div class="trip-marker" style="--c:${trip.color}">
      <div class="trip-marker-disc">
        <div class="trip-marker-name">${trip.name}</div>
        <div class="trip-marker-year">${trip.year}</div>
      </div>
    </div>`;
}

// ─── HEADER ─────────────────────────────────────────────────────────────

function Header({ tweaks, totalKm, totalElev, activeTrip, meta, onHome }) {
  return (
    <header className="ta-header">
      <div className="ta-brand" onClick={onHome} style={{ cursor: activeTrip ? 'pointer' : 'default' }}>
        <div className="ta-brand-text">
          <div className="ta-brand-title">{tweaks.title}</div>
          <div className="ta-brand-sub">
            {activeTrip
              ? <span><span className="ta-brand-sub-em">{(meta && meta.title) || activeTrip.name}</span> · {activeTrip.country} · {activeTrip.months}</span>
              : <span>{tweaks.subtitle} · <span className="ta-brand-sub-em">{totalKm.toLocaleString()} km</span> on the trail · {totalElev.toLocaleString()} m climbed · {window.TRIPS.length} trips</span>
            }
          </div>
        </div>
      </div>

      <nav className="ta-nav">
        {activeTrip &&
          <button className="ta-nav-back" onClick={onHome}>
            <span aria-hidden>←</span> All trips
          </button>
        }
      </nav>
    </header>
  );
}

// ─── TRIP STATS PANEL ───────────────────────────────────────────────────

function StatsPanel({ trip, showElevation, meta }) {
  const elevationProfile = useMemo(() => {
    if (!showElevation) return null;
    const all = trip.allPoints.map(p => p[2]);
    const w = 320, h = 90;
    const max = Math.max(...all);
    const min = Math.min(...all);
    const range = max - min || 1;
    const pts = all.map((e, i) => {
      const x = i / (all.length - 1) * w;
      const y = h - (e - min) / range * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const path = `M 0,${h} L ${pts.join(' L ')} L ${w},${h} Z`;
    return { path, w, h, max, min };
  }, [trip, showElevation]);

  return (
    <aside className="ta-stats">
      <div className="ta-stats-head">
        <div className="ta-stats-overline">Trip log</div>
        <div className="ta-stats-title">{(meta && meta.title) || trip.name}</div>
        <div className="ta-stats-sub">{trip.country} · {trip.months}</div>
      </div>

      <p className="ta-stats-blurb">{(meta && meta.notes) || trip.blurb}</p>

      <div className="ta-stats-grid">
        <div className="ta-stat">
          <div className="ta-stat-num">{trip.stats.distance}</div>
          <div className="ta-stat-label">km walked</div>
        </div>
        <div className="ta-stat">
          <div className="ta-stat-num">{trip.stats.elevationGain.toLocaleString()}</div>
          <div className="ta-stat-label">m climbed</div>
        </div>
        <div className="ta-stat">
          <div className="ta-stat-num">{trip.stats.highest.toLocaleString()}</div>
          <div className="ta-stat-label">m highest pt</div>
        </div>
        <div className="ta-stat">
          <div className="ta-stat-num">{trip.stats.stages}</div>
          <div className="ta-stat-label">stages</div>
        </div>
      </div>

      {elevationProfile &&
        <div className="ta-elev">
          <div className="ta-elev-head">
            <span>Elevation profile</span>
            <span className="ta-elev-range">{elevationProfile.min.toLocaleString()}–{elevationProfile.max.toLocaleString()} m</span>
          </div>
          <svg viewBox={`0 0 ${elevationProfile.w} ${elevationProfile.h}`} className="ta-elev-svg" preserveAspectRatio="none">
            <defs>
              <linearGradient id="elevg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#d1af82" stopOpacity="0.85" />
                <stop offset="1" stopColor="#d1af82" stopOpacity="0.15" />
              </linearGradient>
            </defs>
            <path d={elevationProfile.path} fill="url(#elevg)" stroke="#586048" strokeWidth="1.4" />
          </svg>
        </div>
      }

      <div className="ta-stages">
        <div className="ta-stages-head">{trip.stages.length} stages</div>
        <ol className="ta-stages-list">
          {trip.stages.map((s, i) => {
            let d = 0;
            for (let k = 1; k < s.length; k++) {
              const a = s[k - 1], b = s[k];
              const φ1 = a[0] * Math.PI / 180, φ2 = b[0] * Math.PI / 180;
              const dφ = (b[0] - a[0]) * Math.PI / 180, dλ = (b[1] - a[1]) * Math.PI / 180;
              const x = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
              d += 2 * 6371 * Math.asin(Math.sqrt(x));
            }
            return (
              <li key={i}>
                <span className="ta-stage-n">{String(i + 1).padStart(2, '0')}</span>
                <span className="ta-stage-d">{d.toFixed(1)} km</span>
              </li>
            );
          })}
        </ol>
      </div>
    </aside>
  );
}

// ─── PHOTO CAROUSEL ──────────────────────────────────────────────────────

function PhotoCarousel({ trip }) {
  const [idx, setIdx] = useState(0);
  const photos = useMemo(() => {
    const captions = [
      'first morning on the trail',
      'pass crossing — clouds rolling in',
      'refuge dinner, soup and bread',
      'wildflowers above tree line',
      'river crossing, boots off',
      'the col at dawn',
      'janna scrambling',
      'ben at the cairn',
      'last village before the descent',
      'we made it'
    ];
    return Array.from({ length: 10 }, (_, i) => ({
      id: `${trip.id}-p${i}`,
      stage: Math.min(trip.stages.length, Math.floor(i / 10 * trip.stages.length) + 1),
      caption: captions[i],
      hue: (i * 47 + trip.year) % 60 + 20
    }));
  }, [trip]);

  const visible = 5;
  return (
    <div className="ta-carousel">
      <div className="ta-carousel-head">
        <div>
          <div className="ta-carousel-overline">Field notes</div>
          <div className="ta-carousel-title">{photos.length} photos · drop real images into media/{trip.id}/ to replace</div>
        </div>
        <div className="ta-carousel-controls">
          <button onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0} aria-label="Previous">←</button>
          <span className="ta-carousel-counter">{idx + 1} / {photos.length}</span>
          <button onClick={() => setIdx(Math.min(photos.length - 1, idx + 1))} disabled={idx >= photos.length - 1} aria-label="Next">→</button>
        </div>
      </div>
      <div className="ta-carousel-strip">
        <div className="ta-carousel-track" style={{ transform: `translateX(calc(${-idx * (100 / visible)}%))` }}>
          {photos.map((p, i) =>
            <div key={p.id} className={`ta-photo ${i === idx ? 'is-active' : ''}`} onClick={() => setIdx(i)}>
              <PhotoPlaceholder trip={trip} photo={p} index={i} />
              <div className="ta-photo-caption">
                <span className="ta-photo-stage">stage {p.stage}</span>
                <span className="ta-photo-cap">{p.caption}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PhotoPlaceholder({ trip, photo, index }) {
  const palettes = [
    ['#d1af82', '#bd9866', '#a78250'],
    ['#586048', '#6f7d52', '#48604a'],
    ['#866745', '#a18258', '#b88a4a'],
    ['#a8b4a4', '#8b9c87', '#6f8270']
  ];
  const pal = palettes[(index + trip.year) % palettes.length];
  return (
    <div className="ta-photo-img">
      <svg viewBox="0 0 200 140" preserveAspectRatio="none" width="100%" height="100%">
        <defs>
          <pattern id={`pat-${trip.id}-${index}`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <rect width="14" height="14" fill={pal[0]} />
            <rect width="7" height="14" fill={pal[1]} />
          </pattern>
        </defs>
        <rect width="200" height="140" fill={`url(#pat-${trip.id}-${index})`} />
        <path d={`M 0 ${90 + index % 3 * 8} L 30 ${70 + index % 4 * 5} L 60 85 L 90 65 L 130 78 L 170 60 L 200 75 L 200 140 L 0 140 Z`} fill={pal[2]} opacity="0.85" />
        <path d={`M 0 110 L 40 100 L 90 108 L 140 95 L 200 105 L 200 140 L 0 140 Z`} fill={pal[1]} opacity="0.95" />
      </svg>
      <div className="ta-photo-tag">photo · {trip.id}-{String(index + 1).padStart(2, '0')}.jpg</div>
    </div>
  );
}

// ─── MAP ────────────────────────────────────────────────────────────────

function MapView({ tweaks, activeTrip, onSelectTrip }) {
  const mapRef = useRef(null);
  const mapElRef = useRef(null);
  const layerRefs = useRef({ markers: [], tracks: [], stageLabels: [] });
  const tileRef = useRef(null);

  useEffect(() => {
    const m = L.map(mapElRef.current, {
      center: [48.5, 10],
      zoom: 5,
      minZoom: 3,
      maxZoom: 14,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: true
    });
    L.control.zoom({ position: 'bottomright' }).addTo(m);
    L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(m);
    mapRef.current = m;
    return () => { m.remove(); };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    if (tileRef.current) tileRef.current.remove();
    const cfg = TILE_URLS[tweaks.mapTheme] || TILE_URLS.voyager;
    tileRef.current = L.tileLayer(cfg.url, {
      subdomains: cfg.sub,
      attribution: cfg.attribution,
      maxZoom: 19,
      crossOrigin: true
    }).addTo(mapRef.current);
    mapElRef.current.dataset.theme = tweaks.mapTheme;
  }, [tweaks.mapTheme]);

  useEffect(() => {
    if (!mapRef.current) return;
    layerRefs.current.markers.forEach(m => m.remove());
    layerRefs.current.markers = [];
    if (activeTrip) return;

    window.TRIPS.forEach(trip => {
      const icon = L.divIcon({
        html: markerHtml(trip),
        className: 'trip-marker-wrap',
        iconSize: [120, 120],
        iconAnchor: [60, 60]
      });
      const marker = L.marker(trip.hub, { icon }).addTo(mapRef.current);
      marker.on('click', () => onSelectTrip(trip));
      layerRefs.current.markers.push(marker);
    });
  }, [activeTrip]);

  useEffect(() => {
    if (!mapRef.current) return;
    layerRefs.current.tracks.forEach(l => l.remove());
    layerRefs.current.stageLabels.forEach(l => l.remove());
    layerRefs.current.tracks = [];
    layerRefs.current.stageLabels = [];

    if (!activeTrip) {
      mapRef.current.flyTo([48.5, 10], 5, { duration: 1.2 });
      return;
    }

    const all = [];
    activeTrip.stages.forEach((stage, i) => {
      const latlngs = stage.map(p => [p[0], p[1]]);
      const halo = L.polyline(latlngs, {
        color: '#F7F7EF', weight: 7, opacity: 0.9,
        lineCap: 'round', lineJoin: 'round'
      }).addTo(mapRef.current);
      const line = L.polyline(latlngs, {
        color: tweaks.trackColor,
        weight: 3.5, opacity: 1,
        lineCap: 'round', lineJoin: 'round',
        dashArray: i % 2 ? '1 6' : null
      }).addTo(mapRef.current);
      layerRefs.current.tracks.push(halo, line);

      const start = stage[0];
      const dot = L.circleMarker([start[0], start[1]], {
        radius: 7, color: '#586048', weight: 2,
        fillColor: '#F7F7EF', fillOpacity: 1
      }).addTo(mapRef.current);
      const label = L.marker([start[0], start[1]], {
        icon: L.divIcon({
          html: `<div class="ta-stage-pin">${i + 1}</div>`,
          className: 'ta-stage-pin-wrap',
          iconSize: [22, 22], iconAnchor: [11, 11]
        }),
        interactive: false
      }).addTo(mapRef.current);
      layerRefs.current.stageLabels.push(dot, label);

      if (i === activeTrip.stages.length - 1) {
        const end = stage[stage.length - 1];
        const flag = L.marker([end[0], end[1]], {
          icon: L.divIcon({
            html: `<div class="ta-stage-pin end">★</div>`,
            className: 'ta-stage-pin-wrap',
            iconSize: [22, 22], iconAnchor: [11, 11]
          }),
          interactive: false
        }).addTo(mapRef.current);
        layerRefs.current.stageLabels.push(flag);
      }

      all.push(...latlngs);
    });

    const bounds = L.latLngBounds(all).pad(0.08);
    mapRef.current.flyToBounds(bounds, {
      duration: 1.2,
      paddingBottomRight: [400, 230],
      paddingTopLeft: [20, 100],
      maxZoom: 12
    });
  }, [activeTrip, tweaks.trackColor]);

  return <div ref={mapElRef} className="ta-map" />;
}

// ─── APP ────────────────────────────────────────────────────────────────

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [activeTripId, setActiveTripId] = useState(null);
  const activeTrip = activeTripId ? window.TRIPS.find(t => t.id === activeTripId) : null;
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    if (!activeTripId) {
      setMeta(null);
      return;
    }
    let cancelled = false;
    fetch(`data/${activeTripId}/meta.json`)
      .then(r => {
        if (!r.ok) return null;
        return r.json();
      })
      .then(data => {
        if (!cancelled) setMeta(data || null);
      })
      .catch(() => {
        if (!cancelled) setMeta(null);
      });
    return () => { cancelled = true; };
  }, [activeTripId]);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') setActiveTripId(null); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  return (
    <div className="ta-app" data-active={activeTrip ? 'true' : 'false'}>
      <Header
        tweaks={tweaks}
        totalKm={window.totalDistance}
        totalElev={window.totalElevation}
        activeTrip={activeTrip}
        meta={meta}
        onHome={() => setActiveTripId(null)}
      />

      <MapView
        tweaks={tweaks}
        activeTrip={activeTrip}
        onSelectTrip={t => setActiveTripId(t.id)}
      />

      {activeTrip &&
        <>
          <StatsPanel trip={activeTrip} showElevation={tweaks.showElevation} meta={meta} />
          <PhotoCarousel trip={activeTrip} meta={meta} />
        </>
      }

      <TweaksPanel title="Tweaks">
        <TweakSection label="Identity">
          <TweakRadio
            label="Title"
            value={tweaks.title}
            onChange={v => setTweak('title', v)}
            options={TITLE_OPTIONS}
          />
          <TweakText
            label="Subtitle"
            value={tweaks.subtitle}
            onChange={v => setTweak('subtitle', v)}
          />
        </TweakSection>
        <TweakSection label="Map">
          <TweakRadio
            label="Tile theme"
            value={tweaks.mapTheme}
            onChange={v => setTweak('mapTheme', v)}
            options={THEME_OPTIONS}
          />
          <TweakColor
            label="Track colour"
            value={tweaks.trackColor}
            onChange={v => setTweak('trackColor', v)}
            options={['#586048', '#866745', '#222222', '#FFC806']}
          />
        </TweakSection>
        <TweakSection label="Trip detail">
          <TweakToggle
            label="Show elevation profile"
            value={tweaks.showElevation}
            onChange={v => setTweak('showElevation', v)}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
