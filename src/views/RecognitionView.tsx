import { useState } from 'react';
import { ScanEye, Apple, Activity, Flame, Droplets, Clock, Tag, History, Trash2 } from 'lucide-react';
import { ImageDropzone, PageShell, type UploadedImage } from '@/components/ImageDropzone';
import { Card, Spinner, SectionHeading, Bar } from '@/components/ui';
import { imageStatsFromUrl, recognize, type RecognitionResult } from '@/lib/engine';
import { supabase, type ScanRow } from '@/lib/supabase';
import { useEffect } from 'react';

const SAMPLES = [
  { url: 'https://images.pexels.com/photos/14457547/pexels-photo-14457547.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', name: 'Gourmet plate' },
  { url: 'https://images.pexels.com/photos/37321079/pexels-photo-37321079.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', name: 'Fresh vegetables' },
  { url: 'https://images.pexels.com/photos/3756523/pexels-photo-3756523.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', name: 'Festive spread' },
];

export default function RecognitionView() {
  const [img, setImg] = useState<UploadedImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ScanRow[]>([]);

  useEffect(() => { loadHistory(); }, []);

  async function loadHistory() {
    const { data } = await supabase.from('scans').select('*').eq('category', 'recognition').order('created_at', { ascending: false }).limit(8);
    if (data) setHistory(data as ScanRow[]);
  }

  async function analyze(image: UploadedImage) {
    setImg(image); setLoading(true); setError(null); setResult(null);
    try {
      const stats = await imageStatsFromUrl(image.url);
      const r = recognize(stats);
      setResult(r);
      await supabase.from('scans').insert({
        category: 'recognition', image_ref: image.url, image_name: image.name,
        payload: r as unknown as Record<string, unknown>, confidence: r.confidence, score: r.top.score,
      });
      loadHistory();
    } catch {
      setError('Could not analyze this image. Try another photo with clearer food items.');
    } finally {
      setLoading(false);
    }
  }

  async function clearHistory() {
    await supabase.from('scans').delete().eq('category', 'recognition');
    setHistory([]);
  }

  return (
    <PageShell eyebrow="Module 01 · Computer Vision" title="Food Recognition" sub="Upload a photo of any dish. The engine identifies the food, estimates calories and macros, and lists likely ingredients — all explained inline.">
      <div className="grid lg:grid-cols-[1fr_1.3fr] gap-6">
        <Card className="p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Input</h3>
          <ImageDropzone onImage={analyze} label="Drop a food photo to analyze" samples={SAMPLES} />
          {error && <p className="mt-4 text-sm p-3 rounded-lg" style={{ background: 'rgba(232,93,93,0.1)', color: 'var(--danger)' }}>{error}</p>}
        </Card>

        <Card className="p-6 min-h-[420px]">
          {!img && !loading && !result && (
            <div className="h-full flex flex-col items-center justify-center text-center py-16" style={{ color: 'var(--muted)' }}>
              <ScanEye size={40} style={{ color: 'var(--border)' }} />
              <p className="mt-3 font-display text-lg" style={{ color: 'var(--muted)' }}>Awaiting analysis</p>
              <p className="text-sm mt-1" style={{ color: 'var(--muted-2)' }}>Results appear here once you upload an image.</p>
            </div>
          )}
          {loading && (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="scanline-wrap rounded-2xl p-8 mb-4">
                <Spinner size={28} />
              </div>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Extracting visual features…</p>
            </div>
          )}
          {result && !loading && <ResultPanel img={img} result={result} />}
        </Card>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-semibold flex items-center gap-2"><History size={18} /> Recent scans</h3>
          {history.length > 0 && <button onClick={clearHistory} className="btn-ghost px-3 py-1.5 rounded-lg text-xs inline-flex items-center gap-1.5"><Trash2 size={12} /> Clear</button>}
        </div>
        {history.length === 0 ? (
          <Card className="p-8 text-center text-sm" style={{ color: 'var(--muted)' }}>No scans yet. Your analysis history will be saved here.</Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {history.map(h => (
              <Card key={h.id} className="overflow-hidden">
                {h.image_ref && <img src={h.image_ref} alt="" className="w-full h-28 object-cover" loading="lazy" />}
                <div className="p-3">
                  <div className="text-xs" style={{ color: 'var(--muted-2)' }}>{new Date(h.created_at).toLocaleDateString()}</div>
                  <div className="font-medium text-sm mt-0.5">{(h.payload as any).top?.name ?? 'Scan'}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="chip" style={{ color: 'var(--primary)' }}>{h.confidence}% confidence</span>
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

function ResultPanel({ img, result }: { img: UploadedImage | null; result: RecognitionResult }) {
  return (
    <div className="anim-fade-up">
      <div className="flex items-start gap-4">
        {img && <img src={img.url} alt="" className="w-24 h-24 rounded-xl object-cover" />}
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--primary)' }}>{result.top.category}</div>
          <h3 className="font-display text-2xl font-semibold">{result.top.name}</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="chip" style={{ color: 'var(--primary)' }}>{result.confidence}% match confidence</span>
            <span className="chip"><Clock size={11} /> {result.portion}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <Stat icon={<Apple size={15} />} label="Calories" value={`${result.nutrition.kcal}`} unit="kcal" color="var(--accent)" />
        <Stat icon={<Activity size={15} />} label="Protein" value={`${result.nutrition.protein}`} unit="g" color="var(--primary)" />
        <Stat icon={<Flame size={15} />} label="Carbs" value={`${result.nutrition.carbs}`} unit="g" color="var(--warning)" />
        <Stat icon={<Droplets size={15} />} label="Fat" value={`${result.nutrition.fat}`} unit="g" color="var(--info)" />
      </div>

      <div className="mt-6 space-y-3">
        <Bar label="Protein" value={result.nutrition.protein} max={60} color="var(--primary)" />
        <Bar label="Carbohydrates" value={result.nutrition.carbs} max={120} color="var(--warning)" />
        <Bar label="Fat" value={result.nutrition.fat} max={40} color="var(--info)" />
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Tag size={14} /> Likely ingredients</h4>
        <div className="flex flex-wrap gap-2">
          {result.ingredients.map(i => <span key={i} className="chip">{i}</span>)}
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold mb-2">Other candidates considered</h4>
        <div className="space-y-2">
          {result.alternatives.map(a => (
            <div key={a.name} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--surface-2)' }}>
              <div>
                <div className="text-sm font-medium">{a.name}</div>
                <div className="text-xs" style={{ color: 'var(--muted-2)' }}>{a.category}</div>
              </div>
              <div className="text-sm font-medium" style={{ color: 'var(--muted)' }}>{a.score}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, unit, color }: { icon: React.ReactNode; label: string; value: string; unit: string; color: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--surface-2)' }}>
      <div className="flex items-center gap-1.5 text-xs" style={{ color }}>
        {icon}<span>{label}</span>
      </div>
      <div className="font-display text-xl font-semibold mt-1">{value}<span className="text-xs ml-1 font-normal" style={{ color: 'var(--muted-2)' }}>{unit}</span></div>
    </div>
  );
}
