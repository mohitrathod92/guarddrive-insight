import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter,
  AreaChart, Area, Legend, ReferenceLine, CartesianGrid,
} from 'recharts';
import { AlertTriangle, TrendingUp, Clock, User, Sparkles, FileDown } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useScrollAnimation();
  return <div ref={ref} className={`fade-in-up ${className}`}>{children}</div>;
}

/* ── Heatmap data ── */
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const heatmapData: number[][] = [];
for (let d = 0; d < 7; d++) {
  const row: number[] = [];
  for (let h = 0; h < 24; h++) {
    let base = 0;
    if (h >= 14 && h <= 17) base = 3 + Math.floor(Math.random() * 4);
    else if (h >= 22 || h <= 2) base = 2 + Math.floor(Math.random() * 3);
    else if (h >= 6 && h <= 9) base = Math.floor(Math.random() * 2);
    else base = Math.floor(Math.random() * 2);
    row.push(base);
  }
  heatmapData.push(row);
}

function heatColor(v: number) {
  if (v === 0) return '#1A1A24';
  if (v <= 2) return 'hsla(38,92%,50%,0.3)';
  if (v <= 4) return 'hsla(38,92%,50%,0.7)';
  return 'hsla(1,77%,55%,0.8)';
}

/* ── Weekly trend data ── */
const weeklyData = [
  { day: 'Mon', incidents: 4 }, { day: 'Tue', incidents: 6 }, { day: 'Wed', incidents: 3 },
  { day: 'Thu', incidents: 2 }, { day: 'Fri', incidents: 5 }, { day: 'Sat', incidents: 1 }, { day: 'Sun', incidents: 3 },
];

/* ── Scatter data ── */
const scatterData = Array.from({ length: 20 }, () => {
  const hours = parseFloat((1 + Math.random() * 7).toFixed(1));
  const incidents = Math.max(0, Math.round(hours * 0.8 + (Math.random() - 0.3) * 3));
  return { hours, incidents };
});

/* ── Driver leaderboard ── */
const leaderboard = [
  { name: 'Priya Patel', score: 97, trend: 'up' },
  { name: 'Rajesh Kumar', score: 94, trend: 'up' },
  { name: 'Vikram Rao', score: 91, trend: 'neutral' },
  { name: 'Deepak Joshi', score: 89, trend: 'down' },
  { name: 'Anita Desai', score: 85, trend: 'up' },
  { name: 'Amit Shah', score: 71, trend: 'down' },
  { name: 'Neha Singh', score: 66, trend: 'down' },
  { name: 'Suresh Mehta', score: 48, trend: 'down' },
];

/* ── Area chart data ── */
const areaData = [
  { day: 'Mon', eyeClosure: 2, headDroop: 1, rashDriving: 1 },
  { day: 'Tue', eyeClosure: 3, headDroop: 2, rashDriving: 1 },
  { day: 'Wed', eyeClosure: 1, headDroop: 1, rashDriving: 1 },
  { day: 'Thu', eyeClosure: 1, headDroop: 0, rashDriving: 1 },
  { day: 'Fri', eyeClosure: 3, headDroop: 1, rashDriving: 1 },
  { day: 'Sat', eyeClosure: 0, headDroop: 1, rashDriving: 0 },
  { day: 'Sun', eyeClosure: 2, headDroop: 0, rashDriving: 1 },
];

const chartTooltipStyle = { background: 'hsl(240 6% 8%)', border: '1px solid hsl(240 6% 20%)', borderRadius: 8, color: 'white' };

