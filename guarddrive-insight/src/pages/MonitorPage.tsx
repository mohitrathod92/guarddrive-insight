import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Users, AlertTriangle, ShieldAlert, TrendingUp, Eye, Sparkles, X, Volume2, Bell, XCircle,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip,
} from 'recharts';

/* ── Types ── */
interface EarDataPoint { time: number; ear: number }
type FatigueStatus = 'ALERT' | 'WARNING' | 'DANGER';

/* ── KPI Card ── */
function KpiCard({ icon: Icon, label, value, accent, pulse }: {
  icon: React.ElementType; label: string; value: string | number; accent: string; pulse?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-surface-border bg-surface p-5 ${pulse ? 'pulse-red' : ''}`}>
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${accent}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="mt-2 font-heading text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

/* ── SVG Arc Gauge ── */
function ArcGauge({ value, min, max, danger, label, unit }: {
  value: number; min: number; max: number; danger: number; label: string; unit: string;
}) {
  const pct = Math.min(Math.max((value - min) / (max - min), 0), 1);
  const dangerPct = (danger - min) / (max - min);
  const angle = pct * 180;
  const r = 60;
  const cx = 70;
  const cy = 70;
  const toXY = (a: number) => ({
    x: cx + r * Math.cos((Math.PI * (180 - a)) / 180),
    y: cy - r * Math.sin((Math.PI * (180 - a)) / 180),
  });
  const start = toXY(0);
  const end = toXY(angle);
  const largeArc = angle > 180 ? 1 : 0;

  return (
    <div className="rounded-xl border border-surface-border bg-surface p-4 text-center">
      <p className="mb-2 text-xs text-muted-foreground">{label}</p>
      <svg viewBox="0 0 140 80" className="mx-auto w-full max-w-[160px]">
        <path d={`M ${toXY(0).x} ${toXY(0).y} A ${r} ${r} 0 0 1 ${toXY(180).x} ${toXY(180).y}`}
          fill="none" stroke="hsl(240 6% 18%)" strokeWidth={8} strokeLinecap="round" />
        {angle > 0 && (
          <path d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`}
            fill="none" stroke={pct > dangerPct ? 'hsl(1 77% 55%)' : 'hsl(142 71% 45%)'} strokeWidth={8} strokeLinecap="round" />
        )}
      </svg>
      <p className="font-heading text-xl font-bold text-foreground">{value.toFixed(1)}<span className="text-xs text-muted-foreground"> {unit}</span></p>
    </div>
  );
}

/* ── Incident Row ── */
const severityColors: Record<string, string> = {
  High: 'bg-gd-red/20 text-gd-red',
  Medium: 'bg-gd-amber/20 text-gd-amber',
  Low: 'bg-yellow-500/20 text-yellow-400',
};

function IncidentRow({ time, type, severity, duration }: { time: string; type: string; severity: string; duration: string }) {
  return (
    <tr className="border-b border-border text-sm">
      <td className="py-2 text-muted-foreground">{time}</td>
      <td className="py-2 text-foreground">{type}</td>
      <td className="py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityColors[severity]}`}>{severity}</span></td>
      <td className="py-2 text-muted-foreground">{duration}</td>
    </tr>
  );
}

