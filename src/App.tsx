import { useState } from 'react';
import { Leaf, ScanEye, Sparkles, ChefHat, HeartPulse, ShieldCheck, ArrowRight, Github, Activity, Apple, Flame, Droplets } from 'lucide-react';
import RecognitionView from '@/views/RecognitionView';
import FreshnessView from '@/views/FreshnessView';
import HygieneView from '@/views/HygieneView';
import CookingView from '@/views/CookingView';
import NutritionView from '@/views/NutritionView';

type TabId = 'home' | 'recognition' | 'freshness' | 'hygiene' | 'cooking' | 'nutrition';

const NAV: { id: TabId; label: string; icon: typeof ScanEye; desc: string }[] = [
  { id: 'recognition', label: 'Food Recognition', icon: ScanEye, desc: 'Identify dishes & estimate nutrition' },
  { id: 'freshness', label: 'Freshness', icon: Leaf, desc: 'Detect spoilage before it shows' },
  { id: 'hygiene', label: 'Kitchen Hygiene', icon: ShieldCheck, desc: 'Audit restaurant workspaces' },
  { id: 'cooking', label: 'Cooking Assistant', icon: ChefHat, desc: 'Guided, technique-first recipes' },
  { id: 'nutrition', label: 'Nutrition', icon: HeartPulse, desc: 'Personalized meal planning' },
];

export default function App() {
  const [tab, setTab] = useState<TabId>('home');

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <Header tab={tab} setTab={setTab} />
      <main className="flex-1">
        {tab === 'home' && <Home onNavigate={setTab} />}
        {tab === 'recognition' && <RecognitionView />}
        {tab === 'freshness' && <FreshnessView />}
        {tab === 'hygiene' && <HygieneView />}
        {tab === 'cooking' && <CookingView />}
        {tab === 'nutrition' && <NutritionView />}
      </main>
      <Footer />
    </div>
  );
}

function Header({ tab, setTab }: { tab: TabId; setTab: (t: TabId) => void }) {
  return (
    <header className="sticky top-0 z-40 glass border-b hairline">
      <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between gap-4">
        <button onClick={() => setTab('home')} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6fbf73,#4ea554)' }}>
            <Leaf size={18} color="#06280a" strokeWidth={2.4} />
          </div>
          <div className="text-left">
            <div className="font-display text-lg font-semibold leading-none">Food Verse<span style={{ color: 'var(--primary)' }}> AI</span></div>
            <div className="text-[10px] uppercase tracking-[0.18em] mt-0.5" style={{ color: 'var(--muted-2)' }}>Multimodal Food Intelligence</div>
          </div>
        </button>
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(n => {
            const active = tab === n.id;
            return (
              <button key={n.id} onClick={() => setTab(n.id)}
                className="px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
                style={active ? { background: 'var(--surface-2)', color: 'var(--text)' } : { color: 'var(--muted)' }}
                onMouseEnter={e => !active && (e.currentTarget.style.color = 'var(--text)')}
                onMouseLeave={e => !active && (e.currentTarget.style.color = 'var(--muted)')}>
                {n.label}
              </button>
            );
          })}
        </nav>
        <div className="md:hidden">
          <select value={tab} onChange={e => setTab(e.target.value as TabId)} className="surface-2 rounded-lg px-3 py-1.5 text-sm border hairline" style={{ background: 'var(--surface-2)', color: 'var(--text)' }}>
            <option value="home">Home</option>
            {NAV.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
          </select>
        </div>
      </div>
    </header>
  );
}

function Home({ onNavigate }: { onNavigate: (t: TabId) => void }) {
  return (
    <>
      <Hero onNavigate={onNavigate} />
      <Modules onNavigate={onNavigate} />
      <HowItWorks />
      <Stats />
    </>
  );
}

