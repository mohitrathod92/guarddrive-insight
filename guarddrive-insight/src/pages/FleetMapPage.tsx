import { useState, useMemo, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Search } from 'lucide-react';
import Navbar from '@/components/Navbar';

type DriverStatus = 'Safe' | 'Warning' | 'Critical';

interface Driver {
  id: number; name: string; route: string; routeNum: number; status: DriverStatus;
  lat: number; lng: number; speed: number; fatigue: number; lastIncident: string;
}

const drivers: Driver[] = [
  { id: 1, name: 'Rajesh Kumar', route: 'Route 42 — Ahmedabad Central', routeNum: 42, status: 'Safe', lat: 23.022, lng: 72.571, speed: 67, fatigue: 92, lastIncident: '13:45' },
  { id: 2, name: 'Amit Shah', route: 'Route 17 — SG Highway', routeNum: 17, status: 'Warning', lat: 23.033, lng: 72.585, speed: 72, fatigue: 71, lastIncident: '11:20' },
  { id: 3, name: 'Priya Patel', route: 'Route 8 — Navrangpura', routeNum: 8, status: 'Safe', lat: 23.015, lng: 72.560, speed: 45, fatigue: 97, lastIncident: 'None' },
  { id: 4, name: 'Suresh Mehta', route: 'Route 31 — Maninagar', routeNum: 31, status: 'Critical', lat: 23.041, lng: 72.595, speed: 83, fatigue: 48, lastIncident: '14:30' },
  { id: 5, name: 'Deepak Joshi', route: 'Route 5 — Satellite', routeNum: 5, status: 'Safe', lat: 23.010, lng: 72.550, speed: 55, fatigue: 89, lastIncident: 'None' },
  { id: 6, name: 'Neha Singh', route: 'Route 22 — Vastrapur', routeNum: 22, status: 'Warning', lat: 23.028, lng: 72.578, speed: 61, fatigue: 66, lastIncident: '10:15' },
  { id: 7, name: 'Vikram Rao', route: 'Route 14 — Paldi', routeNum: 14, status: 'Safe', lat: 23.018, lng: 72.565, speed: 48, fatigue: 91, lastIncident: 'None' },
  { id: 8, name: 'Anita Desai', route: 'Route 9 — Bopal', routeNum: 9, status: 'Safe', lat: 23.035, lng: 72.588, speed: 52, fatigue: 85, lastIncident: '09:40' },
];

const statusColors: Record<DriverStatus, string> = { Safe: 'hsl(142,71%,45%)', Warning: 'hsl(38,92%,50%)', Critical: 'hsl(1,77%,55%)' };
const statusBg: Record<DriverStatus, string> = { Safe: 'bg-gd-green/20 text-gd-green', Warning: 'bg-gd-amber/20 text-gd-amber', Critical: 'bg-gd-red/20 text-gd-red' };

const routeLines: [number, number][][] = [
  [[23.010, 72.550], [23.015, 72.560], [23.022, 72.571], [23.028, 72.578], [23.033, 72.585]],
  [[23.018, 72.565], [23.035, 72.588], [23.041, 72.595]],
];

function FlyTo({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 15, { duration: 1 });
  }, [center, map]);
  return null;
}

export default function FleetMapPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<DriverStatus | 'All'>('All');
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  const filtered = useMemo(() => {
    return drivers.filter((d) => {
      if (filter !== 'All' && d.status !== filter) return false;
      if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.route.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, filter]);

  const handleDriverClick = (d: Driver) => {
    setFlyTarget([d.lat, d.lng]);
  };

  const filters: (DriverStatus | 'All')[] = ['All', 'Safe', 'Warning', 'Critical'];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar showSession />
      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <aside className="hidden w-80 flex-shrink-0 flex-col border-r border-border bg-card md:flex overflow-y-auto">
          <div className="p-4">
            <h2 className="font-heading text-lg font-bold text-foreground">Fleet Overview</h2>
            <p className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-gd-green pulse-green" /> 8 drivers active</p>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search driver or route..." className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div className="mt-3 flex gap-2">
              {filters.map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${filter === f ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>{f}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {filtered.map((d) => (
              <button key={d.id} onClick={() => handleDriverClick(d)} className="mb-2 w-full rounded-xl border border-surface-border bg-surface p-3 text-left transition-colors hover:border-muted-foreground/30">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${statusBg[d.status]}`}>
                    {d.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                    <p className="text-xs text-muted-foreground">Route {d.routeNum}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBg[d.status]}`}>{d.status}</span>
                </div>
                <div className="mt-2 flex gap-4 text-[10px] text-muted-foreground">
                  <span>{d.speed} km/h</span>
                  <span>Score: {d.fatigue}</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer center={[23.022505, 72.571362]} zoom={13} className="h-full w-full" zoomControl={false} attributionControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            <FlyTo center={flyTarget} />
            {routeLines.map((line, i) => (
              <Polyline key={i} positions={line} color="hsl(217,91%,60%)" opacity={0.2} weight={3} />
            ))}
            {drivers.map((d) => (
              <CircleMarker key={d.id} center={[d.lat, d.lng]} radius={d.status === 'Critical' ? 10 : 7} fillColor={statusColors[d.status]} color={statusColors[d.status]} fillOpacity={0.8} weight={d.status === 'Critical' ? 3 : 1}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold">{d.name}</p>
                    <p className="text-xs opacity-70">{d.route}</p>
                    <p className="mt-1 text-xs">Speed: {d.speed} km/h</p>
                    <p className="text-xs">Fatigue Score: {d.fatigue}</p>
                    <p className="text-xs">Last Incident: {d.lastIncident}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
