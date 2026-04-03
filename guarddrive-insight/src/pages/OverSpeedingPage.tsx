import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { AlertTriangle, ShieldAlert, Activity, Circle, CheckCircle2, Mic2, Keyboard } from 'lucide-react';
import Navbar from '@/components/Navbar';

import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { Suspense } from 'react';

type Zone = { name: string; limit: number };
const ZONES: Zone[] = [
  { name: 'School Zone', limit: 30 },
  { name: 'City Road', limit: 50 },
  { name: 'Highway', limit: 60 },
  { name: 'Expressway', limit: 80 },
];

type Severity = 'SAFE' | 'WARNING' | 'HIGH ALERT' | 'CRITICAL';

interface SpeedData {
  time: number;
  speed: number;
}

interface Incident {
  id: string;
  timeStr: string;
  peakSpeed: number;
  zoneLimit: number;
  duration: number;
  severity: Severity;
}

const synth = window.speechSynthesis;

/* --- 3D Scene Components --- */

function RoadLines({ speed }: { speed: number }) {
  const lineRef = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (lineRef.current) {
      // Move lines towards camera
      lineRef.current.position.z += speed * delta * 0.3;
      if (lineRef.current.position.z > 20) {
        lineRef.current.position.z -= 20; // reset loop
      }
    }
  });

  return (
    <group ref={lineRef}>
      {Array.from({ length: 40 }).map((_, i) => (
        <mesh key={i} position={[0, -2.9, -40 + i * 4]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.3, 2]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function SteeringWheel({ shake, color }: { shake: number, color: string }) {
  const wheelRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (wheelRef.current) {
      // Vibrate based on shake
      const vibX = (Math.random() - 0.5) * shake * 0.05;
      const vibY = (Math.random() - 0.5) * shake * 0.05;
      wheelRef.current.position.x = vibX;
      wheelRef.current.position.y = -1.5 + vibY;
      
      // Slight base turning based on mouse or auto
      wheelRef.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.05;
    }
  });

  return (
    <group ref={wheelRef} position={[0, -1.5, -2]} rotation={[-0.3, 0, 0]}>
      {/* Outer Ring */}
      <mesh>
        <torusGeometry args={[1.8, 0.25, 16, 64]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
      
      {/* Center Hub */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.6, 0.4, 32]} />
        <meshStandardMaterial color="#111" roughness={0.6} />
      </mesh>
      
      {/* Spokes */}
      <mesh position={[-0.9, 0, 0]} rotation={[0, 0, Math.PI/2]}>
        <cylinderGeometry args={[0.1, 0.2, 1.8, 8]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0.9, 0, 0]} rotation={[0, 0, Math.PI/2]}>
        <cylinderGeometry args={[0.1, 0.2, 1.8, 8]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0, -0.9, 0]}>
        <cylinderGeometry args={[0.1, 0.2, 1.8, 8]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      {/* Center Logo */}
      <mesh position={[0, 0.05, 0.21]} rotation={[Math.PI/2, 0, 0]}>
        <circleGeometry args={[0.25, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

function Scene({ speed, status }: { speed: number, status: string }) {
  const isDanger = status !== 'SAFE';
  const lightColor = isDanger ? '#ff2222' : '#ffffff';
  
  // Calculate shake: heavily increasing if past 80
  const shake = speed > 60 ? (speed - 60) * 0.1 : 0;
  
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.5, 0]} fov={75} />
      
      <Suspense fallback={null}>
        <Environment preset="night" />
      </Suspense>
      
      <ambientLight intensity={0.5} />
      {/* Directional light passing as streetlights */}
      <directionalLight position={[0, 10, -20]} intensity={1.5} color={lightColor} />
      <pointLight position={[0, 2, -10]} intensity={isDanger ? 10 : 2} color={lightColor} distance={50} />

      {/* Asphalt Road */}
      <mesh position={[0, -3, -50]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 200]} />
        <meshStandardMaterial color="#111111" roughness={0.8} />
      </mesh>

      <RoadLines speed={speed} />
      
      {/* Motion Blur Particles to fake high speed realistic movement */}
      <Sparkles count={speed * 2} scale={20} size={15} speed={speed * 0.1} opacity={0.6} color="#aaa" />

      {/* Dashboard Top */}
      <mesh position={[0, -2.5, -3]} rotation={[-0.1, 0, 0]}>
        <boxGeometry args={[12, 2, 4]} />
        <meshStandardMaterial color="#0a0a0a" roughness={1} />
      </mesh>

      {/* Dynamic Steering Wheel */}
      <SteeringWheel shake={shake} color={status === 'SAFE' ? '#10b981' : '#ef4444'} />
    </>
  );
}

/* --- End 3D Scene --- */

export default function OverSpeedingPage() {
  const [driverName, setDriverName] = useState<string>("Raju");
  const [langMode, setLangMode] = useState<"BOTH" | "EN">("BOTH");
  
  const [speed, setSpeed] = useState<number>(45);
  const [activeZone, setActiveZone] = useState<Zone>(ZONES[2]); // Highway 60
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [speedHistory, setSpeedHistory] = useState<SpeedData[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  
  const [lastSpokenText, setLastSpokenText] = useState<{ en: string; hi?: string } | null>(null);
  const textClearTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const simulationTimeRef = useRef<number>(0);
  const violationStartTimeRef = useRef<number | null>(null);
  const peakSpeedRef = useRef<number>(0);
  const [violationDuration, setViolationDuration] = useState<number>(0);

  // Tracking spoken events
  const lastSpokenTimeRef = useRef<{ [key: string]: number }>({});

  const speakBoth = (englishMsg: string, hinglishMsg: string, key: string, cooldownMs = 15000) => {
    const now = Date.now();
    if (lastSpokenTimeRef.current[key] && now - lastSpokenTimeRef.current[key] < cooldownMs) return;
    lastSpokenTimeRef.current[key] = now;

    // Show text in UI
    setLastSpokenText({ en: englishMsg, hi: langMode === "BOTH" ? hinglishMsg : undefined });
    if (textClearTimeoutRef.current) clearTimeout(textClearTimeoutRef.current);
    textClearTimeoutRef.current = setTimeout(() => {
      setLastSpokenText(null);
    }, 6000);

    // Cancel currently speaking
    synth.cancel();

    // First: English
    const eng = new SpeechSynthesisUtterance(englishMsg);
    eng.lang = 'en-IN';
    eng.rate = 0.92;
    eng.pitch = 1.0;
    eng.volume = 1.0;
    synth.speak(eng);

    // Then: Hinglish after 3 seconds if BOTH mode is on
    if (langMode === "BOTH") {
      setTimeout(() => {
        // Double check we haven't spoken something else critically in between
        const hin = new SpeechSynthesisUtterance(hinglishMsg);
        hin.lang = 'hi-IN';
        hin.rate = 0.88;
        hin.pitch = 1.05;
        hin.volume = 1.0;
        synth.speak(hin);
      }, 3000);
    }
  };

  const getStatus = (currentSpeed: number, limit: number): Severity => {
    if (currentSpeed > limit * 1.50) return 'CRITICAL';
    if (currentSpeed > limit * 1.25) return 'HIGH ALERT';
    if (currentSpeed > limit * 1.10) return 'WARNING';
    if (currentSpeed > limit) return 'WARNING'; 
    return 'SAFE';
  };

  const status = getStatus(speed, activeZone.limit);

  const [continuousAlarm, setContinuousAlarm] = useState(false);
  const timeAbove80Ref = useRef(0);
  const wasSpeedingRef = useRef(false);

  // Audio handling for continuous alarm
  useEffect(() => {
    let audioCtx: AudioContext;
    let osc: OscillatorNode;
    let gain: GainNode;
    let interval: NodeJS.Timeout;

    if (continuousAlarm) {
      try {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        osc = audioCtx.createOscillator();
        gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = 800; // piercing high pitch
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();

        // Pulsing volume
        interval = setInterval(() => {
          gain.gain.setValueAtTime(1, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        }, 400); // Pulse every 400ms

      } catch(e) {
        console.error("Audio API err", e);
      }
    }

    return () => {
      if (osc) osc.stop();
      if (audioCtx) audioCtx.close();
      if (interval) clearInterval(interval);
    };
  }, [continuousAlarm]);

  // Voice Alert Check
  useEffect(() => {
    const limit = activeZone.limit;
    const pct = (speed / limit) * 100;
    const spd = Math.round(speed);

    // Track 1-minute logic for > 80kmh
    if (speed > 80) {
      if (!continuousAlarm) {
        timeAbove80Ref.current += 1; // Evaluated roughly once per second via speed change updates...
        // Wait, speed might not update exactly every second if manual. 
        // Actually, best to handle the timer inside the simulation/interval loop, or a separate 1s interval.
      }
    }

    if (speed > limit) {
      wasSpeedingRef.current = true;
    }

    // Checking if dropping back below 60
    if (speed < 60 && wasSpeedingRef.current) {
      wasSpeedingRef.current = false;
      timeAbove80Ref.current = 0;
      setContinuousAlarm(false);
      lastSpokenTimeRef.current = {}; // Reset all voice cooldowns so they can speak again later

      speakBoth(
        `Thank you ${driverName}. Now you are in a safe zone.`,
        `Dhanyawad ${driverName}. Ab aap safe zone mein hain.`,
        'SAFE_ZONE', 
        0 // Force speak immediately
      );
    }

    if (pct >= 150) {
      speakBoth(
        `${driverName}! Critical speed violation. Doing ${spd} in a ${limit} zone. Slow down immediately!`,
        `${driverName}! Ruko! Bahut zyada tez chal rahe ho! ${spd} speed hai, limit sirf ${limit} hai! Gaadi rokke speed kam karo!`,
        'CRITICAL', 999999 // Speak ONCE
      );
    } else if (pct >= 125) {
      speakBoth(
        `${driverName}, you are going too fast. Speed ${spd}, limit is ${limit}. Reduce speed now.`,
        `${driverName} bhai, bahut tez ja rahe ho! Speed ${spd} hai, limit sirf ${limit} hai. Abhi speed kam karo!`,
        'HIGH', 999999 // Speak ONCE
      );
    } else if (pct >= 110) {
      speakBoth(
        `${driverName}, speed limit exceeded. Please slow down to ${limit} kilometres per hour.`,
        `${driverName} bhai, speed limit cross ho gayi hai. Speed kam karo, ${limit} karo.`,
        'WARN', 999999 // Speak ONCE
      );
    }
  }, [speed, activeZone, driverName, langMode, continuousAlarm]);

  // Separate interval for tracking 60s at >80kmh
  useEffect(() => {
    const iv = setInterval(() => {
      if (speed > 80 && !continuousAlarm) {
        timeAbove80Ref.current += 1;
        if (timeAbove80Ref.current >= 60) {
           setContinuousAlarm(true);
        }
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [speed, continuousAlarm]);

  // Zone Change Alert Check
  const prevZoneRef = useRef<Zone>(activeZone);
  useEffect(() => {
    if (prevZoneRef.current.limit !== activeZone.limit) {
      if (speed > activeZone.limit) {
        speakBoth(
          `Attention ${driverName}. Speed limit changed to ${activeZone.limit}. Please slow down immediately.`,
          `${driverName} bhai, dhyan do! Yahan speed limit ${activeZone.limit} hai. Jaldi speed kam karo!`,
          'ZONE_CHANGE', 5000
        );
      }
      prevZoneRef.current = activeZone;
    }
  }, [activeZone, speed, driverName, langMode]);

  // Keyboard shortcut for W (speed up) and S (slow down)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      
      if (e.key === 'w' || e.key === 'W') {
        setSpeed((prev) => Math.min(140, prev + 2));
        setIsSimulating(false);
      } else if (e.key === 's' || e.key === 'S') {
        setSpeed((prev) => Math.max(0, prev - 2));
        setIsSimulating(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Simulation Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSimulating) {
      interval = setInterval(() => {
        const t = simulationTimeRef.current;
        simulationTimeRef.current += 1;
        
        let targetSpeed = 45;
        if (t < 2) {
          targetSpeed = 45;
        } else if (t < 6) {
          // Ramp to 78 quickly (after 2s) to trigger High alert in 60 zone
          targetSpeed = 45 + ((78 - 45) * ((t - 2) / 4));
        } else if (t < 14) {
          // Stay around 78 to let voices play
          targetSpeed = 78 + (Math.random() * 2 - 1);
        } else if (t < 20) {
          // Hit Critical (96+)
          targetSpeed = 78 + ((96 - 78) * ((t - 14) / 6));
        } else if (t < 30) {
          // Slow down
          targetSpeed = 96 - ((96 - 50) * ((t - 20) / 10));
          if (t >= 29) {
            simulationTimeRef.current = 0;
          }
        }
        
        setSpeed(Math.round(targetSpeed));
        
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  // History & Incident Logging
  useEffect(() => {
    setSpeedHistory(prev => {
      const next = [...prev, { time: new Date().getTime(), speed }];
      return next.slice(-30);
    });
    
    const limit = activeZone.limit;
    
    if (speed > limit) {
      if (violationStartTimeRef.current === null) {
        violationStartTimeRef.current = Date.now();
        setViolationDuration(0);
        peakSpeedRef.current = speed;
      } else {
        setViolationDuration(Math.floor((Date.now() - violationStartTimeRef.current) / 1000));
        if (speed > peakSpeedRef.current) peakSpeedRef.current = speed;
      }
    } else {
      if (violationStartTimeRef.current !== null) {
        const dur = Math.floor((Date.now() - violationStartTimeRef.current) / 1000);
        const peak = peakSpeedRef.current;
        const peakStatus = getStatus(peak, limit);
        
        if (peakStatus !== 'SAFE') {
          const newIncident: Incident = {
            id: Math.random().toString(36).substr(2, 9),
            timeStr: new Date().toLocaleTimeString(),
            peakSpeed: peak,
            zoneLimit: limit,
            duration: dur,
            severity: peakStatus,
          };
          setIncidents(prev => [newIncident, ...prev]);
        }
        violationStartTimeRef.current = null;
        setViolationDuration(0);
        peakSpeedRef.current = 0;
      }
    }
  }, [speed, activeZone]);

  const overAmount = Math.max(0, speed - activeZone.limit);
  const overPct = activeZone.limit > 0 ? Math.round((overAmount / activeZone.limit) * 100) : 0;

  const getColors = (s: Severity) => {
    switch (s) {
      case 'SAFE': return { bg: 'bg-gd-green/10', text: 'text-gd-green', border: 'border-gd-green/20' };
      case 'WARNING': return { bg: 'bg-gd-amber/10', text: 'text-gd-amber', border: 'border-gd-amber/20' };
      case 'HIGH ALERT': return { bg: 'bg-gd-red/10', text: 'text-gd-red', border: 'border-gd-red/50' };
      case 'CRITICAL': return { bg: 'bg-gd-red/20', text: 'text-gd-red', border: 'border-gd-red danger-border-pulse' };
      default: return { bg: 'bg-surface', text: 'text-foreground', border: 'border-surface-border' };
    }
  };

  const statusColors = getColors(status);
  const maxSpeed = 140;
  const pct = Math.min(speed, maxSpeed) / maxSpeed;
  const angle = pct * 180;
  const gaugeR = 60;
  const cx = 70;
  const cy = 70;
  const toXY = (a: number) => ({
    x: cx + gaugeR * Math.cos((Math.PI * (180 - a)) / 180),
    y: cy - gaugeR * Math.sin((Math.PI * (180 - a)) / 180),
  });

  // Calculate generic shake intensity for FPP steering
  const shakeOffset = speed > activeZone.limit 
    ? (Math.random() > 0.5 ? 1 : -1) * (Math.random() * ((speed - activeZone.limit) / 10))
    : 0;
  // Calculate road speed duration for css animation
  const roadDuration = Math.max(0.1, 4 - (speed / 40));

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      
      {/* Blinking Red Overlay if Speeding */}
      {status !== 'SAFE' && (
        <div className="pointer-events-none fixed inset-0 z-30 bg-gd-red/10 animate-pulse mix-blend-multiply transition-opacity duration-300" />
      )}

      {/* Alert Banners */}
      {status === 'WARNING' && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-gd-amber/20 px-4 py-3 border-b-2 border-gd-amber text-gd-amber text-center font-semibold flex items-center justify-center gap-2">
          <AlertTriangle size={18} /> Slow down — approaching speed limit
        </div>
      )}
      {status === 'HIGH ALERT' && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-gd-red/20 px-4 py-3 border-b-2 border-gd-red text-gd-red text-center font-bold flex items-center justify-center gap-2">
          <AlertTriangle size={18} /> DANGEROUS SPEED DETECTED
        </div>
      )}
      {status === 'CRITICAL' && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-gd-red/30 px-4 py-3 border-b-4 border-gd-red text-gd-red text-center font-bold flex items-center justify-center gap-2 danger-border-pulse">
          <ShieldAlert size={20} className="animate-pulse" /> CRITICAL SPEED VIOLATION — REPORTING TO RTO
        </div>
      )}

      <main className="container mx-auto px-4 pt-32">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Over-Speeding Detection</h1>
            <p className="text-muted-foreground mt-1">Real-time velocity monitoring & voice alerts</p>
          </div>
          
          {/* Driver Config UI */}
          <div className="flex flex-wrap items-center gap-4 bg-surface px-4 py-2 rounded-xl border border-border">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-muted-foreground">Driver:</label>
              <input 
                type="text" 
                value={driverName} 
                onChange={e => setDriverName(e.target.value)}
                className="bg-background border border-border rounded px-2 py-1 text-sm text-foreground w-24 focus:outline-none focus:border-primary"
              />
            </div>
            <div className="w-px h-6 bg-border" />
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-muted-foreground"><Mic2 size={16} /></label>
              <select 
                value={langMode} 
                onChange={e => setLangMode(e.target.value as "BOTH" | "EN")}
                className="bg-background border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary"
              >
                <option value="BOTH">English + Hinglish</option>
                <option value="EN">English Only</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => {
              setIsSimulating(!isSimulating);
              if (!isSimulating) simulationTimeRef.current = 0;
            }}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              isSimulating ? 'bg-gd-blue/20 text-gd-blue' : 'bg-surface border border-border text-foreground hover:bg-muted'
            }`}
          >
            {isSimulating ? 'Stop Simulation' : 'Start Auto-Simulation'}
          </button>
          
          {!isSimulating && (
            <div className="text-sm text-muted-foreground px-3 py-1 flex items-center gap-1.5 border border-border rounded-full bg-surface">
              <Keyboard size={14} /> Press <kbd className="font-mono bg-background px-1 rounded mx-1">W</kbd> to speed up, <kbd className="font-mono bg-background px-1 rounded mx-1">S</kbd> to slow down
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Status Panel */}
          <div className={`col-span-1 lg:col-span-1 border rounded-2xl p-6 ${statusColors.bg} ${statusColors.border} transition-colors duration-300 relative`}>
            
            <div className="flex justify-between items-start mb-6">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusColors.border} ${statusColors.bg}`}>
                {status === 'SAFE' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                {status}
              </span>
              {violationDuration > 0 && (
                <span className="text-xs font-mono text-gd-red font-bold animate-pulse">
                  {violationDuration}s violation
                </span>
              )}
            </div>

            {/* Gauge */}
            <div className="relative mx-auto w-full max-w-[220px]">
              <svg viewBox="0 0 140 80" className="w-full drop-shadow-md">
                <path d={`M ${toXY(0).x} ${toXY(0).y} A ${gaugeR} ${gaugeR} 0 0 1 ${toXY(180).x} ${toXY(180).y}`}
                  fill="none" stroke="hsl(240 6% 18%)" strokeWidth={12} strokeLinecap="round" />
                {angle > 0 && (
                  <path d={`M ${toXY(0).x} ${toXY(0).y} A ${gaugeR} ${gaugeR} 0 ${angle > 180 ? 1 : 0} 1 ${toXY(angle).x} ${toXY(angle).y}`}
                    fill="none" stroke={status === 'SAFE' ? 'hsl(142 71% 45%)' : status === 'WARNING' ? 'hsl(38 92% 50%)' : 'hsl(1 77% 55%)'} 
                    strokeWidth={12} strokeLinecap="round" 
                    className="transition-all duration-300 ease-out" />
                )}
                <path d={`M ${toXY((activeZone.limit / maxSpeed) * 180).x} ${toXY((activeZone.limit / maxSpeed) * 180).y} L ${cx} ${cy}`} 
                  stroke="hsl(1 77% 55%)" strokeWidth="2" strokeDasharray="2 2" className="opacity-50" />
              </svg>
              <div className="absolute bottom-0 left-0 w-full text-center">
                <p className={`font-heading text-6xl font-bold leading-none tracking-tighter ${statusColors.text}`}>
                  {speed}
                </p>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-1">km/h</p>
              </div>
            </div>

            {/* Last Spoken Subtitle */}
            <div className="mt-8 min-h-[48px] flex flex-col items-center justify-center text-center">
              {lastSpokenText ? (
                <div className="text-xs italic text-muted-foreground w-full animate-in fade-in slide-in-from-bottom-2">
                  <p><span className="font-semibold not-italic mr-1">EN:</span>"{lastSpokenText.en}"</p>
                  {lastSpokenText.hi && (
                    <p className="mt-1"><span className="font-semibold not-italic mr-1">HI:</span>"{lastSpokenText.hi}"</p>
                  )}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground/30 italic">No recent voice alerts...</span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-background/50 rounded-xl p-3 border border-border">
                <p className="text-xs text-muted-foreground">Zone Limit</p>
                <p className="text-xl font-bold text-foreground">{activeZone.limit} <span className="text-sm font-normal text-muted-foreground">km/h</span></p>
              </div>
              <div className="bg-background/50 rounded-xl p-3 border border-border">
                <p className="text-xs text-muted-foreground">Over Limit</p>
                <p className="text-xl font-bold text-foreground">
                  +{overAmount} <span className="text-sm font-normal text-muted-foreground">({overPct}%)</span>
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: FPP Simulator, Chart & Controls */}
          <div className="col-span-1 lg:col-span-2 space-y-6">
            
            {/* FPP BUS VIEW SIMULATOR */}
            <div className={`bg-black border ${status === 'SAFE' ? 'border-surface-border' : 'border-gd-red'} rounded-2xl overflow-hidden relative h-64 shadow-inner`}>
              <div className="absolute top-0 left-0 w-full mb-2 bg-black/60 p-2 z-20 flex justify-between items-center backdrop-blur-sm border-b border-white/10">
                <span className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <Activity size={14} className={status === 'SAFE' ? 'text-gd-green' : 'text-gd-red'} /> FRONT CAMERA (FPP 3D REALISTIC)
                </span>
                {continuousAlarm && (
                  <span className="text-[10px] bg-gd-red text-white px-2 py-0.5 rounded animate-pulse font-bold">1 MINUTE OVER 80 ALARM ACTIVE</span>
                )}
              </div>

              {/* React Three Fiber Canvas replacing old CSS approach */}
              <div className="absolute inset-0">
                <Canvas>
                  <ambientLight intensity={0.1} />
                  <Scene speed={speed} status={status} />
                </Canvas>
              </div>
            </div>

            <div className="bg-surface border border-surface-border rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-heading font-semibold flex items-center gap-2">
                  <Activity size={18} className="text-gd-blue" /> Live Speed Chart (30s)
                </h3>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={speedHistory} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[0, 140]} tick={{ fill: 'hsl(240 5% 55%)', fontSize: 10 }} />
                    <ReferenceLine y={activeZone.limit} stroke="hsl(1 77% 55%)" strokeDasharray="5 5" label={{ value: 'LIMIT', fill: 'hsl(1 77% 55%)', position: 'insideTopLeft' }} />
                    <RechartsTooltip 
                      contentStyle={{ background: 'hsl(240 6% 8%)', border: '1px solid hsl(240 6% 20%)', borderRadius: 8 }}
                      labelFormatter={() => ''}
                      formatter={(val: number) => [`${val} km/h`, 'Speed']}
                    />
                    <Line type="monotone" dataKey="speed" stroke="hsl(217 91% 60%)" strokeWidth={3} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Simulator Controls */}
              <div className="bg-surface border border-surface-border rounded-2xl p-6">
                <h3 className="font-heading font-semibold mb-4 flex justify-between">
                  Simulator Controls
                </h3>
                
                <div className="mb-6">
                  <label className="text-sm text-muted-foreground flex justify-between mb-2">
                    <span>Manual Speed Control</span>
                    <span className="font-mono text-foreground">{speed} km/h</span>
                  </label>
                  <input 
                    type="range" 
                    min="0" max="140" 
                    value={speed}
                    onChange={(e) => {
                      setSpeed(parseInt(e.target.value));
                      setIsSimulating(false);
                    }}
                    className="w-full accent-gd-blue"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Road Zone Limit</label>
                  <select 
                    value={activeZone.limit}
                    onChange={(e) => {
                      const limit = parseInt(e.target.value);
                      const zone = ZONES.find(z => z.limit === limit);
                      if (zone) setActiveZone(zone);
                    }}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gd-blue"
                  >
                    {ZONES.map(z => (
                      <option key={z.name} value={z.limit}>{z.name} ({z.limit} km/h)</option>
                    ))}
                  </select>
                </div>
                
                <button 
                  onClick={() => speakBoth(
                    `${driverName}! You appear tired and are over the speed limit. Pull over safely now!`,
                    `${driverName} bhai! Neend aa rahi hai aur speed bhi zyada hai! Gaadi side mein rok lo abhi!`,
                    'COMBO', 10000
                  )}
                  className="mt-6 w-full py-2 bg-gd-red/10 hover:bg-gd-red/20 text-gd-red text-sm font-semibold rounded-lg border border-gd-red/30 transition-colors"
                >
                  Test Combined Fatigue + Speed Alert
                </button>
              </div>

              {/* Incident Log */}
              <div className="bg-surface border border-surface-border rounded-2xl p-6 flex flex-col h-full max-h-[280px]">
                <h3 className="font-heading font-semibold mb-4">Incident Log</h3>
                <div className="overflow-y-auto flex-1 pr-2">
                  {incidents.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                      <Circle size={32} className="opacity-20 mb-2" />
                      <p className="text-sm">No violations recorded</p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-surface">
                        <tr className="text-xs text-muted-foreground border-b border-border">
                          <th className="text-left pb-2 font-medium">Time</th>
                          <th className="text-center pb-2 font-medium">Peak</th>
                          <th className="text-center pb-2 font-medium">Dur</th>
                          <th className="text-right pb-2 font-medium">Severity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incidents.map(inc => (
                          <tr key={inc.id} className="border-b border-border/50">
                            <td className="py-2 text-muted-foreground whitespace-nowrap">{inc.timeStr}</td>
                            <td className="py-2 text-center text-foreground font-mono">{inc.peakSpeed}</td>
                            <td className="py-2 text-center text-muted-foreground font-mono">{inc.duration}s</td>
                            <td className="py-2 text-right">
                              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded whitespace-nowrap
                                ${inc.severity === 'CRITICAL' ? 'bg-gd-red/20 text-gd-red' : 
                                  inc.severity === 'HIGH ALERT' ? 'bg-gd-red/10 text-gd-red' : 
                                  'bg-gd-amber/20 text-gd-amber'}`}>
                                {inc.severity}
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
        </div>
      </main>
    </div>
  );
}
