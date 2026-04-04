import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation, Zap, Activity, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useSelector } from 'react-redux';
import { RootState } from '../app/store';

type DriverStatus = 'Safe' | 'Warning' | 'Critical';

interface Driver {
  id: number; name: string; route: string; routeNum: number; status: DriverStatus;
  lat: number; lng: number; speed: number; fatigue: number; lastIncident: string;
}

const statusColors: Record<DriverStatus, string> = {
  Safe:     'hsl(142,71%,45%)',
  Warning:  'hsl(38,92%,50%)',
  Critical: 'hsl(1,77%,55%)',
};

const statusBg: Record<DriverStatus, string> = {
  Safe:     'bg-gd-green/20 text-gd-green border-gd-green/30',
  Warning:  'bg-gd-amber/20 text-gd-amber border-gd-amber/30',
  Critical: 'bg-gd-red/20 text-gd-red border-gd-red/30',
};

/* 
  Fix: Build svg icons instead of HTML divIcons so animations work correctly.
  The ping animation is defined as a native keyframe style in the HTML string.
*/
const createIcon = (d: Driver, isHighlighted: boolean) => {
  const color = statusColors[d.status];
  const size = d.status === 'Critical' ? 36 : isHighlighted ? 34 : 30;
  const initials = d.name.split(' ').map((n: string) => n[0]).join('');
  const shadow = isHighlighted ? `drop-shadow(0 4px 12px ${color})` : 'none';

  /* ping ring only for Critical */
  const pingRing = d.status === 'Critical'
    ? `<style>
        @keyframes gdping {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .gd-ping { animation: gdping 1.2s ease-out infinite; }
      </style>
      <div class="gd-ping" style="
        position:absolute;
        inset:-8px;
        border-radius:50%;
        border:2px solid ${color};
        pointer-events:none;
      "></div>`
    : '';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position:relative; display:flex; align-items:center; justify-content:center;">
        ${pingRing}
        <div style="
          display:flex; align-items:center; justify-content:center;
          border-radius:50%; border:2.5px solid white;
          font-family:'DM Sans','Space Grotesk',sans-serif;
          font-weight:700; color:white; font-size:${size > 30 ? 13 : 11}px;
          background-color:${color};
          width:${size}px; height:${size}px;
          filter:${shadow};
          transition: all 0.25s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        ">
          ${initials}
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
};

/* Animate map view ONLY when the selected driver ID changes — NOT on coordinate updates */
function FlyToDriver({ driver }: { driver: Driver | null }) {
  const map = useMap();
  const lastIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (driver && driver.id !== lastIdRef.current) {
      lastIdRef.current = driver.id;
      // Snapshot the coords at selection time — don't re-fly on tick updates
      map.flyTo([driver.lat, driver.lng], 14, { duration: 1.0, easeLinearity: 0.5 });
    }
    if (!driver) {
      lastIdRef.current = null;
    }
  }, [driver?.id]); // ← only depend on the ID, not the whole driver object

  return null;
}