export default function AnalyticsPage() {
  const [range, setRange] = useState('7 days');
  const [reportState, setReportState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [hoveredCell, setHoveredCell] = useState<{ day: string; hour: number; count: number } | null>(null);

  const generateReport = () => {
    setReportState('loading');
    setTimeout(() => setReportState('done'), 1500);
  };

  const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-background">
      <Navbar showSession />
      <main className="container mx-auto px-4 pt-20 pb-20">
        {/* Heading */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Fleet Analytics</h1>
            <p className="text-sm text-muted-foreground">Last {range} · Ahmedabad Division · 8 drivers</p>
          </div>
          <div className="flex gap-2">
            {['7 days', '30 days', '90 days'].map((r) => (
              <button key={r} onClick={() => setRange(r)} className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${range === r ? 'bg-foreground text-background' : 'bg-transparent text-muted-foreground border border-border hover:bg-muted'}`}>{r}</button>
            ))}
          </div>
        </div>

        {/* KPI Strip */}
        <Section>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { icon: AlertTriangle, label: 'Total Incidents', value: '24', accent: 'text-gd-red' },
              { icon: TrendingUp, label: 'Avg Safety Score', value: '87/100', accent: 'text-gd-green' },
              { icon: User, label: 'Most At-Risk Driver', value: 'Suresh Mehta', accent: 'text-gd-amber' },
              { icon: Clock, label: 'Peak Fatigue Hour', value: '3:00 PM', accent: 'text-gd-blue' },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border border-surface-border bg-surface p-5">
                <div className="flex items-center gap-2"><k.icon className={`h-4 w-4 ${k.accent}`} /><span className="text-xs text-muted-foreground">{k.label}</span></div>
                <p className="mt-2 font-heading text-xl font-bold text-foreground">{k.value}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Row 1 */}
        <Section>
          <div className="mt-8 grid gap-6 lg:grid-cols-5">
            {/* Heatmap */}
            <div className="rounded-2xl border border-surface-border bg-surface p-6 lg:col-span-3">
              <h3 className="font-heading text-sm font-semibold text-foreground">Fatigue incidents by hour and day</h3>
              <div className="mt-4 overflow-x-auto relative">
                <div className="min-w-[500px]">
                  <div className="flex gap-1 mb-1 ml-10">
                    {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => (
                      <span key={h} className="text-[9px] text-muted-foreground" style={{ width: `${100 / 8}%` }}>{String(h).padStart(2, '0')}</span>
                    ))}
                  </div>
                  {heatmapData.map((row, di) => (
                    <div key={di} className="flex items-center gap-1 mb-1">
                      <span className="w-8 text-[10px] text-muted-foreground text-right mr-1">{days[di]}</span>
                      <div className="flex flex-1 gap-[2px]">
                        {row.map((v, hi) => (
                          <div
                            key={hi}
                            className="flex-1 aspect-square rounded-[2px] cursor-pointer transition-transform hover:scale-125"
                            style={{ backgroundColor: heatColor(v), minWidth: 8 }}
                            onMouseEnter={() => setHoveredCell({ day: days[di], hour: hi, count: v })}
                            onMouseLeave={() => setHoveredCell(null)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {hoveredCell && (
                  <div className="absolute top-2 right-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground shadow-lg">
                    {hoveredCell.day} {String(hoveredCell.hour).padStart(2, '0')}:00 — {hoveredCell.count} incidents
                  </div>
                )}
              </div>
            </div>

            {/* Weekly Bar */}
            <div className="rounded-2xl border border-surface-border bg-surface p-6 lg:col-span-2">
              <h3 className="font-heading text-sm font-semibold text-foreground">Daily incident trend</h3>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <XAxis dataKey="day" tick={{ fill: 'hsl(240 5% 55%)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'hsl(240 5% 55%)', fontSize: 11 }} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar dataKey="incidents" radius={[4, 4, 0, 0]} fill="hsl(38,92%,50%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </Section>

        {/* Row 2 */}
        <Section>
          <div className="mt-8 grid gap-6 lg:grid-cols-5">
            {/* Scatter */}
            <div className="rounded-2xl border border-surface-border bg-surface p-6 lg:col-span-3">
              <h3 className="font-heading text-sm font-semibold text-foreground">Shift duration vs fatigue incidents</h3>
              <p className="text-xs text-muted-foreground">Drivers exceeding 4h show 3.2x more fatigue events</p>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 18%)" />
                    <XAxis dataKey="hours" type="number" domain={[0, 8]} tick={{ fill: 'hsl(240 5% 55%)', fontSize: 11 }} name="Hours" />
                    <YAxis dataKey="incidents" type="number" domain={[0, 8]} tick={{ fill: 'hsl(240 5% 55%)', fontSize: 11 }} name="Incidents" />
                    <ReferenceLine x={4} stroke="hsl(1,77%,55%)" strokeDasharray="5 5" label={{ value: 'Max shift', fill: 'hsl(1,77%,55%)', fontSize: 10, position: 'top' }} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Scatter data={scatterData} fill="hsl(217,91%,60%)" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="rounded-2xl border border-surface-border bg-surface p-6 lg:col-span-2">
              <h3 className="font-heading text-sm font-semibold text-foreground">Driver safety rankings</h3>
              <div className="mt-4 space-y-3">
                {leaderboard.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-3">
                    <span className="w-5 text-xs text-muted-foreground font-mono">{i + 1}</span>
                    <span className="flex-1 text-sm text-foreground truncate">{d.name}</span>
                    <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${d.score}%`, backgroundColor: d.score > 80 ? 'hsl(142,71%,45%)' : d.score > 60 ? 'hsl(38,92%,50%)' : 'hsl(1,77%,55%)' }} />
                    </div>
                    <span className="w-8 text-xs text-foreground font-mono text-right">{d.score}</span>
                    <span className="text-xs">{d.trend === 'up' ? '↑' : d.trend === 'down' ? '↓' : '—'}</span>
                    {i === 0 && <span className="rounded-full bg-gd-green/20 px-2 py-0.5 text-[10px] text-gd-green">Safe</span>}
                    {i === leaderboard.length - 1 && <span className="rounded-full bg-gd-red/20 px-2 py-0.5 text-[10px] text-gd-red">At Risk</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Row 3 — Area Chart */}
        <Section>
          <div className="mt-8 rounded-2xl border border-surface-border bg-surface p-6">
            <h3 className="font-heading text-sm font-semibold text-foreground">Incident breakdown by type</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 18%)" />
                  <XAxis dataKey="day" tick={{ fill: 'hsl(240 5% 55%)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(240 5% 55%)', fontSize: 11 }} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Legend />
                  <Area type="monotone" dataKey="eyeClosure" stackId="1" stroke="hsl(1,77%,55%)" fill="hsl(1,77%,55%)" fillOpacity={0.4} name="Eye Closure" />
                  <Area type="monotone" dataKey="headDroop" stackId="1" stroke="hsl(38,92%,50%)" fill="hsl(38,92%,50%)" fillOpacity={0.4} name="Head Drooping" />
                  <Area type="monotone" dataKey="rashDriving" stackId="1" stroke="hsl(217,91%,60%)" fill="hsl(217,91%,60%)" fillOpacity={0.4} name="Rash Driving" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Section>

        {/* AI Report */}
        <Section>
          <div className="mt-8 rounded-2xl border border-dashed border-surface-border bg-surface p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-heading text-lg font-semibold text-foreground">AI-generated fleet safety report</h3>
                <p className="text-sm text-muted-foreground">Powered by Claude AI — analyzes all incidents and generates actionable recommendations</p>
              </div>
              <button onClick={generateReport} disabled={reportState === 'loading'} className="flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 text-sm font-medium text-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
                <Sparkles size={16} /> {reportState === 'loading' ? 'Analyzing...' : 'Generate Report'}
              </button>
            </div>

            {reportState === 'loading' && (
              <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                Analyzing 24 incidents across 8 drivers...
              </div>
            )}

            {reportState === 'done' && (
              <div className="mt-6 rounded-xl bg-background p-6 text-sm leading-relaxed text-muted-foreground animate-in fade-in">
                <p className="font-heading font-semibold text-foreground">Fleet Safety Report — Week of {currentDate}</p>
                <p className="mt-3"><strong className="text-foreground">Summary:</strong> This week recorded 24 fatigue incidents across 8 drivers, a 12% increase from last week. The most critical window remains 14:00–17:00, accounting for 46% of all incidents.</p>
                <p className="mt-3"><strong className="text-gd-red">High Risk Driver:</strong> Suresh Mehta (Route 31) recorded 7 incidents this week, all occurring after the 4-hour mark of his shift. Immediate schedule review recommended.</p>
                <p className="mt-3"><strong className="text-foreground">Recommendations:</strong></p>
                <ol className="mt-1 list-decimal list-inside space-y-1">
                  <li>Reduce Route 31 and Route 17 shift durations from 6h to 4h</li>
                  <li>Implement mandatory 20-minute break after 3.5 hours of driving</li>
                  <li>Schedule awareness training for 3 drivers with worsening scores</li>
                </ol>
                <p className="mt-3"><strong className="text-gd-green">Positive:</strong> Rajesh Kumar and Priya Patel maintained perfect safety scores this week.</p>
                <button onClick={() => { import('jspdf').then(({ jsPDF }) => { const doc = new jsPDF(); doc.text('Fleet Safety Report', 20, 20); doc.save('fleet-safety-report.pdf'); }); }} className="mt-4 flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs text-foreground hover:bg-muted">
                  <FileDown size={14} /> Export as PDF
                </button>
              </div>
            )}
          </div>
        </Section>
      </main>
    </div>
  );
}
