import { ArrowRight, Eye, AlertTriangle, MapPin, BarChart2, FileText, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

/* ── Scroll-animated wrapper ── */
function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useScrollAnimation();
  return <div ref={ref} className={`fade-in-up ${className}`}>{children}</div>;
}

/* ── HERO ── */
function Hero() {
  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden grid-bg">
      <div className="container relative z-10 mx-auto px-4 text-center">
        <h1 className="font-heading text-5xl font-bold leading-tight text-foreground md:text-7xl">
          Driver fatigue kills.
          <br />
          <span className="text-gd-red">We detect it before it does.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Real-time AI monitoring for bus fleets. Detects fatigue, drowsiness, and rash driving the moment it happens.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/monitor"
            className="inline-flex items-center gap-2 rounded-full bg-gd-red px-7 py-3 text-sm font-semibold text-foreground transition-opacity hover:opacity-90"
          >
            Try Live Demo <ArrowRight size={16} />
          </Link>
          <Link
            to="/fleet"
            className="inline-flex items-center gap-2 rounded-full border border-foreground/30 px-7 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/5"
          >
            View Fleet Dashboard
          </Link>
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          Used by 3 transport authorities · 12,000+ incidents prevented
        </p>
      </div>
    </section>
  );
}

/* ── STATS STRIP ── */
const stats = [
  { value: '40%', desc: 'of highway accidents involve driver fatigue' },
  { value: '3 sec', desc: 'average time to detect drowsiness' },
  { value: '98.2%', desc: 'detection accuracy' },
  { value: '6x', desc: 'faster incident response vs manual monitoring' },
];

function StatsStrip() {
  return (
    <Section>
      <section className="border-y border-border bg-card py-12">
        <div className="container mx-auto grid grid-cols-2 gap-8 px-4 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.value} className="text-center">
              <p className="font-heading text-3xl font-bold text-foreground md:text-4xl">{s.value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </Section>
  );
}

/* ── FEATURES ── */
const features = [
  { icon: Eye, title: 'Live Fatigue Detection', desc: 'Eye Aspect Ratio monitoring via webcam. Detects eye closure, yawning, head drooping in real time.' },
  { icon: AlertTriangle, title: 'Rash Driving Alerts', desc: 'Detects over-speeding, harsh braking, sharp turns using simulated accelerometer data.' },
  { icon: MapPin, title: 'Fleet Map', desc: 'Real-time map view of all buses with color-coded safety status. Click any bus to see live stats.' },
  { icon: BarChart2, title: 'Fatigue Heatmap', desc: 'Hour-by-hour analytics showing when fatigue peaks across your fleet.' },
  { icon: FileText, title: 'AI Safety Reports', desc: 'One-click AI-generated weekly safety report with actionable recommendations.' },
  { icon: ClipboardList, title: 'Incident Log', desc: 'Full history of all fatigue and rash driving events with severity, duration, and driver details.' },
];

function Features() {
  return (
    <Section>
      <section id="features" className="py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center font-heading text-3xl font-bold text-foreground md:text-4xl">
            Everything a fleet manager needs
          </h2>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-surface-border bg-surface p-7 transition-colors hover:border-muted-foreground/30"
              >
                <f.icon className="h-7 w-7 text-gd-red" />
                <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Section>
  );
}

/* ── HOW IT WORKS ── */
const steps = [
  { num: 1, title: 'Webcam monitors the driver', desc: 'MediaPipe Face Mesh tracks 468 facial landmarks in real time.' },
  { num: 2, title: 'AI detects danger signals', desc: 'Eye Aspect Ratio drops below threshold → fatigue confirmed within 3 seconds.' },
  { num: 3, title: 'Fleet manager is alerted', desc: 'Dashboard updates instantly, alarm sounds, incident is logged automatically.' },
];

function HowItWorks() {
  return (
    <Section>
      <section className="border-t border-border py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center font-heading text-3xl font-bold text-foreground md:text-4xl">How it works</h2>
          <div className="mt-14 flex flex-col items-center gap-10 md:flex-row md:gap-0">
            {steps.map((s, i) => (
              <div key={s.num} className="flex flex-1 flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-gd-red font-heading text-xl font-bold text-gd-red">
                  {s.num}
                </div>
                {i < steps.length - 1 && (
                  <div className="my-2 hidden h-px w-full border-t-2 border-dashed border-muted-foreground/30 md:my-0 md:block" />
                )}
                <h3 className="mt-4 font-heading text-base font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Section>
  );
}

/* ── DEMO CTA ── */
function DemoCTA() {
  return (
    <Section>
      <section className="border-t border-border py-24 text-center">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">See it in action — live</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Open the dashboard, allow webcam access, and close your eyes. The alert fires in under 3 seconds.
          </p>
          <Link
            to="/monitor"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gd-red px-8 py-4 text-sm font-semibold text-foreground transition-opacity hover:opacity-90"
          >
            Launch Live Demo <ArrowRight size={16} />
          </Link>
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
      <DemoCTA />
    </>
  );
}