export default function FleetMapPage() {
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState<DriverStatus | 'All'>('All');
  const [selected, setSelected]   = useState<Driver | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const liveDrivers               = useSelector((state: RootState) => state.fleet.drivers);

  const filtered = useMemo(() => {
    return liveDrivers.filter((d) => {
      if (filter !== 'All' && d.status !== filter) return false;
      if (search && !d.name.toLowerCase().includes(search.toLowerCase()) &&
          !d.route.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, filter, liveDrivers]);

  const filters: (DriverStatus | 'All')[] = ['All', 'Safe', 'Warning', 'Critical'];
  const liveSelected = selected ? liveDrivers.find(d => d.id === selected.id) ?? null : null;

  const safeCnt     = liveDrivers.filter(d => d.status === 'Safe').length;
  const warnCnt     = liveDrivers.filter(d => d.status === 'Warning').length;
  const criticalCnt = liveDrivers.filter(d => d.status === 'Critical').length;

  return (
    <div className="flex bg-background overflow-hidden relative" style={{ height: 'calc(100vh - 4rem)' }}>

      {/* ── LEFT SIDEBAR ── */}
      <aside className="hidden w-72 flex-shrink-0 flex-col border-r border-border bg-card overflow-hidden md:flex" style={{ zIndex: 10 }}>
        {/* Header */}
        <div className="p-4 border-b border-border flex-shrink-0">
          <h2 className="font-heading text-base font-bold text-foreground">Fleet Overview</h2>
          <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-gd-green pulse-green" />
            {liveDrivers.length} drivers active
          </p>

          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search driver or route..."
              className="w-full rounded-lg border border-border bg-background py-2 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Filters */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filter === f ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Driver list */}
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelected(selected?.id === d.id ? null : d)}
              onMouseEnter={() => setHoveredId(d.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`mb-1.5 w-full rounded-xl border p-3 text-left transition-all ${
                selected?.id === d.id
                  ? `${statusBg[d.status]} border`
                  : 'border-surface-border bg-surface hover:border-muted-foreground/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${statusBg[d.status]}`}>
                  {d.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{d.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{d.route}</p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[9px] font-medium flex-shrink-0 ${statusBg[d.status]}`}>
                  {d.status}
                </span>
              </div>
              <div className="mt-2 flex gap-4 text-[10px] text-muted-foreground">
                <span>🚌 {d.speed} km/h</span>
                <span>🛡 Score: {d.fatigue}</span>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-muted-foreground">
              <MapPin className="mb-2 h-6 w-6 opacity-30" />
              No drivers match filters
            </div>
          )}
        </div>
      </aside>

      {/* ── MAP AREA ── */}
      <div className="relative flex-1 overflow-hidden" style={{ zIndex: 0 }}>
        <MapContainer
          center={[23.0225, 72.5714]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={true}
        >
          <FlyToDriver driver={liveSelected} />

          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
            attribution='Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
            maxZoom={19}
          />

          {liveDrivers.map((d) => {
            const isFiltered = filter !== 'All' && d.status !== filter;
            const inSearch = search && !d.name.toLowerCase().includes(search.toLowerCase()) &&
              !d.route.toLowerCase().includes(search.toLowerCase());
            if (isFiltered || inSearch) return null;

            const isHighlighted = selected?.id === d.id || hoveredId === d.id;

            return (
              <Marker
                key={d.id}
                position={[d.lat, d.lng]}
                icon={createIcon(d, isHighlighted)}
                eventHandlers={{
                  click: () => setSelected(selected?.id === d.id ? null : d),
                  mouseover: () => setHoveredId(d.id),
                  mouseout: () => setHoveredId(null),
                }}
              >
                <Popup closeButton={false} className="custom-popup">
                  <div style={{
                    background: 'hsl(240,6%,8%)',
                    color: 'white',
                    borderRadius: 8,
                    padding: '8px 12px',
                    minWidth: 160,
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{d.name}</p>
                    <p style={{ fontSize: 10, color: 'hsl(240,5%,55%)', marginBottom: 6 }}>{d.route}</p>
                    <div style={{ display: 'flex', gap: 10, fontSize: 10, color: 'hsl(240,5%,55%)' }}>
                      <span>{d.speed} km/h</span>
                      <span>Score: {d.fatigue}</span>
                    </div>
                    <div style={{
                      marginTop: 6,
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 20,
                      fontSize: 9,
                      fontWeight: 600,
                      background: statusColors[d.status] + '30',
                      color: statusColors[d.status],
                      border: `1px solid ${statusColors[d.status]}50`,
                    }}>
                      {d.status}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* ── Status count bar (top overlay) ── */}
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-none"
          style={{ zIndex: 1000 }}
        >
          {[
            { label: 'Safe',     count: safeCnt,     cls: 'bg-gd-green/20 text-gd-green border border-gd-green/40' },
            { label: 'Warning',  count: warnCnt,     cls: 'bg-gd-amber/20 text-gd-amber border border-gd-amber/40' },
            { label: 'Critical', count: criticalCnt, cls: 'bg-gd-red/20 text-gd-red border border-gd-red/40' },
          ].map(s => (
            <span key={s.label} className={`rounded-full px-3 py-1 text-xs font-medium backdrop-blur-sm ${s.cls}`}>
              {s.count} {s.label}
            </span>
          ))}
        </div>

        {/* ── Legend (bottom-left) ── */}
        <div
          className="absolute bottom-4 left-4 rounded-xl border border-surface-border bg-card/90 backdrop-blur-sm p-3 text-xs"
          style={{ zIndex: 1000 }}
        >
          <p className="mb-2 font-semibold text-foreground">Status</p>
          {(['Safe', 'Warning', 'Critical'] as DriverStatus[]).map(s => (
            <div key={s} className="flex items-center gap-2 mb-1">
              <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusColors[s] }} />
              <span className="text-muted-foreground">{s}</span>
            </div>
          ))}
        </div>

        {/* ── Selected driver detail panel ── */}
        {liveSelected && (
          <div
            className="absolute right-4 top-12 w-72 rounded-2xl border border-surface-border bg-card/95 backdrop-blur-sm p-5 shadow-2xl"
            style={{ zIndex: 1000 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full font-heading text-sm font-bold ${statusBg[liveSelected.status]}`}>
                  {liveSelected.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-heading text-sm font-semibold text-foreground">{liveSelected.name}</p>
                  <p className="text-xs text-muted-foreground">Route {liveSelected.routeNum}</p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { label: 'Speed',        value: `${liveSelected.speed} km/h`, icon: Navigation },
                { label: 'Fatigue Score', value: `${liveSelected.fatigue}/100`, icon: Activity },
                { label: 'Status',       value: liveSelected.status, icon: Zap },
                { label: 'Last Incident', value: liveSelected.lastIncident, icon: MapPin },
              ].map(m => (
                <div key={m.label} className="rounded-xl bg-background p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <m.icon className="h-3 w-3 text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground">{m.label}</p>
                  </div>
                  <p className={`text-sm font-semibold ${
                    m.label === 'Status'
                      ? liveSelected.status === 'Critical' ? 'text-gd-red'
                      : liveSelected.status === 'Warning' ? 'text-gd-amber'
                      : 'text-gd-green'
                      : 'text-foreground'
                  }`}>
                    {m.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <button className="flex-1 rounded-lg bg-gd-red px-3 py-2 text-xs font-medium text-white hover:opacity-90 transition-opacity">
                Sound Alert
              </button>
              <button className="flex-1 rounded-lg border border-border px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors">
                Full Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
