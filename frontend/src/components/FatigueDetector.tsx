/**
 * FatigueDetector.tsx
 *
 * Real-time driver fatigue detection using MediaPipe Face Mesh.
 * Detects eye closure via Eye Aspect Ratio (EAR) and raises alerts
 * when eyes remain closed for a sustained period.
 *
 * Fully client-side — no backend required.
 * Uses CDN-served WASM/model files from jsDelivr.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { FaceMesh, Results } from '@mediapipe/face_mesh';
import {
  Camera,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
  RefreshCw,
  Activity,
  Zap,
  Volume2,
  MapPin,
} from 'lucide-react';
import {
  LEFT_EYE_INDICES,
  RIGHT_EYE_INDICES,
  calcEAR,
  drawEyeContour,
  playAlertBeep,
  playEmergencySiren
} from '@/lib/earUtils';

// ─── Constants ────────────────────────────────────────────────────────────────
const EAR_THRESHOLD   = 0.25;   // Below this → eye considered closed
const DANGER_FRAMES   = 15;     // Consecutive closed frames → fatigue alert
const BLINK_MIN       = 2;      // Min closed frames to count as a blink
const BLINK_MAX       = 14;     // Max closed frames before it's drowsiness
const CDN_BASE        = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh';

// ─── Types ────────────────────────────────────────────────────────────────────
type EyeStatus = 'open' | 'closed' | 'danger' | 'emergency';

export interface Incident {
  id: number;
  time: string;
  type: 'Drowsiness' | 'Blink';
  ear: number;
  frames?: number;
}

interface Props {
  /** Extra Tailwind classes on the root element */
  className?: string;
  /** Called every time eye status changes */
  onStatusChange?: (status: EyeStatus, ear: number) => void;
  /** Called when a new incident is logged */
  onIncident?: (incident: Incident) => void;
  /** Driver name shown in the panel */
  driverName?: string;
  /** Route label */
  route?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function FatigueDetector({
  className = '',
  onStatusChange,
  onIncident,
  driverName = 'Driver',
  route = '—',
}: Props) {
  // DOM refs
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);

  // MediaPipe / stream refs (never cause re-renders)
  const fmRef      = useRef<FaceMesh | null>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const rafRef     = useRef<number>(0);

  // Stable callback refs (avoid stale closure issues)
  const onStatusRef   = useRef(onStatusChange);
  const onIncidentRef = useRef(onIncident);
  useEffect(() => { onStatusRef.current   = onStatusChange; });
  useEffect(() => { onIncidentRef.current = onIncident; });

  // Frame counters and timing (refs for logic, state for display)
  const closedRef   = useRef(0);
  const blinkRef    = useRef(0);
  const alertedRef  = useRef(false);   // guard repeat beep per event
  const incIdRef    = useRef(0);
  
  // Escalation tracking refs
  const emaRef = useRef(0.32);
  const fatigueStartTimeRef = useRef(0);
  const lastBeepTimeRef = useRef(0);
  const lastVoiceTimeRef = useRef(0);
  const lastSirenTimeRef = useRef(0);

  // UI state
  const [mode,         setMode]        = useState<'idle' | 'loading' | 'running' | 'error'>('idle');
  const [permState,    setPermState]   = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [status,       setStatus]      = useState<EyeStatus>('open');
  const [earDisplay,   setEarDisplay]  = useState(0.32);
  const [closedCount,  setClosedCount] = useState(0);
  const [blinkCount,   setBlinkCount]  = useState(0);
  const [showAlert,    setShowAlert]   = useState(false);
  const [incidents,    setIncidents]   = useState<Incident[]>([]);
  const [errorMsg,     setErrorMsg]    = useState('');

  // ─── onResults — called every frame by FaceMesh ─────────────────────────────
  const onResults = useCallback((results: Results) => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas to video dimensions
    const W = video.videoWidth  || 640;
    const H = video.videoHeight || 480;
    if (canvas.width !== W)  canvas.width  = W;
    if (canvas.height !== H) canvas.height = H;

    ctx.clearRect(0, 0, W, H);

    if (!results.multiFaceLandmarks?.length) return;

    const rawLm = results.multiFaceLandmarks[0];

    // Convert normalized → pixel coords for accurate EAR
    const lm = rawLm.map((p) => ({ x: p.x * W, y: p.y * H }));

    // ── EAR ───────────────────────────────────────────────────────────────────
    const earL = calcEAR(lm, LEFT_EYE_INDICES);
    const earR = calcEAR(lm, RIGHT_EYE_INDICES);
    const ear  = (earL + earR) / 2;
    
    // EMA smoothing to eliminate jitter & false triggers (perfect detection)
    emaRef.current = (emaRef.current * 0.7) + (ear * 0.3);
    const smoothedEar = parseFloat(emaRef.current.toFixed(3));
    setEarDisplay(smoothedEar);

    // ── Draw eye landmarks ────────────────────────────────────────────────────
    const eyeColor =
      smoothedEar < EAR_THRESHOLD ? 'hsl(1,77%,55%)' : 'hsl(142,71%,45%)';

    drawEyeContour(ctx, lm, LEFT_EYE_INDICES,  eyeColor, 2.5);
    drawEyeContour(ctx, lm, RIGHT_EYE_INDICES, eyeColor, 2.5);

    // EAR debug overlay on canvas
    const earLabel = `EAR ${smoothedEar.toFixed(3)}`;
    ctx.font         = 'bold 12px monospace';
    const tw         = ctx.measureText(earLabel).width;
    ctx.fillStyle    = 'rgba(0,0,0,0.55)';
    ctx.fillRect(8, 8, tw + 16, 22);
    ctx.fillStyle    = eyeColor;
    ctx.fillText(earLabel, 16, 24);

    // ── Fatigue / blink logic ─────────────────────────────────────────────────
    if (smoothedEar < EAR_THRESHOLD) {
      if (closedRef.current === 0) {
        fatigueStartTimeRef.current = Date.now();
      }

      closedRef.current++;
      blinkRef.current++;
      setClosedCount(closedRef.current);

      const elapsedMs = Date.now() - fatigueStartTimeRef.current;

      let st: EyeStatus = 'closed';
      if (elapsedMs >= 25000) st = 'emergency';
      else if (elapsedMs >= 10000 || closedRef.current >= DANGER_FRAMES) st = 'danger';
      
      setStatus(st);
      onStatusRef.current?.(st, smoothedEar);

      if (closedRef.current >= DANGER_FRAMES) {
        // Initial incident log Trigger
        if (!alertedRef.current) {
          alertedRef.current = true;
          setShowAlert(true);
          const inc: Incident = {
            id:     ++incIdRef.current,
            time:   new Date().toLocaleTimeString(),
            type:   'Drowsiness',
            ear:    smoothedEar,
            frames: closedRef.current,
          };
          setIncidents((prev) => [inc, ...prev].slice(0, 30));
          onIncidentRef.current?.(inc);
        }

        // Escalation Logic
        if (elapsedMs >= 25000) {
          // 25s: Play continuous emergency siren
          if (Date.now() - lastSirenTimeRef.current > 800) {
             playEmergencySiren();
             lastSirenTimeRef.current = Date.now();
          }
        } 
        else if (elapsedMs >= 10000) {
          // 10s: Voice Warning (once every 10s)
          if (Date.now() - lastVoiceTimeRef.current > 10000) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance("Warning: Severe fatigue detected. Please wake up immediately!");
            window.speechSynthesis.speak(utterance);
            lastVoiceTimeRef.current = Date.now();
          }
          // Louder beeps more frequently
          if (Date.now() - lastBeepTimeRef.current > 500) {
            playAlertBeep(900, 0.4, 1.0); // max volume
            lastBeepTimeRef.current = Date.now();
          }
        } 
        else {
          // Standard: Ramp volume slowly up to 10s
          if (Date.now() - lastBeepTimeRef.current > 1000) {
            const vol = 0.2 + Math.min(0.8, (elapsedMs / 10000) * 0.8);
            playAlertBeep(880, 0.6, vol);
            lastBeepTimeRef.current = Date.now();
          }
        }
      }
    } else {
      // Eyes just re-opened
      const wasBlink =
        blinkRef.current >= BLINK_MIN && blinkRef.current <= BLINK_MAX;

      if (wasBlink) {
        setBlinkCount((c) => c + 1);
        const inc: Incident = {
          id:   ++incIdRef.current,
          time: new Date().toLocaleTimeString(),
          type: 'Blink',
          ear:  smoothedEar,
        };
        setIncidents((prev) => [inc, ...prev].slice(0, 30));
        onIncidentRef.current?.(inc);
      }

      closedRef.current  = 0;
      blinkRef.current   = 0;
      alertedRef.current = false;
      fatigueStartTimeRef.current = 0; // reset
      setClosedCount(0);
      setStatus('open');
      onStatusRef.current?.('open', smoothedEar);
    }
  }, []);

  // ─── Frame loop ──────────────────────────────────────────────────────────────
  const frameLoop = useCallback(async () => {
    const video = videoRef.current;
    const fm    = fmRef.current;
    if (!video || !fm || video.readyState < 2 || video.paused) return;

    try {
      await fm.send({ image: video });
    } catch {
      /* ignore transient send errors */
    }

    rafRef.current = requestAnimationFrame(frameLoop);
  }, []);

  // ─── Initialize MediaPipe FaceMesh ───────────────────────────────────────────
  const initFaceMesh = useCallback(async () => {
    if (fmRef.current) return fmRef.current;

    const { FaceMesh } = await import('@mediapipe/face_mesh');

    const fm = new FaceMesh({
      locateFile: (file: string) => `${CDN_BASE}/${file}`,
    });

    fm.setOptions({
      maxNumFaces:           1,
      refineLandmarks:       false,   // keep false for speed
      minDetectionConfidence: 0.5,
      minTrackingConfidence:  0.5,
    });

    fm.onResults(onResults);

    // Pre-initialize model (downloads WASM + model files)
    await fm.initialize();

    fmRef.current = fm;
    return fm;
  }, [onResults]);

  // ─── Start camera ─────────────────────────────────────────────────────────────
  const startCamera = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setPermState('granted');
      return true;
    } catch (err: any) {
      const isDenied =
        err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
      setPermState(isDenied ? 'denied' : 'unknown');
      setErrorMsg(isDenied
        ? 'Camera access denied. Please allow camera in browser settings.'
        : `Camera error: ${err?.message || 'Unknown error'}`
      );
      return false;
    }
  }, []);

  // ─── Public start ─────────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    setMode('loading');
    setErrorMsg('');

    try {
      await initFaceMesh();
      const ok = await startCamera();
      if (!ok) {
        setMode('error');
        return;
      }
      setMode('running');
      rafRef.current = requestAnimationFrame(frameLoop);
    } catch (err: any) {
      setErrorMsg(`Initialization failed: ${err?.message || 'Unknown error'}`);
      setMode('error');
    }
  }, [initFaceMesh, startCamera, frameLoop]);

  // ─── Public stop ─────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    closedRef.current  = 0;
    blinkRef.current   = 0;
    alertedRef.current = false;
    fatigueStartTimeRef.current = 0;
    emaRef.current = 0.32;
    window.speechSynthesis.cancel(); // Stop any voice alerts

    setMode('idle');
    setStatus('open');
    setShowAlert(false);
    setClosedCount(0);
    setEarDisplay(0.32);
  }, []);

  // ─── Cleanup on unmount ───────────────────────────────────────────────────────
  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  // ─── Derived values ───────────────────────────────────────────────────────────
  const isRunning  = mode === 'running';
  const isLoading  = mode === 'loading';
  const earPct     = Math.min(100, (earDisplay / 0.45) * 100);
  const closedPct  = Math.min(100, (closedCount / DANGER_FRAMES) * 100);

  const statusLabel = status === 'emergency' ? 'EMERGENCY' : status === 'danger' ? 'DROWSY' : status === 'closed' ? 'Eyes Closed' : 'Eyes Open';
  const statusColor = (status === 'danger' || status === 'emergency')
    ? 'text-gd-red'
    : status === 'closed'
    ? 'text-gd-amber'
    : 'text-gd-green';

  const earBarColor = earDisplay < 0.2
    ? 'bg-gd-red'
    : earDisplay < EAR_THRESHOLD
    ? 'bg-gd-amber'
    : 'bg-gd-green';

  return (
    <div className={`space-y-4 ${className}`}>

      {/* ── Emergency Protocol Overlay ── */}
      {status === 'emergency' && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gd-red/95 text-white backdrop-blur-xl animate-in fade-in zoom-in duration-300">
           <AlertTriangle className="h-24 w-24 animate-pulse mb-6 drop-shadow-[0_0_20px_rgba(255,255,255,0.7)]" />
           <h1 className="text-6xl md:text-8xl font-heading font-black text-center tracking-tighter uppercase mb-2 shadow-black/50 drop-shadow-lg">EMERGENCY<br/>PROTOCOL</h1>
           <p className="text-xl md:text-3xl font-medium tracking-wide text-center px-4 mb-10">Driver unresponsive for 25+ seconds.</p>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl px-4">
             {/* Simulated Call View */}
             <div className="bg-black/40 rounded-3xl p-6 border border-white/20 flex flex-col items-center shadow-2xl backdrop-blur-md">
                <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center mb-4 border-4 border-white/40 animate-pulse">
                  <span className="text-3xl">👩🏽</span>
                </div>
                <h3 className="text-2xl font-bold font-heading">Priya (Wife)</h3>
                <p className="text-white/60 font-mono text-sm mt-1">+91 98765 43210</p>
                <div className="mt-4 flex items-center gap-2 text-gd-green animate-pulse font-semibold">
                  <span className="h-3 w-3 rounded-full bg-gd-green"></span>
                  Call Connected — 00:04
                </div>
                <p className="text-center text-sm mt-4 text-white/80 max-w-xs">
                  "Automated Alert: {driverName} is unresponsive. GPS dispatched."
                </p>
             </div>

             {/* Simulated Live Location View */}
             <div className="bg-black/40 rounded-3xl p-6 border border-white/20 flex flex-col items-center shadow-2xl backdrop-blur-md">
                <div className="h-full w-full flex flex-col items-center justify-center">
                  <div className="relative mb-4 mt-2">
                    <MapPin className="h-16 w-16 text-gd-blue animate-bounce drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-4 w-12 bg-black/40 rounded-[100%] blur-[2px]"></span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-center text-gd-blue drop-shadow-md">LIVE LOCATION SHARED</h3>
                  <div className="font-mono text-xs text-white/70 bg-black/60 px-4 py-2 rounded-lg border border-white/10 text-center w-full max-w-xs">
                    LAT: 23.022505°N<br/>
                    LNG: 72.571362°E<br/>
                    SPEED: 0 km/h (HALTED)
                  </div>
                  <p className="mt-4 text-center text-[10px] uppercase tracking-widest text-white/50">
                    Encrypted link sent to Emergency Contacts & Fleet Manager
                  </p>
                </div>
             </div>
           </div>
        </div>
      )}

      {/* ── Danger Alert Banner ─────────────────────────────────────────────── */}
      {showAlert && (
        <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-gd-red bg-gd-red/10 px-4 py-3 danger-border-pulse">
          <div className="flex items-center gap-3 min-w-0">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-gd-red animate-pulse" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-gd-red">⚠ FATIGUE DETECTED</p>
              <p className="text-xs text-gd-red/80 truncate">
                {driverName} — Eyes closed for {closedCount} frames · Route {route}
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => playAlertBeep(880, 0.6, 0.3)}
              className="rounded-lg bg-gd-red/20 px-3 py-1.5 text-xs text-gd-red hover:bg-gd-red/30 flex items-center gap-1"
            >
              <Volume2 size={12} /> Sound Alarm
            </button>
            <button
              onClick={() => setShowAlert(false)}
              className="rounded-lg bg-muted px-2 py-1.5 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Video Panel ─────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface">

        {/* Video + canvas overlay */}
        <div className="relative aspect-video bg-black">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            style={{ transform: 'scaleX(-1)' }}   /* mirror for natural feel */
            playsInline
            muted
          />
          {/* Canvas is NOT mirrored — drawn on original coords */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full"
            style={{ transform: 'scaleX(-1)' }}   /* mirror to match video */
          />

          {/* ── Overlay when not running ───────────────────────────────────── */}
          {!isRunning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85">
              {isLoading ? (
                <div className="text-center px-6">
                  <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
                  <p className="mt-4 text-sm font-medium text-foreground">Initializing Face Mesh…</p>
                  <p className="mt-1 text-xs text-muted-foreground">Loading model from CDN, please wait</p>
                  <div className="mt-4 h-1 w-48 mx-auto rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-2/3 rounded-full bg-gd-red animate-pulse" />
                  </div>
                </div>
              ) : mode === 'error' ? (
                <div className="text-center px-6">
                  <AlertTriangle className="mx-auto h-12 w-12 text-gd-amber" />
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    {permState === 'denied' ? 'Camera access denied' : 'Initialization failed'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground max-w-xs">{errorMsg}</p>
                  <button
                    onClick={start}
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm text-foreground hover:bg-muted"
                  >
                    <RefreshCw size={14} /> Try Again
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-surface-border bg-surface">
                    <Camera className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Driver camera ready
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/60">
                    Webcam access required for fatigue detection
                  </p>
                  <button
                    onClick={start}
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-gd-red px-7 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                  >
                    <Eye size={15} /> Start Detection
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Live badges ────────────────────────────────────────────────── */}
          {isRunning && (
            <>
              {/* LIVE pill */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-gd-red pulse-red" />
                LIVE
              </div>

              {/* Eye status */}
              <div className={`absolute bottom-3 left-3 flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-sm ${
                status === 'danger'
                  ? 'border-gd-red/50 bg-gd-red/20 text-gd-red danger-border-pulse'
                  : status === 'closed'
                  ? 'border-gd-amber/50 bg-gd-amber/20 text-gd-amber'
                  : 'border-gd-green/40 bg-gd-green/15 text-gd-green'
              }`}>
                {status === 'open'
                  ? <Eye size={12} />
                  : <EyeOff size={12} />}
                {statusLabel}
              </div>

              {/* Stop button */}
              <button
                onClick={stop}
                className="absolute top-3 right-3 rounded-full bg-black/60 p-2 text-white backdrop-blur-sm hover:bg-black/80 transition-colors"
                title="Stop detection"
              >
                <X size={14} />
              </button>
            </>
          )}
        </div>

        {/* ── Live Metrics ──────────────────────────────────────────────────── */}
        {isRunning && (
          <div className="grid grid-cols-3 divide-x divide-border border-t border-border">

            {/* EAR */}
            <div className="p-4">
              <div className="flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-muted-foreground" />
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">EAR Value</p>
              </div>
              <p className={`mt-1 font-heading text-2xl font-bold ${statusColor}`}>
                {earDisplay.toFixed(3)}
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-150 ${earBarColor}`}
                  style={{ width: `${earPct}%` }}
                />
              </div>
              <p className="mt-1 text-[9px] text-muted-foreground">
                Threshold: {EAR_THRESHOLD} · Safe: ≥ 0.30
              </p>
            </div>

            {/* Blinks */}
            <div className="p-4">
              <div className="flex items-center gap-1.5">
                <Eye className="h-3 w-3 text-muted-foreground" />
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Blinks</p>
              </div>
              <p className="mt-1 font-heading text-2xl font-bold text-foreground">
                {blinkCount}
                <span className="ml-1 text-xs font-normal text-muted-foreground">detected</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {Array.from({ length: Math.min(blinkCount, 10) }).map((_, i) => (
                  <span key={i} className="h-2 w-2 rounded-full bg-gd-blue" />
                ))}
                {blinkCount > 10 && (
                  <span className="text-[9px] text-muted-foreground">+{blinkCount - 10}</span>
                )}
              </div>
            </div>

            {/* Closed frames counter */}
            <div className="p-4">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-muted-foreground" />
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Closed Frames</p>
              </div>
              <p className={`mt-1 font-heading text-2xl font-bold ${
                closedCount >= DANGER_FRAMES ? 'text-gd-red' :
                closedCount > 5 ? 'text-gd-amber' : 'text-foreground'
              }`}>
                {closedCount}
                <span className="ml-1 text-xs font-normal text-muted-foreground">/ {DANGER_FRAMES}</span>
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-100 ${
                    closedCount >= DANGER_FRAMES ? 'bg-gd-red' : 'bg-gd-amber'
                  }`}
                  style={{ width: `${closedPct}%` }}
                />
              </div>
              <p className="mt-1 text-[9px] text-muted-foreground">
                Alert triggers at {DANGER_FRAMES} frames
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Incident Log ────────────────────────────────────────────────────── */}
      {incidents.length > 0 && (
        <div className="rounded-2xl border border-surface-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm font-semibold text-foreground">
              Incident Log
            </h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              {incidents.length} events
            </span>
          </div>

          <div className="mt-3 max-h-52 space-y-1.5 overflow-y-auto pr-1">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className="flex items-center gap-3 rounded-lg bg-background px-3 py-2"
              >
                <span className={`h-2 w-2 flex-shrink-0 rounded-full ${
                  inc.type === 'Drowsiness' ? 'bg-gd-red' : 'bg-gd-blue'
                }`} />

                <span className="w-18 flex-shrink-0 font-mono text-[10px] text-muted-foreground">
                  {inc.time}
                </span>

                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  inc.type === 'Drowsiness'
                    ? 'bg-gd-red/15 text-gd-red'
                    : 'bg-gd-blue/15 text-gd-blue'
                }`}>
                  {inc.type}
                </span>

                {inc.frames && (
                  <span className="text-[10px] text-muted-foreground">
                    {inc.frames}f
                  </span>
                )}

                <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                  EAR {inc.ear}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
