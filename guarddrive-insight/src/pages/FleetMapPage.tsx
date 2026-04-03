import { useState, useMemo, useEffect } from 'react';
import { Search, MapPin, Navigation, Zap, Activity } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type DriverStatus = 'Safe' | 'Warning' | 'Critical';

interface Driver {
  id: number; name: string; route: string; routeNum: number; status: DriverStatus;
  lat: number; lng: number; speed: number; fatigue: number; lastIncident: string;
}

import { useSelector } from 'react-redux';
import { RootState } from '../app/store';

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

const createIcon = (d: Driver, isHighlighted: boolean) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position:relative;">
        ${d.status === 'Critical' ? '<span style="position:absolute; inset:-12px; border-radius:50%; border:2px solid hsl(1,77%,55%); animation:ping 1s cubic-bezier(0,0,0.2,1) infinite; opacity:0.6;"></span>' : ''}
        <div style="
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%; border: 2px solid white;
          font-family: inherit; font-weight: bold; color: white;
          background-color: ${statusColors[d.status]};
          transition: all 0.2s;
          box-shadow: ${isHighlighted ? '0 10px 15px -3px rgb(0 0 0 / 0.5)' : 'none'};
          transform: ${isHighlighted ? 'scale(1.25)' : 'scale(1)'};
          ${d.status === 'Critical' ? 'width: 36px; height: 36px; font-size: 12px;' : 'width: 28px; height: 28px; font-size: 10px;'}
        ">
          ${d.name.split(' ').map(n => n[0]).join('')}
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

export default function FleetMapPage() {
  const [search, setSearch]           = useState('');
  const [filter, setFilter]           = useState<DriverStatus | 'All'>('All');
  const [selected, setSelected]       = useState<Driver | null>(null);
  const [hoveredId, setHoveredId]     = useState<number | null>(null);
  const liveDrivers = useSelector((state: RootState) => state.fleet.drivers);

  const filtered = useMemo(() => {
    return liveDrivers.filter((d) => {
      if (filter !== 'All' && d.status !== filter) return false;
      if (search && !d.name.toLowerCase().includes(search.toLowerCase()) &&
          !d.route.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, filter, liveDrivers]);

  const filters: (DriverStatus | 'All')[] = ['All', 'Safe', 'Warning', 'Critical'];
  const liveSelected = selected ? liveDrivers.find(d => d.id === selected.id) : null;
  const active = liveSelected ?? (hoveredId != null ? liveDrivers.find(d => d.id === hoveredId) ?? null : null);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden relative">
      <aside className="hidden w-72 flex-shrink-0 flex-col border-r border-border bg-card overflow-y-auto md:flex z-10 relative">
        <div className="p-4 border-b border-border">
          <h2 className="font-heading text-base font-bold text-foreground">Fleet Overview</h2>
          <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-gd-green pulse-green" />
            8 drivers active
          </p>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search driver or route..."
              className="w-full rounded-lg border border-border bg-background py-2 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filter === f ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >{f}</button>
            ))}
          </div>
        </div>

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
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${statusBg[d.status]}`}>
                  {d.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{d.name}</p>
                  <p className="text-[10px] text-muted-foreground">{d.route}</p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[9px] font-medium ${statusBg[d.status]}`}>{d.status}</span>
              </div>
              <div className="mt-2 flex gap-4 text-[10px] text-muted-foreground">
                <span>🚌 {d.speed} km/h</span>
                <span>🛡 Score: {d.fatigue}</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Real Map area */}
      <div className="relative flex-1 overflow-hidden z-0">
        <MapContainer 
          center={[23.0225, 72.5714]} 
          zoom={13} 
          style={{ height: '100%', width: '100%', background: '#0d0d1a' }}
          zoomControl={false}
        >
          <TileLayer
             url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
             attribution='Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
          />
          {liveDrivers.map((d) => {
            const isHighlighted = selected?.id === d.id || hoveredId === d.id;
            const isFiltered = filter !== 'All' && d.status !== filter;
            if (isFiltered) return null;
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
                <Popup className="custom-popup" closeButton={false}>
                   <div className="bg-card text-foreground px-1 py-1 text-left min-w-[140px]">
                     <p className="text-xs font-semibold">{d.name}</p>
                     <p className="text-[10px] text-muted-foreground">{d.route}</p>
                     <div className="mt-1 flex gap-3 text-[10px]">
                       <span className="text-muted-foreground">{d.speed} km/h</span>
                       <span className="text-muted-foreground">Score: {d.fatigue}</span>
                     </div>
                   </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Legend overlay */}
        <div className="absolute bottom-4 left-4 rounded-xl border border-surface-border bg-card/90 backdrop-blur-sm p-3 text-xs z-[1000]">
          <p className="mb-2 font-semibold text-foreground">Status</p>
          {(['Safe', 'Warning', 'Critical'] as DriverStatus[]).map((s) => (
            <div key={s} className="flex items-center gap-2 mb-1">
              <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusColors[s] }} />
              <span className="text-muted-foreground">{s}</span>
            </div>
          ))}
        </div>

        {/* Top bar overlay */}
        <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between pointer-events-none z-[1000]">
          <div className="flex gap-2">
            {([
              { label: 'Safe',     count: liveDrivers.filter(d => d.status === 'Safe').length,     color: 'bg-gd-green/20 text-gd-green border border-gd-green/30' },
              { label: 'Warning',  count: liveDrivers.filter(d => d.status === 'Warning').length,  color: 'bg-gd-amber/20 text-gd-amber border border-gd-amber/30' },
              { label: 'Critical', count: liveDrivers.filter(d => d.status === 'Critical').length, color: 'bg-gd-red/20 text-gd-red border border-gd-red/30' },
            ]).map((s) => (
              <span key={s.label} className={`rounded-full px-3 py-1 text-xs font-medium ${s.color}`}>
                {s.count} {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Selected Driver Panel */}
        {liveSelected && (
          <div className="absolute right-4 top-12 z-[1000] w-72 rounded-2xl border border-surface-border bg-card/95 backdrop-blur-sm p-5 shadow-xl">
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
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { label: 'Speed', value: `${liveSelected.speed} km/h`, icon: Navigation },
                { label: 'Fatigue Score', value: `${liveSelected.fatigue}/100`, icon: Activity },
                { label: 'Status', value: liveSelected.status, icon: Zap },
                { label: 'Last Incident', value: liveSelected.lastIncident, icon: MapPin },
              ].map((m) => (
                <div key={m.label} className="rounded-xl bg-background p-3">
                  <p className="text-[10px] text-muted-foreground">{m.label}</p>
                  <p className={`mt-0.5 text-sm font-semibold ${m.label === 'Status' ? (liveSelected.status === 'Critical' ? 'text-gd-red' : liveSelected.status === 'Warning' ? 'text-gd-amber' : 'text-gd-green') : 'text-foreground'}`}>
                    {m.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <button className="flex-1 rounded-lg bg-gd-red px-3 py-2 text-xs font-medium text-white hover:opacity-90">Sound Alert</button>
              <button className="flex-1 rounded-lg border border-border px-3 py-2 text-xs text-foreground hover:bg-muted">Full Report</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
