import { useState, useMemo } from 'react';
import { Search, Grid3X3, List, Eye, FileText, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

type DriverStatus = 'Safe' | 'Warning' | 'Critical';

interface DriverData {
  id: number; name: string; initials: string; route: string; routeNum: number; status: DriverStatus;
  score: number; incidents: number; hours: string; lastIncident: string;
  sparkline: number[]; trend: 'up' | 'down' | 'neutral';
}

const drivers: DriverData[] = [
  { id: 1, name: 'Rajesh Kumar', initials: 'RK', route: 'Route 42 — Ahmedabad Central', routeNum: 42, status: 'Safe', score: 94, incidents: 0, hours: '5h 23m', lastIncident: 'No incidents today', sparkline: [88, 90, 91, 92, 93, 94, 94], trend: 'up' },
  { id: 2, name: 'Amit Shah', initials: 'AS', route: 'Route 17 — SG Highway', routeNum: 17, status: 'Warning', score: 71, incidents: 2, hours: '6h 10m', lastIncident: 'Eye closure 11:20', sparkline: [82, 80, 78, 75, 73, 72, 71], trend: 'down' },
  { id: 3, name: 'Priya Patel', initials: 'PP', route: 'Route 8 — Navrangpura', routeNum: 8, status: 'Safe', score: 97, incidents: 0, hours: '3h 45m', lastIncident: 'No incidents today', sparkline: [93, 94, 95, 96, 96, 97, 97], trend: 'up' },
  { id: 4, name: 'Suresh Mehta', initials: 'SM', route: 'Route 31 — Maninagar', routeNum: 31, status: 'Critical', score: 48, incidents: 5, hours: '7h 02m', lastIncident: 'Drowsiness 14:30', sparkline: [65, 60, 58, 55, 52, 50, 48], trend: 'down' },
  { id: 5, name: 'Deepak Joshi', initials: 'DJ', route: 'Route 5 — Satellite', routeNum: 5, status: 'Safe', score: 89, incidents: 1, hours: '4h 30m', lastIncident: 'Head drooping 10:05', sparkline: [87, 88, 89, 88, 89, 89, 89], trend: 'neutral' },
  { id: 6, name: 'Neha Singh', initials: 'NS', route: 'Route 22 — Vastrapur', routeNum: 22, status: 'Warning', score: 66, incidents: 3, hours: '5h 55m', lastIncident: 'Eye closure 13:10', sparkline: [75, 73, 71, 70, 68, 67, 66], trend: 'down' },
  { id: 7, name: 'Vikram Rao', initials: 'VR', route: 'Route 14 — Paldi', routeNum: 14, status: 'Safe', score: 91, incidents: 0, hours: '2h 18m', lastIncident: 'No incidents today', sparkline: [90, 90, 91, 91, 91, 91, 91], trend: 'neutral' },
  { id: 8, name: 'Anita Desai', initials: 'AD', route: 'Route 9 — Bopal', routeNum: 9, status: 'Safe', score: 85, incidents: 1, hours: '4h 10m', lastIncident: 'Harsh braking 09:40', sparkline: [82, 83, 84, 84, 85, 85, 85], trend: 'up' },
];

const statusBg: Record<DriverStatus, string> = { Safe: 'bg-gd-green/20 text-gd-green', Warning: 'bg-gd-amber/20 text-gd-amber', Critical: 'bg-gd-red/20 text-gd-red' };
const avatarBg: Record<DriverStatus, string> = { Safe: 'bg-gd-green/20 text-gd-green', Warning: 'bg-gd-amber/20 text-gd-amber', Critical: 'bg-gd-red/20 text-gd-red' };

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === 'up') return <TrendingUp className="h-3 w-3 text-gd-green" />;
  if (trend === 'down') return <TrendingDown className="h-3 w-3 text-gd-red" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
};

