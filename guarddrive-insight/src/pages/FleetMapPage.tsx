import { useState, useMemo } from 'react';
import { Search, MapPin, Navigation, Zap, Activity } from 'lucide-react';

type DriverStatus = 'Safe' | 'Warning' | 'Critical';

interface Driver {
  id: number; name: string; route: string; routeNum: number; status: DriverStatus;
  lat: number; lng: number; speed: number; fatigue: number; lastIncident: string;
  x: number; y: number; // Normalized map coords (0-100)
}

const drivers: Driver[] = [
  { id: 1, name: 'Rajesh Kumar',  route: 'Route 42 — Ahmedabad Central', routeNum: 42, status: 'Safe',     lat: 23.022, lng: 72.571, speed: 67, fatigue: 92, lastIncident: '13:45', x: 48, y: 55 },
  { id: 2, name: 'Amit Shah',     route: 'Route 17 — SG Highway',        routeNum: 17, status: 'Warning',  lat: 23.033, lng: 72.585, speed: 72, fatigue: 71, lastIncident: '11:20', x: 68, y: 38 },
  { id: 3, name: 'Priya Patel',   route: 'Route 8 — Navrangpura',        routeNum: 8,  status: 'Safe',     lat: 23.015, lng: 72.560, speed: 45, fatigue: 97, lastIncident: 'None',  x: 32, y: 65 },
  { id: 4, name: 'Suresh Mehta',  route: 'Route 31 — Maninagar',         routeNum: 31, status: 'Critical', lat: 23.041, lng: 72.595, speed: 83, fatigue: 48, lastIncident: '14:30', x: 78, y: 25 },
  { id: 5, name: 'Deepak Joshi',  route: 'Route 5 — Satellite',          routeNum: 5,  status: 'Safe',     lat: 23.010, lng: 72.550, speed: 55, fatigue: 89, lastIncident: 'None',  x: 22, y: 72 },
  { id: 6, name: 'Neha Singh',    route: 'Route 22 — Vastrapur',         routeNum: 22, status: 'Warning',  lat: 23.028, lng: 72.578, speed: 61, fatigue: 66, lastIncident: '10:15', x: 55, y: 45 },
  { id: 7, name: 'Vikram Rao',    route: 'Route 14 — Paldi',             routeNum: 14, status: 'Safe',     lat: 23.018, lng: 72.565, speed: 48, fatigue: 91, lastIncident: 'None',  x: 40, y: 60 },
  { id: 8, name: 'Anita Desai',   route: 'Route 9 — Bopal',              routeNum: 9,  status: 'Safe',     lat: 23.035, lng: 72.588, speed: 52, fatigue: 85, lastIncident: '09:40', x: 72, y: 33 },
];

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
const statusDot: Record<DriverStatus, string> = {
  Safe:     'bg-gd-green',
  Warning:  'bg-gd-amber',
  Critical: 'bg-gd-red pulse-red',
};

