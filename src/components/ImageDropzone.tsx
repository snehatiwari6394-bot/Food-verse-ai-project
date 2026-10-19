import { useRef, useState, type ReactNode } from 'react';
import { Upload, ImageIcon, X } from 'lucide-react';
import { fileToDataUrl } from '@/lib/engine';

export type UploadedImage = { url: string; name: string };

export function ImageDropzone({
  onImage, label = 'Drop an image or click to upload', samples,
}: {
  onImage: (img: UploadedImage) => void;
  label?: string;
  samples?: { url: string; name: string }[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleFile(file: File) {
    const url = await fileToDataUrl(file);
    setPreview(url);
    onImage({ url, name: file.name });
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
        className="rounded-2xl border-2 border-dashed cursor-pointer transition-all p-8 text-center"
        style={{
          borderColor: drag ? 'var(--primary)' : 'var(--border)',
          background: drag ? 'rgba(111,191,115,0.06)' : 'var(--surface)',
        }}
      >
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        {preview ? (
          <div className="relative inline-block">
            <img src={preview} alt="preview" className="max-h-64 rounded-xl mx-auto" />
            <button onClick={e => { e.stopPropagation(); setPreview(null); }} className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <div className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-3" style={{ background: 'var(--surface-2)', color: 'var(--primary)' }}>
              <Upload size={22} />
            </div>
            <p className="font-medium">{label}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-2)' }}>JPG, PNG up to ~8MB</p>
          </>
        )}
      </div>
      {samples && samples.length > 0 && (
        <div className="mt-4">
          <div className="text-xs mb-2 flex items-center gap-1.5" style={{ color: 'var(--muted)' }}><ImageIcon size={12} /> Or try a sample</div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {samples.map(s => (
              <button key={s.url} onClick={() => { setPreview(s.url); onImage(s); }} className="shrink-0 rounded-lg overflow-hidden border hairline hover-lift">
                <img src={s.url} alt={s.name} className="w-20 h-20 object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function PageShell({ title, eyebrow, sub, children, actions }: { title: string; eyebrow?: string; sub?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="max-w-7xl mx-auto px-5 md:px-8 py-10 md:py-14">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          {eyebrow && <div className="text-xs uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--primary)' }}>{eyebrow}</div>}
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">{title}</h1>
          {sub && <p className="mt-2 max-w-2xl" style={{ color: 'var(--muted)' }}>{sub}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
