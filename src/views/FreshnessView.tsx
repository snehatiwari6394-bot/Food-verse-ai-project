import { useState, useEffect } from 'react';
import { Leaf, History, Trash2, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { ImageDropzone, PageShell, type UploadedImage } from '@/components/ImageDropzone';
import { Card, Spinner, ScoreRing, StatusPill, EmptyState } from '@/components/ui';
import { imageStatsFromUrl, assessFreshness, type FreshnessResult } from '@/lib/engine';
import { supabase, type ScanRow } from '@/lib/supabase';

const SAMPLES = [
  { url: 'https://images.pexels.com/photos/35974369/pexels-photo-35974369.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', name: 'Produce tray' },
  { url: 'https://images.pexels.com/photos/5622165/pexels-photo-5622165.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', name: 'Veg board' },
  { url: 'https://images.pexels.com/photos/37769505/pexels-photo-37769505.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', name: 'Rustic breakfast' },
];

export default function FreshnessView() {
  const [img, setImg] = useState<UploadedImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FreshnessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ScanRow[]>([]);

  useEffect(() => { loadHistory(); }, []);
  async function loadHistory() {
    const { data } = await supabase.from('scans').select('*').eq('category', 'freshness').order('created_at', { ascending: false }).limit(6);
    if (data) setHistory(data as ScanRow[]);
  }

  async function analyze(image: UploadedImage) {
    setImg(image); setLoading(true); setError(null); setResult(null);
    try {
      const stats = await imageStatsFromUrl(image.url);
      const r = assessFreshness(stats);
      setResult(r);
      await supabase.from('scans').insert({
        category: 'freshness', image_ref: image.url, image_name: image.name,
        payload: r as unknown as Record<string, unknown>, score: r.freshnessScore, confidence: r.spoilageRisk,
      });
      loadHistory();
    } catch {
      setError('Could not analyze this image. Try a clearer, well-lit photo.');
    } finally { setLoading(false); }
  }

  async function clearHistory() {
    await supabase.from('scans').delete().eq('category', 'freshness');
    setHistory([]);
  }

  return (
    <PageShell eyebrow="Module 02 · Quality Intelligence" title="Freshness Detection" sub="Estimate produce quality and spoilage risk from a single photo. The model evaluates color vibrancy, surface brightness, browning, and texture uniformity.">
      <div className="grid lg:grid-cols-[1fr_1.3fr] gap-6">
        <Card className="p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Input</h3>
          <ImageDropzone onImage={analyze} label="Drop a photo of produce or food" samples={SAMPLES} />
          {error && <p className="mt-4 text-sm p-3 rounded-lg" style={{ background: 'rgba(232,93,93,0.1)', color: 'var(--danger)' }}>{error}</p>}
        </Card>

        <Card className="p-6 min-h-[420px]">
          {!img && !loading && !result && (
            <EmptyState icon={<Leaf size={22} />} title="Awaiting input" sub="Upload produce to see a freshness assessment." />
          )}
          {loading && (
            <div className="h-full flex flex-col items-center justify-center">
              <Spinner size={28} /><p className="text-sm mt-3" style={{ color: 'var(--muted)' }}>Sampling surface signals…</p>
            </div>
          )}
          {result && !loading && <FreshnessPanel img={img} result={result} />}
        </Card>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-semibold flex items-center gap-2"><History size={18} /> Recent freshness checks</h3>
          {history.length > 0 && <button onClick={clearHistory} className="btn-ghost px-3 py-1.5 rounded-lg text-xs inline-flex items-center gap-1.5"><Trash2 size={12} /> Clear</button>}
        </div>
        {history.length === 0 ? (
          <Card className="p-8 text-center text-sm" style={{ color: 'var(--muted)' }}>No checks yet.</Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map(h => {
              const r = h.payload as any as FreshnessResult;
              return (
                <Card key={h.id} className="overflow-hidden">
                  {h.image_ref && <img src={h.image_ref} alt="" className="w-full h-28 object-cover" loading="lazy" />}
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs" style={{ color: 'var(--muted-2)' }}>{new Date(h.created_at).toLocaleDateString()}</div>
                      <span className="chip" style={{ color: r.freshnessScore >= 80 ? 'var(--success)' : r.freshnessScore >= 60 ? 'var(--warning)' : 'var(--danger)' }}>Grade {r.grade}</span>
                    </div>
                    <div className="font-medium text-sm mt-1">Freshness {r.freshnessScore}/100</div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}

function FreshnessPanel({ img, result }: { img: UploadedImage | null; result: FreshnessResult }) {
  const gradeColor = result.grade === 'A' ? 'var(--success)' : result.grade === 'B' ? 'var(--primary)' : result.grade === 'C' ? 'var(--warning)' : 'var(--danger)';
  return (
    <div className="anim-fade-up">
      <div className="flex items-start gap-5">
        {img && <img src={img.url} alt="" className="w-28 h-28 rounded-xl object-cover" />}
        <div className="flex-1 flex items-center gap-5">
          <ScoreRing score={result.freshnessScore} label="Fresh" color={gradeColor} />
          <div>
            <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Quality grade</div>
            <div className="font-display text-5xl font-semibold" style={{ color: gradeColor }}>{result.grade}</div>
            <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Spoilage risk: <span style={{ color: 'var(--text)' }}>{result.spoilageRisk}%</span></div>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mt-6">
        <InfoTile icon={<Clock size={15} />} label="Estimated shelf life" value={result.shelfLife} />
        <InfoTile icon={result.grade === 'A' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />} label="Action" value={result.recommendation} />
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold mb-3">Factor breakdown</h4>
        <div className="space-y-2.5">
          {result.factors.map(f => (
            <div key={f.label} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--surface-2)' }}>
              <div className="flex-1">
                <div className="text-sm font-medium">{f.label}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{f.detail}</div>
              </div>
              <StatusPill status={f.status}>{f.status === 'good' ? 'Good' : f.status === 'fair' ? 'Fair' : 'Poor'}</StatusPill>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--surface-2)' }}>
      <div className="text-xs flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>{icon} {label}</div>
      <p className="text-sm mt-1.5 leading-relaxed">{value}</p>
    </div>
  );
}