export default function FleetMapPage() {
  const [search, setSearch]           = useState('');
  const [filter, setFilter]           = useState<DriverStatus | 'All'>('All');
  const [selected, setSelected]       = useState<Driver | null>(null);
  const [hoveredId, setHoveredId]     = useState<number | null>(null);

  const filtered = useMemo(() => {
    return drivers.filter((d) => {
      if (filter !== 'All' && d.status !== filter) return false;
      if (search && !d.name.toLowerCase().includes(search.toLowerCase()) &&
          !d.route.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, filter]);

  const filters: (DriverStatus | 'All')[] = ['All', 'Safe', 'Warning', 'Critical'];
  const active = selected ?? (hoveredId != null ? drivers.find(d => d.id === hoveredId) ?? null : null);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden w-72 flex-shrink-0 flex-col border-r border-border bg-card overflow-y-auto md:flex">
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
                  <p className="text-[10px] text-muted-foreground">Route {d.routeNum}</p>
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

      {/* Map area */}
      <div className="relative flex-1 overflow-hidden">
        {/* Dark stylized map background */}
        <div className="absolute inset-0 bg-[#0d0d1a]">
          {/* Grid lines simulating map */}
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="hsl(217,91%,60%)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Simulated road paths */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Major roads */}
            <line x1="10%" y1="50%" x2="90%" y2="50%" stroke="hsl(217,91%,60%)" strokeWidth="1.5" strokeOpacity="0.15" />
            <line x1="50%" y1="10%" x2="50%" y2="90%" stroke="hsl(217,91%,60%)" strokeWidth="1.5" strokeOpacity="0.15" />
            <line x1="20%" y1="20%" x2="80%" y2="80%" stroke="hsl(217,91%,60%)" strokeWidth="1" strokeOpacity="0.1" />
            <line x1="80%" y1="20%" x2="20%" y2="80%" stroke="hsl(217,91%,60%)" strokeWidth="1" strokeOpacity="0.1" />
            {/* Route paths */}
            <polyline points="22,72 32,65 40,60 48,55 55,45 68,38 78,25" stroke="hsl(217,91%,60%)" strokeWidth="2" strokeOpacity="0.25" fill="none" strokeDasharray="4 3"
              style={{ stroke: 'hsl(217,91%,60%)', vectorEffect: 'non-scaling-stroke' }}
            />
          </svg>

          {/* Driver markers */}
          {drivers.map((d) => {
            const isHighlighted = selected?.id === d.id || hoveredId === d.id;
            const isFiltered = filter !== 'All' && d.status !== filter;
            if (isFiltered) return null;
            return (
              <button
                key={d.id}
                onClick={() => setSelected(selected?.id === d.id ? null : d)}
                onMouseEnter={() => setHoveredId(d.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ left: `${d.x}%`, top: `${d.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group z-10"
              >
                {/* Pulse ring for critical */}
                {d.status === 'Critical' && (
                  <span className="absolute inset-0 -m-3 rounded-full border-2 border-gd-red pulse-red opacity-60" />
                )}
                {/* Marker dot */}
                <div
                  className={`flex items-center justify-center rounded-full border-2 border-background font-heading font-bold text-white transition-all duration-200 ${
                    d.status === 'Critical'
                      ? 'h-9 w-9 text-xs'
                      : 'h-7 w-7 text-[10px]'
                  } ${isHighlighted ? 'scale-125 shadow-lg' : ''}`}
                  style={{ backgroundColor: statusColors[d.status] }}
                >
                  {d.name.split(' ').map(n => n[0]).join('')}
                </div>

                {/* Tooltip on hover */}
                {isHighlighted && (
                  <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-surface-border bg-card px-3 py-2 text-left shadow-xl z-20">
                    <p className="text-xs font-semibold text-foreground">{d.name}</p>
                    <p className="text-[10px] text-muted-foreground">{d.route}</p>
                    <div className="mt-1 flex gap-3 text-[10px]">
                      <span className="text-muted-foreground">{d.speed} km/h</span>
                      <span className="text-muted-foreground">Score: {d.fatigue}</span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}

          {/* Legend overlay */}
          <div className="absolute bottom-4 left-4 rounded-xl border border-surface-border bg-card/90 backdrop-blur-sm p-3 text-xs">
            <p className="mb-2 font-semibold text-foreground">Status</p>
            {(['Safe', 'Warning', 'Critical'] as DriverStatus[]).map((s) => (
              <div key={s} className="flex items-center gap-2 mb-1">
                <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusColors[s] }} />
                <span className="text-muted-foreground">{s}</span>
              </div>
            ))}
          </div>

          {/* Coordinates watermark */}
          <div className="absolute bottom-4 right-4 text-[10px] text-muted-foreground/40 font-mono">
            23.022505°N 72.571362°E
          </div>

          {/* Top bar overlay */}
          <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between pointer-events-none">
            <div className="flex gap-2">
              {([
                { label: 'Safe',     count: drivers.filter(d => d.status === 'Safe').length,     color: 'bg-gd-green/20 text-gd-green border border-gd-green/30' },
                { label: 'Warning',  count: drivers.filter(d => d.status === 'Warning').length,  color: 'bg-gd-amber/20 text-gd-amber border border-gd-amber/30' },
                { label: 'Critical', count: drivers.filter(d => d.status === 'Critical').length, color: 'bg-gd-red/20 text-gd-red border border-gd-red/30' },
              ]).map((s) => (
                <span key={s.label} className={`rounded-full px-3 py-1 text-xs font-medium ${s.color}`}>
                  {s.count} {s.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Driver Panel */}
        {selected && (
          <div className="absolute right-4 top-12 z-20 w-72 rounded-2xl border border-surface-border bg-card/95 backdrop-blur-sm p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full font-heading text-sm font-bold ${statusBg[selected.status]}`}>
                  {selected.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-heading text-sm font-semibold text-foreground">{selected.name}</p>
                  <p className="text-xs text-muted-foreground">Route {selected.routeNum}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { label: 'Speed', value: `${selected.speed} km/h`, icon: Navigation },
                { label: 'Fatigue Score', value: `${selected.fatigue}/100`, icon: Activity },
                { label: 'Status', value: selected.status, icon: Zap },
                { label: 'Last Incident', value: selected.lastIncident, icon: MapPin },
              ].map((m) => (
                <div key={m.label} className="rounded-xl bg-background p-3">
                  <p className="text-[10px] text-muted-foreground">{m.label}</p>
                  <p className={`mt-0.5 text-sm font-semibold ${m.label === 'Status' ? (selected.status === 'Critical' ? 'text-gd-red' : selected.status === 'Warning' ? 'text-gd-amber' : 'text-gd-green') : 'text-foreground'}`}>
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
