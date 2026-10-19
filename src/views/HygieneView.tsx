import { useState, useEffect } from 'react';
import { ShieldCheck, History, Trash2, CheckCircle2, AlertTriangle, Building2 } from 'lucide-react';
import { ImageDropzone, PageShell, type UploadedImage } from '@/components/ImageDropzone';
import { Card, Spinner, ScoreRing, EmptyState, Bar } from '@/components/ui';
import { imageStatsFromUrl, assessHygiene, type HygieneResult } from '@/lib/engine';
import { supabase, type HygieneRow } from '@/lib/supabase';

const SAMPLES = [
  { url: 'https://images.pexels.com/photos/4253300/pexels-photo-4253300.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', name: 'Open kitchen' },
  { url: 'https://images.pexels.com/photos/12193823/pexels-photo-12193823.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', name: 'Steel kitchen' },
  { url: 'https://images.pexels.com/photos/2977514/pexels-photo-2977514.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', name: 'Fine dining line' },
];

const GRADE_COLOR: Record<string, string> = { A: 'var(--success)', B: 'var(--primary)', C: 'var(--warning)', D: 'var(--danger)', F: 'var(--danger)' };

export default function HygieneView() {
  const [img, setImg] = useState<UploadedImage | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HygieneResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HygieneRow[]>([]);

  useEffect(() => { loadHistory(); }, []);
  async function loadHistory() {
    const { data } = await supabase.from('hygiene_reports').select('*').order('created_at', { ascending: false }).limit(6);
    if (data) setHistory(data as HygieneRow[]);
  }

  async function analyze(image: UploadedImage) {
    if (!name.trim()) { setError('Enter a restaurant name to generate the report.'); return; }
    setImg(image); setLoading(true); setError(null); setResult(null);
    try {
      const stats = await imageStatsFromUrl(image.url);
      const r = assessHygiene(stats, name.trim());
      setResult(r);
      await supabase.from('hygiene_reports').insert({
        restaurant_name: name.trim(), image_ref: image.url,
        payload: r as unknown as Record<string, unknown>, overall_score: r.overallScore, grade: r.grade,
      });
      loadHistory();
    } catch {
      setError('Could not analyze this image. Try a clearer, well-lit kitchen photo.');
    } finally { setLoading(false); }
  }

  function handleImage(image: UploadedImage) {
    if (!name.trim()) { setError('Enter a restaurant name first, then upload the photo.'); setImg(null); return; }
    analyze(image);
  }

  async function clearHistory() {
    await supabase.from('hygiene_reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    setHistory([]);
  }

  return (
    <PageShell eyebrow="Module 03 · Safety Monitoring" title="Restaurant Hygiene Audit" sub="Analyze a kitchen photo for cleanliness, organization, equipment condition, cross-contamination risk, and lighting — producing a scored report with actionable findings.">
      <div className="grid lg:grid-cols-[1fr_1.3fr] gap-6">
        <Card className="p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Audit input</h3>
          <label className="text-xs mb-1.5 block" style={{ color: 'var(--muted)' }}>Restaurant name</label>
          <div className="relative mb-4">
            <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-2)' }} />
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. The Green Spoon"
              className="w-full rounded-xl px-9 py-2.5 text-sm border hairline" style={{ background: 'var(--surface-2)', color: 'var(--text)' }} />
          </div>
          <ImageDropzone onImage={handleImage} label="Upload a kitchen photo to audit" samples={SAMPLES} />
          {error && <p className="mt-4 text-sm p-3 rounded-lg" style={{ background: 'rgba(232,93,93,0.1)', color: 'var(--danger)' }}>{error}</p>}
        </Card>

        <Card className="p-6 min-h-[420px]">
          {!img && !loading && !result && <EmptyState icon={<ShieldCheck size={22} />} title="No audit yet" sub="Enter a name and upload a kitchen photo." />}
          {loading && <div className="h-full flex flex-col items-center justify-center"><Spinner size={28} /><p className="text-sm mt-3" style={{ color: 'var(--muted)' }}>Scanning workspace…</p></div>}
          {result && !loading && <HygienePanel img={img} result={result} name={name} />}
        </Card>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-semibold flex items-center gap-2"><History size={18} /> Past audits</h3>
          {history.length > 0 && <button onClick={clearHistory} className="btn-ghost px-3 py-1.5 rounded-lg text-xs inline-flex items-center gap-1.5"><Trash2 size={12} /> Clear</button>}
        </div>
        {history.length === 0 ? (
          <Card className="p-8 text-center text-sm" style={{ color: 'var(--muted)' }}>No audits yet.</Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map(h => (
              <Card key={h.id} className="overflow-hidden">
                {h.image_ref && <img src={h.image_ref} alt="" className="w-full h-28 object-cover" loading="lazy" />}
                <div className="p-3">
                  <div className="text-xs" style={{ color: 'var(--muted-2)' }}>{new Date(h.created_at).toLocaleDateString()}</div>
                  <div className="font-medium text-sm mt-0.5">{h.restaurant_name}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>Score {h.overall_score}</span>
                    <span className="chip" style={{ color: GRADE_COLOR[h.grade ?? 'C'] ?? 'var(--muted)' }}>Grade {h.grade}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

function HygienePanel({ img, result, name }: { img: UploadedImage | null; result: HygieneResult; name: string }) {
  const color = GRADE_COLOR[result.grade] ?? 'var(--muted)';
  return (
    <div className="anim-fade-up">
      <div className="flex items-start gap-5">
        {img && <img src={img.url} alt="" className="w-28 h-28 rounded-xl object-cover" />}
        <div className="flex-1 flex items-center gap-5">
          <ScoreRing score={result.overallScore} label="Score" color={color} />
          <div>
            <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{name}</div>
            <div className="font-display text-5xl font-semibold" style={{ color }}>{result.grade}</div>
            <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{result.overallScore}/100</div>
          </div>
        </div>
      </div>

      <p className="mt-5 text-sm leading-relaxed p-4 rounded-xl" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>{result.summary}</p>

      <div className="grid sm:grid-cols-2 gap-4 mt-5">
        <div>
          <h4 className="text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--success)' }}><CheckCircle2 size={13} /> Strengths</h4>
          {result.strengths.length ? (
            <ul className="space-y-1.5">{result.strengths.map((s, i) => <li key={i} className="text-sm p-2.5 rounded-lg" style={{ background: 'var(--surface-2)' }}>{s}</li>)}</ul>
          ) : <p className="text-xs" style={{ color: 'var(--muted-2)' }}>No standout strengths flagged.</p>}
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--danger)' }}><AlertTriangle size={13} /> Needs attention</h4>
          {result.criticalIssues.length ? (
            <ul className="space-y-1.5">{result.criticalIssues.map((s, i) => <li key={i} className="text-sm p-2.5 rounded-lg" style={{ background: 'var(--surface-2)' }}>{s}</li>)}</ul>
          ) : <p className="text-xs" style={{ color: 'var(--muted-2)' }}>No critical issues detected.</p>}
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold mb-3">Category breakdown</h4>
        <div className="space-y-3">
          {result.categories.map(c => (
            <div key={c.key}>
              <Bar label={c.label} value={c.score} max={100} valueLabel={`${c.score}/100`} color={c.score >= 80 ? 'var(--success)' : c.score >= 65 ? 'var(--warning)' : 'var(--danger)'} />
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {c.observations.map((o, i) => <span key={i} className="chip text-[10px]">{o}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
