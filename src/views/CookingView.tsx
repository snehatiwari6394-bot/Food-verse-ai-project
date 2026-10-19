import { useState } from 'react';
import { ChefHat, Clock, Users, Flame, CheckCircle2, Circle, ChevronRight, Lightbulb, Wine } from 'lucide-react';
import { PageShell } from '@/components/ImageDropzone';
import { Card } from '@/components/ui';
import { suggestRecipe, RECIPE_SUGGESTIONS, type CookingResult, type CookingStep } from '@/lib/engine';
import { supabase } from '@/lib/supabase';

export default function CookingView() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<CookingResult | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  function start(q: string) {
    const r = suggestRecipe(q);
    setResult(r); setActiveStep(0); setCompleted(new Set());
    supabase.from('cooking_sessions').insert({ dish: r.dish, payload: r as unknown as Record<string, unknown> });
  }

  function toggleStep(i: number) {
    setCompleted(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
  }
  function next() { if (result && activeStep < result.steps.length - 1) { setCompleted(p => new Set(p).add(activeStep)); setActiveStep(i => i + 1); } }
  function prev() { if (activeStep > 0) setActiveStep(i => i - 1); }

  return (
    <PageShell eyebrow="Module 04 · Guided Cooking" title="Smart Cooking Assistant" sub="Choose a dish and get a technique-driven, step-by-step walkthrough. Check off steps as you go — the assistant tracks your progress.">
      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="font-display text-lg font-semibold mb-3">Pick a dish</h3>
            <div className="relative mb-3">
              <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && start(query)}
                placeholder="Search recipes…" className="w-full rounded-xl px-3.5 py-2.5 text-sm border hairline" style={{ background: 'var(--surface-2)', color: 'var(--text)' }} />
            </div>
            <div className="space-y-2">
              {RECIPE_SUGGESTIONS.map(r => (
                <button key={r} onClick={() => start(r)}
                  className="w-full text-left p-3 rounded-xl text-sm transition-all flex items-center justify-between"
                  style={result?.dish === r ? { background: 'var(--surface-2)', border: '1px solid var(--primary)' } : { background: 'transparent', border: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => { if (result?.dish !== r) e.currentTarget.style.background = 'transparent'; }}>
                  <span className="font-medium">{r}</span>
                  <ChevronRight size={14} style={{ color: 'var(--muted)' }} />
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div>
          {!result ? (
            <Card className="p-16 text-center min-h-[480px] flex flex-col items-center justify-center">
              <ChefHat size={48} style={{ color: 'var(--border)' }} />
              <p className="font-display text-xl mt-4">Select a recipe to begin</p>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Each walkthrough covers ingredients, technique, timing, and plating.</p>
            </Card>
          ) : (
            <CookingPanel result={result} activeStep={activeStep} completed={completed}
              toggleStep={toggleStep} next={next} prev={prev} setActiveStep={setActiveStep} />
          )}
        </div>
      </div>
    </PageShell>
  );
}

function CookingPanel({ result, activeStep, completed, toggleStep, next, prev, setActiveStep }: {
  result: CookingResult; activeStep: number; completed: Set<number>;
  toggleStep: (i: number) => void; next: () => void; prev: () => void; setActiveStep: (i: number) => void;
}) {
  const progress = Math.round((completed.size / result.steps.length) * 100);
  const diffColor = result.difficulty === 'Easy' ? 'var(--success)' : result.difficulty === 'Intermediate' ? 'var(--warning)' : 'var(--danger)';

  return (
    <div className="anim-fade-up space-y-5">
      <Card className="overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-display text-3xl font-semibold">{result.dish}</h2>
              <div className="flex flex-wrap gap-3 mt-3 text-sm" style={{ color: 'var(--muted)' }}>
                <span className="inline-flex items-center gap-1.5"><Clock size={14} /> {result.totalTimeMin} min</span>
                <span className="inline-flex items-center gap-1.5"><Users size={14} /> {result.servings} servings</span>
                <span className="inline-flex items-center gap-1.5"><Flame size={14} style={{ color: diffColor }} /> {result.difficulty}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-3xl font-semibold" style={{ color: 'var(--primary)' }}>{progress}%</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>{completed.size}/{result.steps.length} steps done</div>
            </div>
          </div>
          <div className="h-1.5 rounded-full mt-4 overflow-hidden" style={{ background: '#243329' }}>
            <div className="h-full rounded-full" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#6fbf73,#f0b429)', transition: 'width 0.5s ease' }} />
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-[1fr_1.5fr] gap-5">
        <Card className="p-5">
          <h3 className="font-display text-lg font-semibold mb-3">Ingredients</h3>
          <ul className="space-y-2">
            {result.ingredients.map(i => (
              <li key={i.item} className="flex items-center justify-between text-sm py-2 border-b hairline last:border-0">
                <span>{i.item}</span>
                <span style={{ color: 'var(--muted)' }}>{i.amount}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold">Step {activeStep + 1} of {result.steps.length}</h3>
            {completed.has(activeStep) && <span className="chip" style={{ color: 'var(--success)' }}><CheckCircle2 size={11} /> Done</span>}
          </div>
          <StepCard step={result.steps[activeStep]} index={activeStep} active={true} onClick={() => toggleStep(activeStep)} />
          <div className="flex items-center justify-between mt-4">
            <button onClick={prev} disabled={activeStep === 0} className="btn-ghost px-4 py-2 rounded-lg text-sm disabled:opacity-40">Previous</button>
            <button onClick={next} className="btn-primary px-4 py-2 rounded-lg text-sm inline-flex items-center gap-1.5">
              {activeStep === result.steps.length - 1 ? 'Finish' : 'Next step'} <ChevronRight size={14} />
            </button>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-2">All steps</h3>
        <div className="flex flex-wrap gap-2">
          {result.steps.map((s, i) => (
            <button key={i} onClick={() => setActiveStep(i)}
              className="w-9 h-9 rounded-lg text-xs font-medium transition-all flex items-center justify-center"
              style={i === activeStep ? { background: 'var(--primary)', color: '#06280a' } : completed.has(i) ? { background: 'rgba(111,191,115,0.15)', color: 'var(--success)', border: '1px solid rgba(111,191,115,0.3)' } : { background: 'var(--surface-2)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
              {completed.has(i) ? <CheckCircle2 size={14} /> : i + 1}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-5">
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Lightbulb size={15} style={{ color: 'var(--accent)' }} /> Technique notes</h3>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--muted)' }}>
            {result.techniqueNotes.map((n, i) => <li key={i} className="leading-relaxed">• {n}</li>)}
          </ul>
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Wine size={15} style={{ color: 'var(--info)' }} /> Pairing</h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{result.pairing}</p>
        </Card>
      </div>
    </div>
  );
}

function StepCard({ step, index, active, onClick }: { step: CookingStep; index: number; active: boolean; onClick: () => void }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--surface-2)' }}>
      <div className="flex items-start gap-3">
        <button onClick={onClick} className="mt-0.5" style={{ color: 'var(--primary)' }}>
          {active ? <Circle size={18} /> : <CheckCircle2 size={18} />}
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-display text-lg font-semibold">{step.title}</h4>
            {step.durationMin && <span className="chip"><Clock size={10} /> {step.durationMin}m</span>}
          </div>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--muted)' }}>{step.detail}</p>
          {step.tip && (
            <div className="mt-3 p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(240,180,41,0.08)' }}>
              <Lightbulb size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
              <p className="text-xs leading-relaxed" style={{ color: 'var(--accent-soft)' }}>{step.tip}</p>
            </div>
          )}
        </div>
      </div>
      <span className="sr-only">step {index + 1}</span>
    </div>
  );
}
