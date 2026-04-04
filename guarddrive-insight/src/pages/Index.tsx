import { ArrowRight, Eye, AlertTriangle, MapPin, BarChart2, FileText, ClipboardList, Shield, Zap, Users, TrendingUp, ChevronRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useEffect, useRef, useState } from 'react';

/* ── Scroll-animated wrapper ── */
function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useScrollAnimation();
  return <div ref={ref} className={`fade-in-up ${className}`}>{children}</div>;
}

/* ── Animated counter ── */
function AnimatedCounter({ target, suffix = '' }: { target: string; suffix?: string }) {
  return <span>{target}{suffix}</span>;
}

/* ── HERO ── */
function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] py-20 items-center justify-center overflow-hidden" style={{ background: 'hsl(240 10% 3.9%)' }}>
      {/* Animated grid */}
      <div className="grid-bg absolute inset-0 opacity-60" />

      {/* Red radial glow */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          width: '900px',
          height: '900px',
          background: 'radial-gradient(circle, hsla(1,77%,55%,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              background: 'hsl(1,77%,55%)',
              left: `${10 + i * 16}%`,
              top: `${20 + (i % 3) * 25}%`,
              opacity: 0.3 + (i * 0.05),
              animation: `float ${3 + i * 0.7}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      <div
        className="container relative z-10 mx-auto px-4 text-center"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
        }}
      >
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-gd-red/30 bg-gd-red/10 px-4 py-1.5">
          <span className="h-2 w-2 rounded-full bg-gd-red pulse-red" />
          <span className="text-xs font-medium text-gd-red">Live Fleet Monitoring · AI-Powered</span>
        </div>

        <h1 className="font-heading text-5xl font-bold leading-tight text-foreground md:text-7xl lg:text-8xl">
          Driver fatigue kills.
          <br />
          <span
            className="text-gd-red"
            style={{
              textShadow: '0 0 80px hsla(1,77%,55%,0.4)',
            }}
          >
            We detect it before it does.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          Real-time AI monitoring for bus fleets. Detects fatigue, drowsiness, and rash
          driving the moment it happens.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/monitor"
            id="hero-try-demo"
            className="group inline-flex items-center gap-2 rounded-full bg-gd-red px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 hover:shadow-gd-red/30 hover:shadow-xl"
          >
            Try Live Demo
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/fleet"
            id="hero-fleet-dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-foreground/20 bg-foreground/5 px-8 py-3.5 text-sm font-semibold text-foreground backdrop-blur-sm transition-all hover:border-foreground/40 hover:bg-foreground/10"
          >
            View Fleet Dashboard
          </Link>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Used by 3 transport authorities · 12,000+ incidents prevented
        </p>

        {/* Scroll indicator */}
        <div className="mt-16 flex justify-center">
          <div className="flex flex-col items-center gap-2 opacity-40">
            <span className="text-xs text-muted-foreground">Scroll to explore</span>
            <div className="h-8 w-px bg-gradient-to-b from-muted-foreground to-transparent" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </section>
  );
}

/* ── STATS STRIP ── */
const stats = [
  { value: '40%', desc: 'of highway accidents involve driver fatigue', icon: AlertTriangle },
  { value: '3 sec', desc: 'average time to detect drowsiness', icon: Zap },
  { value: '98.2%', desc: 'detection accuracy', icon: TrendingUp },
  { value: '6x', desc: 'faster incident response vs manual monitoring', icon: Users },
];

function StatsStrip() {
  return (
    <Section>
      <section className="border-y border-border py-14" style={{ background: 'hsl(240 6% 8%)' }}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.value} className="group text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gd-red/10 transition-colors group-hover:bg-gd-red/20">
                  <s.icon className="h-5 w-5 text-gd-red" />
                </div>
                <p className="font-heading text-3xl font-bold text-foreground md:text-4xl">{s.value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Section>
  );
}

/* ── FEATURES ── */
const features = [
  {
    icon: Eye,
    title: 'Live Fatigue Detection',
    desc: 'Eye Aspect Ratio monitoring via webcam. Detects eye closure, yawning, head drooping in real time with MediaPipe Face Mesh.',
    link: '/monitor',
    tag: 'AI-Powered',
  },
  {
    icon: AlertTriangle,
    title: 'Rash Driving Alerts',
    desc: 'Detects over-speeding, harsh braking, sharp turns using accelerometer data. Instant alerts to fleet managers.',
    link: '/rashdriving',
    tag: 'Real-Time',
  },
  {
    icon: MapPin,
    title: 'Live Fleet Map',
    desc: 'Real-time map view of all buses with color-coded safety status. Click any bus to see live stats and telemetry.',
    link: '/fleet',
    tag: 'Live',
  },
  {
    icon: BarChart2,
    title: 'Fatigue Heatmap',
    desc: 'Hour-by-hour analytics showing when fatigue peaks across your fleet. Make data-driven scheduling decisions.',
    link: '/analytics',
    tag: 'Analytics',
  },
  {
    icon: FileText,
    title: 'AI Safety Reports',
    desc: 'One-click AI-generated weekly safety report with actionable recommendations for each driver and route.',
    link: '/analytics',
    tag: 'AI-Powered',
  },
  {
    icon: ClipboardList,
    title: 'Incident Log',
    desc: 'Full history of all fatigue and rash driving events with severity, duration, driver details, and GPS location.',
    link: '/fleet',
    tag: 'Compliance',
  },
];

function Features() {
  return (
    <Section>
      <section id="features" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5">
              <Shield className="h-3.5 w-3.5 text-gd-red" />
              <span className="text-xs font-medium text-muted-foreground">Built for Fleet Safety</span>
            </div>
            <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
              Everything a fleet manager needs
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              A complete safety intelligence platform — from real-time detection to compliance reporting.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <Link
                to={f.link}
                key={f.title}
                id={`feature-card-${i}`}
                className="group relative rounded-2xl border border-surface-border bg-surface p-7 transition-all hover:border-gd-red/30 hover:bg-gd-red/5 hover:shadow-lg hover:shadow-gd-red/5"
              >
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gd-red/10 transition-colors group-hover:bg-gd-red/20">
                    <f.icon className="h-5 w-5 text-gd-red" />
                  </div>
                  <span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {f.tag}
                  </span>
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                <div className="mt-5 flex items-center gap-1 text-xs font-medium text-gd-red opacity-0 transition-opacity group-hover:opacity-100">
                  Explore <ChevronRight size={12} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Section>
  );
}

/* ── HOW IT WORKS ── */
const steps = [
  {
    num: 1,
    title: 'Webcam monitors the driver',
    desc: 'MediaPipe Face Mesh tracks 468 facial landmarks in real time, continuously analyzing eye state and head position.',
    color: 'from-gd-red/20 to-transparent',
  },
  {
    num: 2,
    title: 'AI detects danger signals',
    desc: 'Eye Aspect Ratio drops below threshold → fatigue confirmed within 3 seconds. Rash driving events auto-flagged.',
    color: 'from-gd-amber/20 to-transparent',
  },
  {
    num: 3,
    title: 'Fleet manager is alerted',
    desc: 'Dashboard updates instantly, alarm sounds, incident is automatically logged with timestamp and GPS location.',
    color: 'from-gd-green/20 to-transparent',
  },
];

function HowItWorks() {
  return (
    <Section>
      <section className="border-t border-border py-24" style={{ background: 'hsl(240 6% 8%)' }}>
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
              How it works
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Three simple steps from driver fatigue to instant fleet-wide alert.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.num} className="relative">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="absolute right-0 top-8 hidden h-px w-full border-t-2 border-dashed border-muted-foreground/20 md:block"
                    style={{ width: 'calc(100% - 3rem)', left: '4rem' }} />
                )}
                <div className="rounded-2xl border border-border bg-card p-7 hover:border-muted-foreground/20 transition-colors">
                  <div
                    className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl font-heading text-xl font-bold text-white"
                    style={{ background: `hsl(${s.num === 1 ? '1,77%,55%' : s.num === 2 ? '38,92%,50%' : '142,71%,45%'})` }}
                  >
                    {s.num}
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Section>
  );
}

/* ── LIVE DEMO PREVIEW ── */
function LiveDemoPreview() {
  return (
    <Section>
      <section className="border-t border-border py-24">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl border border-gd-red/20 bg-gradient-to-br from-gd-red/5 via-card to-card p-10 text-center md:p-16">
            {/* Background glow */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                width: '500px',
                height: '300px',
                background: 'radial-gradient(ellipse, hsla(1,77%,55%,0.12) 0%, transparent 70%)',
              }}
            />

            <div className="relative z-10">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gd-red/10 border border-gd-red/20">
                <Play className="h-7 w-7 text-gd-red" />
              </div>
              <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
                See it in action — live
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Open the dashboard, allow webcam access, and close your eyes.
                The alert fires in under 3 seconds.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/monitor"
                  id="cta-launch-demo"
                  className="group inline-flex items-center gap-2 rounded-full bg-gd-red px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-gd-red/20 transition-all hover:opacity-90 hover:shadow-gd-red/40"
                >
                  Launch Live Demo
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/fleet"
                  id="cta-fleet-map"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-sm font-semibold text-foreground transition-all hover:border-muted-foreground/40 hover:bg-card"
                >
                  <MapPin size={14} />
                  Open Fleet Map
                </Link>
              </div>

              {/* Trust badges */}
              <div className="mt-10 flex flex-wrap items-center justify-center gap-6 opacity-60">
                {['AI Detection', 'Real-Time Alerts', 'GPS Tracking', 'Compliance Ready'].map(badge => (
                  <div key={badge} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-gd-green" />
                    {badge}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Section>
  );
}

/* ── PAGE ── */
export default function LandingPage() {
  return (
    <>
      <Hero />
      <StatsStrip />
      <Features />
      <HowItWorks />
      <LiveDemoPreview />
    </>
  );
}