export default function DriversPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<DriverStatus | 'All'>('All');
  const [sort, setSort] = useState('Safety Score');
  const [search, setSearch] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<DriverData | null>(null);

  const filtered = useMemo(() => {
    let result = drivers.filter((d) => {
      if (filter !== 'All' && d.status !== filter) return false;
      if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.route.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    result.sort((a, b) => {
      if (sort === 'Safety Score') return b.score - a.score;
      if (sort === 'Incidents Today') return b.incidents - a.incidents;
      if (sort === 'Name') return a.name.localeCompare(b.name);
      return 0;
    });
    return result;
  }, [filter, sort, search]);

  const totalIncidents = drivers.reduce((s, d) => s + d.incidents, 0);
  const criticalCount = drivers.filter((d) => d.status === 'Critical').length;
  const warningCount = drivers.filter((d) => d.status === 'Warning').length;
  const safeCount = drivers.filter((d) => d.status === 'Safe').length;

  return (
    <div className="pb-20">
      <main className="container mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">All Drivers</h1>
            <p className="text-sm text-muted-foreground">8 active · Ahmedabad Division</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setView('grid')} className={`rounded-lg p-2 ${view === 'grid' ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'}`}><Grid3X3 size={16} /></button>
            <button onClick={() => setView('list')} className={`rounded-lg p-2 ${view === 'list' ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'}`}><List size={16} /></button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {(['All', 'Safe', 'Warning', 'Critical'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${filter === f ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {f === 'All' ? 'All Drivers' : f}
            </button>
          ))}
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none">
            <option>Safety Score</option><option>Incidents Today</option><option>Name</option>
          </select>
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="rounded-lg border border-border bg-background py-1.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
        </div>

        {/* Grid View */}
        {view === 'grid' && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((d, i) => (
              <div key={d.id} className="card-enter rounded-2xl border border-surface-border bg-surface p-5 transition-colors hover:border-muted-foreground/30" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex items-start justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full font-heading text-sm font-bold ${avatarBg[d.status]}`}>{d.initials}</div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBg[d.status]}`}>{d.status}</span>
                </div>
                <p className="mt-3 font-heading text-sm font-semibold text-foreground">{d.name}</p>
                <p className="text-xs text-muted-foreground">{d.route}</p>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[{ l: 'Score', v: d.score }, { l: 'Incidents', v: d.incidents }, { l: 'Hours', v: d.hours }].map((m) => (
                    <div key={m.l} className="rounded-lg bg-background p-2 text-center">
                      <p className="font-heading text-sm font-bold text-foreground">{m.v}</p>
                      <p className="text-[9px] text-muted-foreground">{m.l}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 h-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={d.sparkline.map((v, i) => ({ v, i }))}>
                      <Line type="monotone" dataKey="v" stroke={d.trend === 'down' ? 'hsl(1,77%,55%)' : 'hsl(142,71%,45%)'} dot={false} strokeWidth={1.5} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-3 flex items-center gap-1">
                  <TrendIcon trend={d.trend} />
                  <p className={`text-[10px] ${d.incidents === 0 ? 'text-gd-green' : 'text-gd-amber'}`}>{d.lastIncident}</p>
                </div>

                <div className="mt-4 flex gap-2">
                  <button onClick={() => setSelectedDriver(d)} className="flex-1 rounded-lg bg-gd-red/20 py-1.5 text-xs font-medium text-gd-red hover:bg-gd-red/30">View Live Feed</button>
                  <button className="flex-1 rounded-lg border border-border py-1.5 text-xs text-foreground hover:bg-muted">Full Report</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {view === 'list' && (
          <div className="mt-8 overflow-x-auto rounded-2xl border border-surface-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-4 py-3">Driver</th><th className="px-4 py-3">Route</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Incidents</th><th className="px-4 py-3">Hours</th><th className="px-4 py-3">Last Incident</th><th className="px-4 py-3">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-b border-border transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${avatarBg[d.status]}`}>{d.initials}</div>
                        <span className="text-foreground">{d.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">Route {d.routeNum}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBg[d.status]}`}>{d.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${d.score}%`, backgroundColor: d.score > 80 ? 'hsl(142,71%,45%)' : d.score > 60 ? 'hsl(38,92%,50%)' : 'hsl(1,77%,55%)' }} />
                        </div>
                        <span className="text-foreground">{d.score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground">{d.incidents}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.hours}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{d.lastIncident}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelectedDriver(d)} className="rounded-lg bg-gd-red/20 px-3 py-1 text-xs text-gd-red hover:bg-gd-red/30">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Summary Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <p className="text-sm text-muted-foreground">
            8 drivers active — <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gd-red pulse-red" />{criticalCount} critical</span>, {warningCount} warnings, {safeCount} safe — {totalIncidents} incidents today
          </p>
          <button className="rounded-lg bg-gd-red px-4 py-1.5 text-xs font-medium text-foreground hover:opacity-90">View Critical Driver</button>
        </div>
      </div>

      {/* Driver Detail Modal */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setSelectedDriver(null)}>
          <div className="mx-4 w-full max-w-2xl rounded-2xl border border-surface-border bg-surface p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full font-heading text-sm font-bold ${avatarBg[selectedDriver.status]}`}>{selectedDriver.initials}</div>
                <div>
                  <p className="font-heading font-semibold text-foreground">{selectedDriver.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedDriver.route}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBg[selectedDriver.status]}`}>{selectedDriver.status}</span>
              </div>
              <button onClick={() => setSelectedDriver(null)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="flex aspect-video items-center justify-center rounded-xl bg-background">
                <div className="text-center">
                  <span className="mb-2 inline-block h-3 w-3 rounded-full bg-gd-green pulse-green" />
                  <p className="text-sm text-muted-foreground">Camera Feed</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl bg-background p-4">
                  <p className="text-xs text-muted-foreground">Safety Score</p>
                  <p className="font-heading text-2xl font-bold text-foreground">{selectedDriver.score}/100</p>
                </div>
                <div className="rounded-xl bg-background p-4">
                  <p className="text-xs text-muted-foreground">Incidents Today</p>
                  <p className="font-heading text-2xl font-bold text-foreground">{selectedDriver.incidents}</p>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 rounded-lg bg-gd-red px-3 py-2 text-xs font-medium text-foreground">Sound Alert</button>
                  <button className="flex-1 rounded-lg border border-border px-3 py-2 text-xs text-foreground">Generate Report</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