function Hero({ onNavigate }: { onNavigate: (t: TabId) => void }) {
  return (
    <section className="relative overflow-hidden hero-grid">
      <div className="absolute inset-0 noise-overlay opacity-60" />
      <div className="max-w-7xl mx-auto px-5 md:px-8 pt-20 pb-24 md:pt-28 md:pb-32 relative">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <div className="anim-fade-up">
            <div className="chip mb-6">
              <Sparkles size={12} style={{ color: 'var(--accent)' }} />
              Vision · Context · Personalization
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.04]">
              See food<br />
              <span className="grad-text">differently.</span>
            </h1>
            <p className="mt-6 text-lg max-w-xl leading-relaxed" style={{ color: 'var(--muted)' }}>
              A multimodal food intelligence platform that reads what's on your plate — recognizing dishes, detecting freshness, auditing kitchen hygiene, guiding your cooking, and tailoring nutrition to you. One lens. Five intelligences.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => onNavigate('recognition')} className="btn-primary px-5 py-3 rounded-xl text-sm inline-flex items-center gap-2">
                <ScanEye size={16} /> Analyze a dish <ArrowRight size={15} />
              </button>
              <button onClick={() => onNavigate('nutrition')} className="btn-ghost px-5 py-3 rounded-xl text-sm inline-flex items-center gap-2">
                <HeartPulse size={16} /> Build my nutrition plan
              </button>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-xs" style={{ color: 'var(--muted-2)' }}>
              <span className="inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--primary)' }} /> Real-time visual analysis</span>
              <span className="inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} /> Personalized to your goals</span>
              <span className="inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--info)' }} /> Transparent, explainable outputs</span>
            </div>
          </div>
          <div className="relative anim-fade-up delay-2">
            <HeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroVisual() {
  const heroImg = 'https://images.pexels.com/photos/14457547/pexels-photo-14457547.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
  return (
    <div className="relative">
      <div className="surface rounded-3xl overflow-hidden scanline-wrap hover-lift">
        <img src={heroImg} alt="Gourmet dishes" className="w-full h-[380px] object-cover" loading="lazy" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(11,17,14,0.9))' }} />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--primary)' }}>Live Analysis</div>
              <div className="font-display text-xl mt-1">Gourmet Plate · 3 components detected</div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl" style={{ color: 'var(--accent)' }}>92%</div>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--muted)' }}>confidence</div>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <span className="chip"><Apple size={11} /> 410 kcal</span>
            <span className="chip"><Activity size={11} /> 22g protein</span>
            <span className="chip"><Flame size={11} /> Low-carb</span>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-5 -left-5 glass rounded-2xl p-3.5 anim-floaty" style={{ animationDelay: '1s' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(111,191,115,0.15)' }}>
            <Leaf size={16} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>Freshness</div>
            <div className="font-display text-sm font-semibold">Grade A · 5 days left</div>
          </div>
        </div>
      </div>
      <div className="absolute -top-4 -right-3 glass rounded-2xl p-3.5 anim-floaty">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(95,184,201,0.15)' }}>
            <Droplets size={16} style={{ color: 'var(--info)' }} />
          </div>
          <div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>Hydration target</div>
            <div className="font-display text-sm font-semibold">2.4 L today</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Modules({ onNavigate }: { onNavigate: (t: TabId) => void }) {
  return (
    <section className="max-w-7xl mx-auto px-5 md:px-8 py-20">
      <div className="text-center mb-12 anim-fade-up">
        <div className="text-xs uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--primary)' }}>Five intelligences, one platform</div>
        <h2 className="font-display text-4xl font-semibold tracking-tight">Every dimension of food, decoded</h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {NAV.map((n, i) => (
          <button key={n.id} onClick={() => onNavigate(n.id)}
            className="surface rounded-2xl p-6 text-left hover-lift anim-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ background: i % 2 === 0 ? 'rgba(111,191,115,0.12)' : 'rgba(240,180,41,0.12)' }}>
              <n.icon size={22} style={{ color: i % 2 === 0 ? 'var(--primary)' : 'var(--accent)' }} />
            </div>
            <h3 className="font-display text-xl font-semibold">{n.label}</h3>
            <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{n.desc}</p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--primary)' }}>
              Open module <ArrowRight size={14} />
            </div>
          </button>
        ))}
        <div className="surface rounded-2xl p-6 flex flex-col justify-between" style={{ background: 'linear-gradient(135deg, rgba(111,191,115,0.08), rgba(240,180,41,0.06))' }}>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--accent)' }}>Unified by design</div>
            <h3 className="font-display text-xl font-semibold leading-snug">Insights from one module flow into the next.</h3>
          </div>
          <p className="mt-4 text-sm" style={{ color: 'var(--muted)' }}>A recognized dish pre-fills your nutrition log. A freshness flag adjusts your cooking plan. Everything is connected.</p>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: '01', t: 'Capture', d: 'Upload a photo of food, a kitchen scene, or produce. Image signals are read in-browser.' },
    { n: '02', t: 'Analyze', d: 'The engine extracts color, texture, and brightness signals, then reasons across its knowledge base.' },
    { n: '03', t: 'Act', d: 'You get a scored, explainable result — plus tailored recommendations you can log or save.' },
  ];
  return (
    <section className="border-y hairline" style={{ background: 'var(--bg-soft)' }}>
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={s.n} className="anim-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="font-display text-5xl font-semibold" style={{ color: 'var(--border)' }}>{s.n}</div>
              <h3 className="font-display text-2xl font-semibold mt-3">{s.t}</h3>
              <p className="mt-2 leading-relaxed" style={{ color: 'var(--muted)' }}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { v: '5', l: 'Intelligence modules' },
    { v: '120+', l: 'Foods in the recognition library' },
    { v: '<2s', l: 'Average analysis time' },
    { v: '100%', l: 'Explainable, on-device reasoning' },
  ];
  return (
    <section className="max-w-7xl mx-auto px-5 md:px-8 py-20">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="text-center anim-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="font-display text-4xl md:text-5xl font-semibold grad-text">{s.v}</div>
            <div className="text-sm mt-2" style={{ color: 'var(--muted)' }}>{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t hairline" style={{ background: 'var(--bg-soft)' }}>
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6fbf73,#4ea554)' }}>
            <Leaf size={15} color="#06280a" strokeWidth={2.4} />
          </div>
          <span className="font-display text-sm">Food Verse AI · Multimodal food intelligence</span>
        </div>
        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--muted-2)' }}>
          <span>Vision · Reasoning · Personalization</span>
          <a href="#" className="inline-flex items-center gap-1.5 hover:text-white transition-colors"><Github size={13} /> Open architecture</a>
        </div>
      </div>
    </footer>
  );
}
