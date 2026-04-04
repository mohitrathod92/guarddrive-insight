import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, ShieldAlert, Circle, Activity, ShieldCheck, Activity as ActivityIcon } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../app/store';

interface EventLog {
  id: string;
  timeStr: string;
  type: string;
  value: number;
  axis: 'X' | 'Y';
  thresholdText: string;
  severity: 'WARNING' | 'HIGH' | 'CRITICAL';
}

function playCriticalSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // Sirens effect
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.3);
    osc.frequency.linearRampToValueAtTime(400, audioCtx.currentTime + 0.6);
    osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.9);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    
    gain.gain.setValueAtTime(1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
    
    setTimeout(() => {
      osc.stop();
      audioCtx.close();
    }, 1200);
  } catch (e) {
    console.error("Audio API not supported", e);
  }
}

export default function RashDrivingPage() {
  const fleetDrivers = useSelector((state: RootState) => state.fleet.drivers);
  const selectedDriver = fleetDrivers.find(d => d.id === 1) || fleetDrivers[0];

  const [xAccel, setXAccel] = useState<number>(-1);
  const [yAccel, setYAccel] = useState<number>(0);
  const [zAccel, setZAccel] = useState<number>(0);
  
  const [useRealImu, setUseRealImu] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const simulationTimeRef = useRef<number>(0);
  
  const [events, setEvents] = useState<EventLog[]>([]);
  const [tripScore, setTripScore] = useState<number>(100);
  
  const [activeAlerts, setActiveAlerts] = useState<{ id: number; message: string; severity: 'WARNING'|'HIGH'|'CRITICAL' }[]>([]);
  const alertIdCounter = useRef(0);

  // Debouncing to avoid spamming the log
  const lastEventFiredAtRef = useRef<{ [key: string]: number }>({});

  const addAlert = (message: string, severity: 'WARNING'|'HIGH'|'CRITICAL') => {
    const id = ++alertIdCounter.current;
    setActiveAlerts(prev => [...prev, { id, message, severity }]);
    
    if (severity === 'CRITICAL') {
      playCriticalSound();
    }
    
    setTimeout(() => {
      setActiveAlerts(prev => prev.filter(a => a.id !== id));
    }, 3000);
  };

  const getAlertStatus = () => {
    // Check combined first
    const isHarshBrakeOrWorse = xAccel < -8;
    const isSharpTurnOrWorse = Math.abs(yAccel) > 3.92;
    
    if (isHarshBrakeOrWorse && isSharpTurnOrWorse) {
      return { type: 'COMBINED', text: 'ROLLOVER RISK — Combined harsh brake + sharp turn', severity: 'CRITICAL' as const };
    }
    
    if (xAccel < -12) return { type: 'EMERGENCY_BRAKE', text: `Emergency brake detected — ${xAccel.toFixed(1)} m/s²`, severity: 'CRITICAL' as const };
    if (xAccel < -8) return { type: 'HARSH_BRAKE', text: `Harsh braking detected — ${xAccel.toFixed(1)} m/s²`, severity: 'HIGH' as const };
    if (Math.abs(yAccel) > 6.37) return { type: 'DANGEROUS_TURN', text: `Dangerous turn detected — ${(Math.abs(yAccel)/9.8).toFixed(2)} G`, severity: 'HIGH' as const };
    if (Math.abs(yAccel) > 3.92) return { type: 'SHARP_TURN', text: `Sharp turn detected — ${(Math.abs(yAccel)/9.8).toFixed(2)} G`, severity: 'WARNING' as const };
    if (xAccel > 6) return { type: 'SUDDEN_ACCEL', text: `Sudden acceleration — ${xAccel.toFixed(1)} m/s²`, severity: 'WARNING' as const };
    
    return null;
  };

  // Check conditions and log events
  useEffect(() => {
    const status = getAlertStatus();
    
    if (status) {
      const now = Date.now();
      const lastFired = lastEventFiredAtRef.current[status.type] || 0;
      
      // Only fire same event type every 2 seconds to avoid spam
      if (now - lastFired > 2000) {
        lastEventFiredAtRef.current[status.type] = now;
        addAlert(status.text, status.severity);
        
        let penalty = 0;
        if (status.type === 'EMERGENCY_BRAKE') penalty = 20;
        else if (status.type === 'HARSH_BRAKE') penalty = 10;
        else if (status.type === 'DANGEROUS_TURN') penalty = 15;
        else if (status.type === 'SHARP_TURN') penalty = 5;
        else if (status.type === 'COMBINED') penalty = 30;
        else if (status.type === 'SUDDEN_ACCEL') penalty = 5;

        if (penalty > 0) {
          setTripScore(prev => Math.max(0, prev - penalty));
          
          const newEvent: EventLog = {
            id: Math.random().toString(36).substr(2, 9),
            timeStr: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }),
            type: status.type.replace('_', ' '),
            value: status.type.includes('TURN') ? yAccel : xAccel,
            axis: status.type.includes('TURN') ? 'Y' : 'X',
            thresholdText: `Exceeded threshold`,
            severity: status.severity
          };
          
          setEvents(prev => [newEvent, ...prev].slice(0, 50));
        }
      }
    }
  }, [xAccel, yAccel, zAccel]);

  // Real IMU logic (from GlobalRealTimeTracker -> Redux)
  useEffect(() => {
    if (useRealImu) {
      setIsSimulating(false);
      setXAccel(selectedDriver.xAccel || 0);
      setYAccel(selectedDriver.yAccel || 0);
      setZAccel(selectedDriver.zAccel || 0);
    }
  }, [useRealImu, selectedDriver.xAccel, selectedDriver.yAccel, selectedDriver.zAccel]);

  // Simulation loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSimulating) {
      interval = setInterval(() => {
        const t = simulationTimeRef.current;
        simulationTimeRef.current += 0.5; // step by 0.5s chunks, ticks every 500ms
        
        // Sequence:
        // 0s–3s: Normal X=-2, Y=0.5
        // 3s–5s: Brake X=-4
        // 5s–7s: HARSH X=-10
        // 7s–10s: Normal X=-1, Y=1
        // 10s–13s: SHARP TURN Y=5.5
        // 13s–16s: COMBINED X=-9, Y=4.8
        // 16s–20s: Normal
        
        if (t < 3) {
          setXAccel(-2); setYAccel(0.5);
        } else if (t < 5) {
          setXAccel(-4); setYAccel(0);
        } else if (t < 7) {
          setXAccel(-10); setYAccel(0); // HARSH
        } else if (t < 10) {
          setXAccel(-1); setYAccel(1);
        } else if (t < 13) {
          setXAccel(-1); setYAccel(5.5); // SHARP
        } else if (t < 16) {
          setXAccel(-9); setYAccel(4.8); // COMBINED
        } else if (t < 20) {
          setXAccel(-1); setYAccel(0);
          if (t === 19.5) {
            simulationTimeRef.current = 0; // LOOP
          }
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  // Visuals computation
  const getScoreColor = () => {
    if (tripScore >= 80) return 'text-gd-green';
    if (tripScore >= 60) return 'text-gd-amber';
    return 'text-gd-red';
  };

  const toG = (ms2: number) => ms2 / 9.8;

  const renderGauge = (label: string, valMs2: number, minMs2: number, maxMs2: number, warnThreshMs2: number, dangerThreshMs2: number, isAbsolute: boolean = false) => {
    const displayVal = isAbsolute ? Math.abs(valMs2) : valMs2;
    
    // Calculate color
    const absVal = Math.abs(valMs2);
    let color = 'hsl(142 71% 45%)'; // green
    if (absVal >= dangerThreshMs2) color = 'hsl(1 77% 55%)'; // red
    else if (absVal >= warnThreshMs2) color = 'hsl(38 92% 50%)'; // amber
    
    // Special logic for X axis if negative (braking is negative). 
    // We'll normalize to 0-1 for the arc.
    let pct = 0;
    if (isAbsolute) {
      pct = Math.max(0, Math.min(1, absVal / maxMs2));
    } else {
      // Scale from min (-20) to max (20), 0 is middle
      pct = (valMs2 - minMs2) / (maxMs2 - minMs2);
    }
    
    const angle = pct * 180;
    const r = 50;
    const cx = 60;
    const cy = 60;
    const toXY = (a: number) => ({
      x: cx + r * Math.cos((Math.PI * (180 - a)) / 180),
      y: cy - r * Math.sin((Math.PI * (180 - a)) / 180),
    });

    return (
      <div className="flex flex-col items-center justify-center p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-semibold">{label}</p>
        <svg viewBox="0 0 120 70" className="w-[120px]">
          <path d={`M ${toXY(0).x} ${toXY(0).y} A ${r} ${r} 0 0 1 ${toXY(180).x} ${toXY(180).y}`}
            fill="none" stroke="hsl(240 6% 18%)" strokeWidth={10} strokeLinecap="round" />
          
          {isAbsolute ? (
            <path d={`M ${toXY(0).x} ${toXY(0).y} A ${r} ${r} 0 0 1 ${toXY(angle).x} ${toXY(angle).y}`}
              fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" className="transition-all duration-200" />
          ) : (
            // from middle (90 deg)
            <path d={`M ${toXY(90).x} ${toXY(90).y} A ${r} ${r} 0 0 ${valMs2 > 0 ? 0 : 1} ${toXY(angle).x} ${toXY(angle).y}`}
              fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" className="transition-all duration-200" />
          )}
          
          {/* Middle mark for non-absolute */}
          {!isAbsolute && (
            <path d={`M ${toXY(90).x} ${toXY(90).y} L ${cx} ${cy - 40}`} stroke="hsl(240 5% 55%)" strokeWidth="2" />
          )}
        </svg>
        <div className="text-center mt-1">
          <p className={`font-heading text-xl font-bold ${absVal >= warnThreshMs2 ? color.replace('hsl', 'text') : 'text-foreground'}`}
            style={{ color: absVal >= warnThreshMs2 ? color : undefined }}>
            {valMs2.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">m/s²</span>
          </p>
          <p className="text-xs text-muted-foreground">{toG(valMs2).toFixed(2)} G</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-12">

      {/* active alerts stack */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 w-full max-w-lg px-4 pointer-events-none">
        {activeAlerts.map(alert => (
          <div key={alert.id} className={`w-full px-4 py-3 rounded-xl border flex items-center gap-3 shadow-lg fade-in-up visible
            ${alert.severity === 'CRITICAL' ? 'bg-gd-red/90 border-gd-red text-white danger-border-pulse animate-pulse' : 
              alert.severity === 'HIGH' ? 'bg-gd-red/80 border-gd-red text-white' : 
              'bg-gd-amber/90 border-gd-amber text-black'}`}>
            <AlertTriangle size={20} className={alert.severity === 'WARNING' ? 'text-black' : 'text-white'} />
            <span className="font-bold">{alert.message}</span>
          </div>
        ))}
      </div>

      <main className="container mx-auto px-4 pt-8">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Rash Driving Detection</h1>
            <p className="text-muted-foreground mt-1">IMU telemetry monitoring for harsh braking and sharp turns</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setUseRealImu(!useRealImu);
                if (!useRealImu) setIsSimulating(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                useRealImu ? 'bg-gd-green/20 text-gd-green border border-gd-green/50 pulse-green' : 'bg-surface border border-border text-foreground hover:bg-muted'
              }`}
            >
              <ActivityIcon size={16} /> {useRealImu ? 'Real IMU Active' : 'Use Real Device Sensors'}
            </button>
            <button
              disabled={useRealImu}
              onClick={() => {
                setIsSimulating(!isSimulating);
                if (!isSimulating) {
                  simulationTimeRef.current = 0;
                  setEvents([]);
                  setTripScore(100);
                }
              }}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                isSimulating ? 'bg-gd-blue/20 text-gd-blue' : 'bg-surface border border-border text-foreground hover:bg-muted'
              } ${useRealImu ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSimulating ? 'Stop Auto-Simulation' : 'Restart Simulation'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Visualizer & Gauges (Left) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            <div className="bg-surface border border-surface-border rounded-2xl p-6 relative overflow-hidden">
              <h3 className="font-heading font-semibold mb-6 flex justify-between items-center">
                <span>Vehicle Motion</span>
                {xAccel < -5 && <span className="text-[10px] bg-gd-red/20 text-gd-red px-2 py-1 rounded uppercase font-bold">Braking</span>}
              </h3>
              
              <div className="h-48 flex items-center justify-center relative">
                {/* Visual grid */}
                <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
                
                {/* Bus */}
                <div 
                  className="relative transition-transform duration-200"
                  style={{ transform: `rotate(${Math.min(30, Math.max(-30, yAccel * 4))}deg)` }}
                >
                  {/* Bus Body Top Down */}
                  <div className="w-16 h-32 bg-gd-blue rounded-xl relative border-2 border-gd-blue drop-shadow-[0_0_15px_rgba(37,99,235,0.2)] flex flex-col">
                    {/* Front Window */}
                    <div className="w-full h-6 bg-background rounded-t-lg border-b-2 border-gd-blue/50 opacity-80" />
                    
                    {/* Roof */}
                    <div className="flex-1 flex justify-center items-center">
                      <div className="w-8 h-16 border border-white/20 rounded opacity-50" />
                    </div>

                    {/* Back Window */}
                    <div className="w-full h-3 bg-background rounded-b opacity-80" />
                    
                    {/* Brake Lights */}
                    <div className={`absolute bottom-[-4px] left-1 w-3 h-2 rounded transition-colors ${xAccel < -5 ? 'bg-gd-red shadow-[0_0_10px_red]' : 'bg-gd-red/20'}`} />
                    <div className={`absolute bottom-[-4px] right-1 w-3 h-2 rounded transition-colors ${xAccel < -5 ? 'bg-gd-red shadow-[0_0_10px_red]' : 'bg-gd-red/20'}`} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface border border-surface-border rounded-2xl p-6">
              <h3 className="font-heading font-semibold mb-4">Live G-Force Gauges</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderGauge("Longitudinal (X)", xAccel, -20, 20, 6, 8, false)}
                {renderGauge("Lateral (Y)", yAccel, 0, 15, 3.92, 6.37, true)}
              </div>
            </div>
            
          </div>

          {/* Controls & Log (Right) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Score Card */}
              <div className="bg-surface border border-surface-border rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                 <ShieldCheck className={`h-10 w-10 mb-2 ${getScoreColor()}`} />
                 <p className="text-sm text-muted-foreground font-semibold uppercase tracking-widest">Trip Safety Score</p>
                 <p className={`font-heading text-6xl font-bold mt-2 ${getScoreColor()}`}>{tripScore}</p>
                 {tripScore < 100 && <p className="text-xs text-muted-foreground mt-2">Deductions applied from recent events</p>}
              </div>
              
              {/* Simulator Sliders */}
              <div className="bg-surface border border-surface-border rounded-2xl p-6">
                <h3 className="font-heading font-semibold mb-6 flex justify-between items-center">
                  <span>Manual IMU Input</span>
                  {isSimulating && <span className="text-[10px] text-gd-blue bg-gd-blue/10 px-2 py-1 rounded">AUTO-RUNNING</span>}
                </h3>
                
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-2">
                       <span>X-Axis (Accel/Brake)</span>
                       <span className="font-mono">{xAccel.toFixed(1)} m/s²</span>
                    </div>
                    <input type="range" min="-20" max="20" step="0.5" value={xAccel} disabled={useRealImu} onChange={e => {setXAccel(parseFloat(e.target.value)); setIsSimulating(false);}} className={`w-full accent-gd-blue ${useRealImu ? 'opacity-50' : ''}`} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-2">
                       <span>Y-Axis (Turns)</span>
                       <span className="font-mono">{yAccel.toFixed(1)} m/s²</span>
                    </div>
                    <input type="range" min="-15" max="15" step="0.5" value={yAccel} disabled={useRealImu} onChange={e => {setYAccel(parseFloat(e.target.value)); setIsSimulating(false);}} className={`w-full accent-gd-blue ${useRealImu ? 'opacity-50' : ''}`} />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-2">
                       <span>Z-Axis (Bumps)</span>
                       <span className="font-mono">{zAccel.toFixed(1)} m/s²</span>
                    </div>
                    <input type="range" min="-5" max="5" step="0.5" value={zAccel} disabled={useRealImu} onChange={e => {setZAccel(parseFloat(e.target.value)); setIsSimulating(false);}} className={`w-full accent-gd-blue opacity-50 ${useRealImu ? 'opacity-20' : ''}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Trip Event Log */}
            <div className="bg-surface border border-surface-border rounded-2xl p-6 flex-1 flex flex-col min-h-[300px]">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-heading font-semibold flex items-center gap-2">
                   <Activity size={18} className="text-muted-foreground" /> Trip Event Log
                 </h3>
                 <span className="text-xs text-muted-foreground">{events.length} events recorded</span>
              </div>
              
              <div className="overflow-y-auto pr-2 flex-1 relative">
                {events.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                    <Circle size={32} className="opacity-20 mb-2" />
                    <p className="text-sm">Driving safely. No events logged.</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-surface z-10">
                      <tr className="text-xs text-muted-foreground border-b border-border">
                        <th className="text-left pb-2 font-medium">Time</th>
                        <th className="text-left pb-2 font-medium">Event Type</th>
                        <th className="text-left pb-2 font-medium">Measurement</th>
                        <th className="text-right pb-2 font-medium">Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map(ev => (
                        <tr key={ev.id} className="border-b border-border/50 hover:bg-background/50 transition-colors">
                          <td className="py-3 text-muted-foreground whitespace-nowrap">{ev.timeStr}</td>
                          <td className="py-3 font-medium text-foreground">{ev.type}</td>
                          <td className="py-3">
                             <div className="flex items-center gap-2">
                               <span className="font-mono bg-background px-2 py-0.5 rounded border">
                                 {ev.axis}={ev.value > 0 ? '+' : ''}{ev.value.toFixed(1)}
                               </span>
                             </div>
                          </td>
                          <td className="py-3 text-right">
                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded
                              ${ev.severity === 'CRITICAL' ? 'bg-gd-red/20 text-gd-red' : 
                                ev.severity === 'HIGH' ? 'bg-gd-red/10 text-gd-red' : 
                                'bg-gd-amber/20 text-gd-amber'}`}>
                              {ev.severity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>
          
        </div>
      </main>
    </div>
  );
}