/* ── Main Page ── */
export default function MonitorPage() {
  const [earData, setEarData] = useState<EarDataPoint[]>([]);
  const [speed, setSpeed] = useState(67);
  const [brake, setBrake] = useState(0.3);
  const [steering, setSteering] = useState(12);
  const [showAlert, setShowAlert] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const tickRef = useRef(0);

  // Simulate EAR data
  useEffect(() => {
    const iv = setInterval(() => {
      tickRef.current += 0.5;
      const t = tickRef.current;
      // simulate occasional dips
      let ear = 0.32 + Math.sin(t * 0.2) * 0.05 + (Math.random() - 0.5) * 0.04;
      if (t % 30 > 25) ear = 0.18 + Math.random() * 0.05; // drowsy phase
      ear = Math.max(0.05, Math.min(0.45, ear));

      setEarData((prev) => {
        const next = [...prev, { time: t, ear: parseFloat(ear.toFixed(3)) }];
        return next.length > 120 ? next.slice(-120) : next;
      });

      // fluctuate gauges
      setSpeed((p) => Math.max(0, Math.min(120, p + (Math.random() - 0.5) * 4)));
      setBrake((p) => {
        if (Math.random() < 0.02) return 2.5; // harsh brake spike
        return Math.max(0, Math.min(10, p * 0.9 + Math.random() * 0.2));
      });
      setSteering((p) => Math.max(-90, Math.min(90, p + (Math.random() - 0.5) * 6)));
    }, 500);
    return () => clearInterval(iv);
  }, []);

  const latestEar = earData.length > 0 ? earData[earData.length - 1].ear : 0.32;
  const status: FatigueStatus = useMemo(() => {
    if (latestEar < 0.2) return 'DANGER';
    if (latestEar < 0.25) return 'WARNING';
    return 'ALERT';
  }, [latestEar]);

  useEffect(() => {
    if (status === 'DANGER') setShowAlert(true);
  }, [status]);

  const statusColor = status === 'DANGER' ? 'text-gd-red' : status === 'WARNING' ? 'text-gd-amber' : 'text-gd-green';
  const statusBg = status === 'DANGER' ? 'bg-gd-red/10 border-gd-red danger-border-pulse' : 'border-surface-border';

  const eyeStatus = latestEar > 0.25 ? { label: 'Eyes Open', color: 'bg-gd-green/20 text-gd-green' } : { label: 'Eyes Closing', color: 'bg-gd-red/20 text-gd-red' };
  const headStatus = { label: 'Head Position Normal', color: 'bg-gd-green/20 text-gd-green' };
  const yawnStatus = { label: 'No Yawning', color: 'bg-gd-green/20 text-gd-green' };

  return (
    <>

      {/* Alert Banner */}
      {showAlert && status === 'DANGER' && (
        <div className="fixed top-16 left-0 right-0 z-40 flex items-center justify-between border-b-2 border-gd-red bg-gd-red/10 px-4 py-3 danger-border-pulse">
          <p className="text-sm font-medium text-gd-red">⚠ CRITICAL: Driver Rajesh Kumar showing signs of severe fatigue — Route 42</p>
          <div className="flex gap-2">
            <button className="rounded-lg bg-gd-red/20 px-3 py-1 text-xs text-gd-red hover:bg-gd-red/30"><Volume2 size={12} className="mr-1 inline" />Sound Alarm</button>
            <button className="rounded-lg bg-gd-amber/20 px-3 py-1 text-xs text-gd-amber hover:bg-gd-amber/30"><Bell size={12} className="mr-1 inline" />Notify Manager</button>
            <button onClick={() => setShowAlert(false)} className="rounded-lg bg-muted px-3 py-1 text-xs text-muted-foreground hover:bg-muted/80">Dismiss</button>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 pt-4 pb-20">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard icon={Users} label="Active Drivers" value={8} accent="text-gd-blue" />
          <KpiCard icon={AlertTriangle} label="Incidents Today" value={3} accent="text-gd-amber" />
          <KpiCard icon={ShieldAlert} label="Critical Alerts" value={1} accent="text-gd-red" pulse />
          <KpiCard icon={TrendingUp} label="Avg Safety Score" value={87} accent="text-gd-green" />
        </div>

        {/* Main 2-col layout */}
        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          {/* Left column 60% */}
          <div className="space-y-6 lg:col-span-3">
            {/* Webcam Panel */}
            <div className={`rounded-2xl border bg-surface p-6 ${statusBg}`}>
              <h3 className="font-heading text-sm font-semibold text-foreground">Driver Camera — Seat 1A</h3>
              <div className="mt-4 flex aspect-video items-center justify-center rounded-xl bg-background">
                <div className="text-center">
                  <span className="mb-2 inline-block h-3 w-3 rounded-full bg-gd-green pulse-green" />
                  <p className="text-sm text-muted-foreground">Camera feed active</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {[eyeStatus, headStatus, yawnStatus].map((s) => (
                  <span key={s.label} className={`rounded-full px-3 py-1 text-xs font-medium ${s.color}`}>{s.label}</span>
                ))}
              </div>
              <div className={`mt-4 flex items-center gap-2 rounded-xl p-3 ${status === 'DANGER' ? 'bg-gd-red/10' : status === 'WARNING' ? 'bg-gd-amber/10' : 'bg-gd-green/10'}`}>
                <Eye className={`h-5 w-5 ${statusColor}`} />
                <span className={`font-heading text-lg font-bold ${statusColor}`}>{status}</span>
              </div>
            </div>

            {/* EAR Chart */}
            <div className="rounded-2xl border border-surface-border bg-surface p-6">
              <h3 className="font-heading text-sm font-semibold text-foreground">Eye Aspect Ratio — Live Feed</h3>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={earData}>
                    <XAxis dataKey="time" tick={{ fill: 'hsl(240 5% 55%)', fontSize: 10 }} tickFormatter={(v: number) => `${v.toFixed(0)}s`} />
                    <YAxis domain={[0, 0.5]} tick={{ fill: 'hsl(240 5% 55%)', fontSize: 10 }} />
                    <ReferenceLine y={0.25} stroke="hsl(1 77% 55%)" strokeDasharray="5 5" label={{ value: 'Drowsy threshold', fill: 'hsl(1 77% 55%)', fontSize: 10, position: 'right' }} />
                    <Tooltip contentStyle={{ background: 'hsl(240 6% 8%)', border: '1px solid hsl(240 6% 20%)', borderRadius: 8, color: 'white' }} />
                    <Line type="monotone" dataKey="ear" stroke={latestEar < 0.25 ? 'hsl(1 77% 55%)' : 'hsl(142 71% 45%)'} dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right column 40% */}
          <div className="space-y-6 lg:col-span-2">
            {/* Driver Info */}
            <div className="rounded-2xl border border-surface-border bg-surface p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gd-blue/20 font-heading text-lg font-bold text-gd-blue">RK</div>
                <div>
                  <p className="font-heading font-semibold text-foreground">Rajesh Kumar</p>
                  <p className="text-xs text-muted-foreground">Route 42 — Ahmedabad Central</p>
                </div>
                <span className="ml-auto rounded-full bg-gd-green/20 px-3 py-1 text-xs font-medium text-gd-green">On Duty</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Shift:</span> <span className="text-foreground">08:00 – 16:00</span></div>
                <div><span className="text-muted-foreground">Hours on duty:</span> <span className="text-foreground">5h 23m</span></div>
              </div>
            </div>

            {/* Gauges */}
            <div className="grid grid-cols-3 gap-3">
              <ArcGauge value={speed} min={0} max={120} danger={80} label="Speed" unit="km/h" />
              <ArcGauge value={brake} min={0} max={10} danger={2} label="Braking" unit="G" />
              <ArcGauge value={Math.abs(steering)} min={0} max={90} danger={60} label="Steering" unit="°" />
            </div>

            {/* Incident Log */}
            <div className="rounded-2xl border border-surface-border bg-surface p-6">
              <h3 className="font-heading text-sm font-semibold text-foreground">Today's Incidents</h3>
              <table className="mt-3 w-full text-left">
                <thead><tr className="text-xs text-muted-foreground"><th className="pb-2">Time</th><th className="pb-2">Type</th><th className="pb-2">Severity</th><th className="pb-2">Duration</th></tr></thead>
                <tbody>
                  <IncidentRow time="09:14" type="Eye Closure" severity="High" duration="4.2s" />
                  <IncidentRow time="11:32" type="Drowsiness" severity="Medium" duration="2.8s" />
                  <IncidentRow time="13:45" type="Head Drooping" severity="Low" duration="1.5s" />
                </tbody>
              </table>
              <p className="mt-3 text-right text-xs text-gd-blue hover:underline cursor-pointer">View Full Log →</p>
            </div>
          </div>
        </div>
      </main>

      {/* Floating AI Report Button */}
      <button onClick={() => setShowReport(true)} className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-purple-600 px-5 py-3 text-sm font-medium text-foreground shadow-lg transition-transform hover:scale-105">
        <Sparkles size={16} /> Generate AI Report
      </button>

      {/* AI Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setShowReport(false)}>
          <div className="mx-4 max-w-lg rounded-2xl border border-surface-border bg-surface p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-semibold text-foreground">AI Safety Summary</h3>
              <button onClick={() => setShowReport(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="mt-4 rounded-xl bg-background p-4 text-sm leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground">Driver: Rajesh Kumar — Route 42</p>
              <p className="mt-2">Today's session recorded 3 fatigue incidents over 5h 23m of driving. The most critical event occurred at 09:14 with a sustained eye closure of 4.2 seconds.</p>
              <p className="mt-2 font-semibold text-gd-amber">Recommendation:</p>
              <p>Schedule a 20-minute break within the next 30 minutes. Consider reducing remaining shift by 1 hour.</p>
              <p className="mt-2">Overall Safety Score: 87/100 — Within acceptable range but trending downward in afternoon hours.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
