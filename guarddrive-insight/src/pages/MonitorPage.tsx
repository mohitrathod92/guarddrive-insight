import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Users, AlertTriangle, ShieldAlert, TrendingUp, Sparkles, X, Bell,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip,
} from 'recharts';
import FatigueDetector, { Incident } from '@/components/FatigueDetector';

// ─── Types ────────────────────────────────────────────────────────────────────
interface EarDataPoint { time: number; ear: number }

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, accent, pulse }: {
  icon: React.ElementType; label: string; value: string | number;
  accent: string; pulse?: boolean;
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

// ─── SVG Arc Gauge ────────────────────────────────────────────────────────────
function ArcGauge({ value, min, max, danger, label, unit }: {
  value: number; min: number; max: number; danger: number; label: string; unit: string;
}) {
  const pct      = Math.min(Math.max((value - min) / (max - min), 0), 1);
  const dangerPct = (danger - min) / (max - min);
  const angle    = pct * 180;
  const r = 60, cx = 70, cy = 70;
  const toXY = (a: number) => ({
    x: cx + r * Math.cos((Math.PI * (180 - a)) / 180),
    y: cy - r * Math.sin((Math.PI * (180 - a)) / 180),
  });
  const start = toXY(0);
  const end   = toXY(angle);
  const largeArc = angle > 180 ? 1 : 0;

  return (
    <div className="rounded-xl border border-surface-border bg-surface p-4 text-center">
      <p className="mb-2 text-xs text-muted-foreground">{label}</p>
      <svg viewBox="0 0 140 80" className="mx-auto w-full max-w-[160px]">
        <path
          d={`M ${toXY(0).x} ${toXY(0).y} A ${r} ${r} 0 0 1 ${toXY(180).x} ${toXY(180).y}`}
          fill="none" stroke="hsl(240 6% 18%)" strokeWidth={8} strokeLinecap="round"
        />
        {angle > 0 && (
          <path
            d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`}
            fill="none"
            stroke={pct > dangerPct ? 'hsl(1 77% 55%)' : 'hsl(142 71% 45%)'}
            strokeWidth={8} strokeLinecap="round"
          />
        )}
      </svg>
      <p className="font-heading text-xl font-bold text-foreground">
        {value.toFixed(1)}<span className="text-xs text-muted-foreground"> {unit}</span>
      </p>
    </div>
  );
}

// ─── Incident Row ─────────────────────────────────────────────────────────────
const severityColors: Record<string, string> = {
  High:   'bg-gd-red/20 text-gd-red',
  Medium: 'bg-gd-amber/20 text-gd-amber',
  Low:    'bg-yellow-500/20 text-yellow-400',
};

function IncidentRow({ time, type, severity, duration }: {
  time: string; type: string; severity: string; duration: string;
}) {
  return (
    <tr className="border-b border-border text-sm">
      <td className="py-2 text-muted-foreground">{time}</td>
      <td className="py-2 text-foreground">{type}</td>
      <td className="py-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityColors[severity]}`}>
          {severity}
        </span>
      </td>
      <td className="py-2 text-muted-foreground">{duration}</td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MonitorPage() {
  // Vehicle telemetry (simulated)
  const [speed,    setSpeed]    = useState(67);
  const [brake,    setBrake]    = useState(0.3);
  const [steering, setSteering] = useState(12);

  // EAR chart data — fed by real FatigueDetector
  const [earData, setEarData]   = useState<EarDataPoint[]>([]);
  const timeRef    = useRef(0);

  // Realtime incidents from FatigueDetector
  const [liveIncidents, setLiveIncidents] = useState<Incident[]>([]);

  // KPI counters
  const [criticalAlerts, setCriticalAlerts] = useState(1);
  const [incidentCount,  setIncidentCount]  = useState(3);

  // AI report modal
  const [showReport, setShowReport] = useState(false);

  // ── Simulate vehicle telemetry ─────────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => {
      setSpeed   ((p) => Math.max(0,   Math.min(120, p + (Math.random() - 0.5) * 4)));
      setBrake   ((p) => Math.random() < 0.02 ? 2.5
                        : Math.max(0, Math.min(10, p * 0.9 + Math.random() * 0.2)));
      setSteering((p) => Math.max(-90, Math.min(90, p + (Math.random() - 0.5) * 6)));
    }, 500);
    return () => clearInterval(iv);
  }, []);

  // ── Callbacks from FatigueDetector ────────────────────────────────────────
  const handleStatusChange = useCallback((_status: string, ear: number) => {
    timeRef.current += 0.5;
    setEarData((prev) => {
      const next = [...prev, { time: parseFloat(timeRef.current.toFixed(1)), ear }];
      return next.length > 120 ? next.slice(-120) : next;
    });
  }, []);

  const handleIncident = useCallback((incident: Incident) => {
    setLiveIncidents((prev) => [incident, ...prev].slice(0, 10));
    if (incident.type === 'Drowsiness') {
      setCriticalAlerts((c) => c + 1);
      setIncidentCount((c) => c + 1);
    }
  }, []);

  // ── Derived chart color ────────────────────────────────────────────────────
  const latestEar  = earData.length > 0 ? earData[earData.length - 1].ear : 0.32;
  const lineColor  = latestEar < 0.25 ? 'hsl(1 77% 55%)' : 'hsl(142 71% 45%)';

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <main className="container mx-auto px-4 pt-4 pb-24">

        {/* KPI Strip */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard icon={Users}        label="Active Drivers"  value={8}              accent="text-gd-blue" />
          <KpiCard icon={AlertTriangle} label="Incidents Today" value={incidentCount}  accent="text-gd-amber" />
          <KpiCard icon={ShieldAlert}  label="Critical Alerts" value={criticalAlerts} accent="text-gd-red" pulse={criticalAlerts > 0} />
          <KpiCard icon={TrendingUp}   label="Avg Safety Score" value={87}            accent="text-gd-green" />
        </div>

        {/* Main 2-col layout */}
        <div className="mt-6 grid gap-6 lg:grid-cols-5">

          {/* ── Left column — FatigueDetector + EAR chart ── */}
          <div className="space-y-6 lg:col-span-3">

            {/* Section title */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-base font-bold text-foreground">
                  Live Fatigue Detection
                </h2>
                <p className="text-xs text-muted-foreground">
                  AI-powered real-time webcam monitoring · MediaPipe Face Mesh
                </p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full border border-gd-blue/30 bg-gd-blue/10 px-3 py-1 text-xs text-gd-blue">
                <span className="h-1.5 w-1.5 rounded-full bg-gd-blue pulse-green" />
                Driver: Rajesh Kumar
              </span>
            </div>

            {/* ✅ Real FatigueDetector */}
            <FatigueDetector
              driverName="Rajesh Kumar"
              route="42"
              onStatusChange={handleStatusChange}
              onIncident={handleIncident}
            />

            {/* EAR Timeline chart (fed by real detector) */}
            <div className="rounded-2xl border border-surface-border bg-surface p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-sm font-semibold text-foreground">
                  Eye Aspect Ratio — Timeline
                </h3>
                {earData.length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    Start detection to see live EAR data
                  </span>
                )}
              </div>
              <div className="mt-4 h-48">
                {earData.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={earData}>
                      <XAxis
                        dataKey="time"
                        tick={{ fill: 'hsl(240 5% 55%)', fontSize: 10 }}
                        tickFormatter={(v: number) => `${v.toFixed(0)}s`}
                      />
                      <YAxis
                        domain={[0, 0.5]}
                        tick={{ fill: 'hsl(240 5% 55%)', fontSize: 10 }}
                      />
                      <ReferenceLine
                        y={0.25}
                        stroke="hsl(1 77% 55%)"
                        strokeDasharray="5 5"
                        label={{ value: 'Drowsy', fill: 'hsl(1 77% 55%)', fontSize: 9, position: 'right' }}
                      />
                      <Tooltip
                        contentStyle={{ background: 'hsl(240 6% 8%)', border: '1px solid hsl(240 6% 20%)', borderRadius: 8, color: 'white', fontSize: 11 }}
                        formatter={(v: number) => [v.toFixed(3), 'EAR']}
                      />
                      <Line
                        type="monotone"
                        dataKey="ear"
                        stroke={lineColor}
                        dot={false}
                        strokeWidth={2}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-xl bg-background/50">
                    <p className="text-sm text-muted-foreground">
                      Waiting for detection data…
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right column — Driver info, gauges, incidents ── */}
          <div className="space-y-6 lg:col-span-2">

            {/* Driver Info */}
            <div className="rounded-2xl border border-surface-border bg-surface p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gd-blue/20 font-heading text-lg font-bold text-gd-blue">
                  RK
                </div>
                <div>
                  <p className="font-heading font-semibold text-foreground">Rajesh Kumar</p>
                  <p className="text-xs text-muted-foreground">Route 42 — Ahmedabad Central</p>
                </div>
                <span className="ml-auto rounded-full bg-gd-green/20 px-3 py-1 text-xs font-medium text-gd-green">
                  On Duty
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Shift: </span>
                  <span className="text-foreground">08:00 – 16:00</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Hours on duty: </span>
                  <span className="text-foreground">5h 23m</span>
                </div>
              </div>
            </div>

            {/* Vehicle Gauges (simulated telemetry) */}
            <div>
              <h3 className="mb-3 font-heading text-sm font-semibold text-foreground">
                Vehicle Telemetry
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <ArcGauge value={speed}             min={0}  max={120} danger={80} label="Speed"    unit="km/h" />
                <ArcGauge value={brake}             min={0}  max={10}  danger={2}  label="Braking"  unit="G" />
                <ArcGauge value={Math.abs(steering)} min={0} max={90}  danger={60} label="Steering" unit="°" />
              </div>
            </div>

            {/* Live Incidents (from FatigueDetector) */}
            <div className="rounded-2xl border border-surface-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-sm font-semibold text-foreground">
                  Live Alerts
                </h3>
                {liveIncidents.length > 0 && (
                  <span className="rounded-full bg-gd-red/20 px-2 py-0.5 text-[10px] font-medium text-gd-red">
                    {liveIncidents.filter(i => i.type === 'Drowsiness').length} critical
                  </span>
                )}
              </div>

              {liveIncidents.length === 0 ? (
                <p className="mt-4 text-center text-xs text-muted-foreground py-4">
                  No incidents detected yet
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {liveIncidents.map((inc) => (
                    <div key={inc.id} className="flex items-center gap-3 rounded-lg bg-background px-3 py-2 text-xs">
                      <span className={`h-2 w-2 flex-shrink-0 rounded-full ${
                        inc.type === 'Drowsiness' ? 'bg-gd-red' : 'bg-gd-blue'
                      }`} />
                      <span className="text-muted-foreground w-16 flex-shrink-0">{inc.time}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        inc.type === 'Drowsiness' ? 'bg-gd-red/15 text-gd-red' : 'bg-gd-blue/15 text-gd-blue'
                      }`}>
                        {inc.type}
                      </span>
                      <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                        {inc.ear}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Historic Incidents (static sample) */}
            <div className="rounded-2xl border border-surface-border bg-surface p-5">
              <h3 className="font-heading text-sm font-semibold text-foreground">Today's Log</h3>
              <table className="mt-3 w-full text-left">
                <thead>
                  <tr className="text-xs text-muted-foreground">
                    <th className="pb-2">Time</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Severity</th>
                    <th className="pb-2">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <IncidentRow time="09:14" type="Eye Closure"   severity="High"   duration="4.2s" />
                  <IncidentRow time="11:32" type="Drowsiness"    severity="Medium" duration="2.8s" />
                  <IncidentRow time="13:45" type="Head Drooping" severity="Low"    duration="1.5s" />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Floating AI Report Button */}
      <button
        onClick={() => setShowReport(true)}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-purple-600 px-5 py-3 text-sm font-medium text-white shadow-xl transition-transform hover:scale-105"
      >
        <Sparkles size={16} /> Generate AI Report
      </button>

      {/* AI Report Modal */}
      {showReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => setShowReport(false)}
        >
          <div
            className="mx-4 max-w-lg w-full rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <h3 className="font-heading text-lg font-semibold text-foreground">AI Safety Summary</h3>
              </div>
              <button onClick={() => setShowReport(false)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="mt-4 rounded-xl bg-background p-4 text-sm leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground">Driver: Rajesh Kumar — Route 42</p>
              <p className="mt-2">
                Live session has recorded {liveIncidents.filter(i => i.type === 'Drowsiness').length} drowsiness
                events and {liveIncidents.filter(i => i.type === 'Blink').length} blink events so far in the
                current monitoring session. Combined with today's {incidentCount} logged incidents, immediate
                attention is recommended.
              </p>
              <p className="mt-3 font-semibold text-gd-amber">Recommendation:</p>
              <p>Schedule a 20-minute mandatory rest break. Reduce remaining shift by 1 hour if fatigue persists.</p>
              <p className="mt-3">
                <span className="font-semibold text-foreground">EAR Latest: </span>
                <span className={latestEar < 0.25 ? 'text-gd-red font-semibold' : 'text-gd-green'}>
                  {latestEar.toFixed(3)} {latestEar < 0.25 ? '⚠ Below threshold' : '✓ Normal'}
                </span>
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 rounded-lg bg-purple-600 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center justify-center gap-2">
                <Bell size={14} /> Notify Manager
              </button>
              <button
                onClick={() => setShowReport(false)}
                className="flex-1 rounded-lg border border-border py-2 text-sm text-foreground hover:bg-muted"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
