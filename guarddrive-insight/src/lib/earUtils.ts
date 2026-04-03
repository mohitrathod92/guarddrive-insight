// ── Eye landmark indices (MediaPipe Face Mesh 468-point model) ──
// Ordered as: p1=outer, p2=top-outer, p3=top-inner, p4=inner, p5=bottom-inner, p6=bottom-outer
export const LEFT_EYE_INDICES  = [362, 385, 387, 263, 373, 380];
export const RIGHT_EYE_INDICES = [33,  160, 158, 133, 153, 144];

/** Euclidean distance in pixel space */
export function euclidean(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Eye Aspect Ratio — measures how open the eye is.
 * EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
 *
 * @param landmarks  Array of {x, y} landmark positions (pixel coords)
 * @param indices    Six landmark indices [p1..p6]
 */
export function calcEAR(
  landmarks: { x: number; y: number }[],
  indices: number[],
): number {
  const [i1, i2, i3, i4, i5, i6] = indices;
  const ver1 = euclidean(landmarks[i2], landmarks[i6]);
  const ver2 = euclidean(landmarks[i3], landmarks[i5]);
  const hor  = euclidean(landmarks[i1], landmarks[i4]);
  if (hor === 0) return 0;
  return (ver1 + ver2) / (2 * hor);
}

/**
 * Draw a closed polygon through the given landmark indices on a canvas context.
 */
export function drawEyeContour(
  ctx: CanvasRenderingContext2D,
  landmarks: { x: number; y: number }[],
  indices: number[],
  color: string,
  dotRadius = 2,
) {
  ctx.beginPath();
  indices.forEach((idx, i) => {
    const { x, y } = landmarks[idx];
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth   = 1.5;
  ctx.stroke();

  // Draw dots at each landmark
  indices.forEach((idx) => {
    const { x, y } = landmarks[idx];
    ctx.beginPath();
    ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });
}

/** Singleton AudioContext for alert beeps */
let _audioCtx: AudioContext | null = null;

/**
 * Play a short alert beep using Web Audio API (no audio file needed).
 */
export function playAlertBeep(frequency = 880, duration = 0.5, volume = 0.25) {
  try {
    if (!_audioCtx) _audioCtx = new AudioContext();
    if (_audioCtx.state === 'suspended') _audioCtx.resume();

    const osc  = _audioCtx.createOscillator();
    const gain = _audioCtx.createGain();

    osc.connect(gain);
    gain.connect(_audioCtx.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(frequency, _audioCtx.currentTime);
    gain.gain.setValueAtTime(volume, _audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + duration);

    osc.start(_audioCtx.currentTime);
    osc.stop(_audioCtx.currentTime + duration);
  } catch {
    /* silently ignore if audio is blocked */
  }
}
