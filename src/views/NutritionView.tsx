import { useState, useEffect } from 'react';
import { HeartPulse, Plus, Trash2, User, Flame, Activity, Droplets, Apple, Target, Settings2 } from 'lucide-react';
import { PageShell } from '@/components/ImageDropzone';
import { Card, Bar, ScoreRing, Modal, EmptyState } from '@/components/ui';
import { computeTargets, CALORIE_DB, type NutritionTargets } from '@/lib/engine';
import { supabase, type ProfileRow, type NutritionLogRow } from '@/lib/supabase';

export default function NutritionView() {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [logs, setLogs] = useState<NutritionLogRow[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [targets, setTargets] = useState<NutritionTargets | null>(null);

  useEffect(() => { load(); }, []);
  async function load() {
    const { data: p } = await supabase.from('profile').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle();
    if (p) { setProfile(p as ProfileRow); setTargets(computeTargets(p as ProfileRow)); }
    else { setTargets(computeTargets({ activity_level: 'moderate', goal: 'maintain' })); }
    const today = new Date().toISOString().slice(0, 10);
    const { data: l } = await supabase.from('nutrition_logs').select('*').eq('log_date', today).order('created_at', { ascending: false });
    if (l) setLogs(l as NutritionLogRow[]);
  }

  const totals = logs.reduce((a, l) => ({ kcal: a.kcal + l.calories, p: a.p + l.protein_g, c: a.c + l.carbs_g, f: a.f + l.fat_g }), { kcal: 0, p: 0, c: 0, f: 0 });

  async function addLog(item: string, kcal: number, p: number, c: number, f: number, meal: string) {
    const { data } = await supabase.from('nutrition_logs').insert({ item, calories: kcal, protein_g: p, carbs_g: c, fat_g: f, meal }).select().single();
    if (data) setLogs(prev => [data as NutritionLogRow, ...prev]);
    setShowAdd(false);
  }
  async function deleteLog(id: string) { await supabase.from('nutrition_logs').delete().eq('id', id); setLogs(prev => prev.filter(l => l.id !== id)); }
  async function saveProfile(p: ProfileRow) { await supabase.from('profile').upsert(p); setProfile(p); setTargets(computeTargets(p)); setShowProfile(false); }

  if (!targets) return null;

  return (
    <PageShell eyebrow="Module 05 · Personalization" title="Personalized Nutrition" sub="Your profile drives calorie and macro targets. Log meals through the day and track progress against your goals."
      actions={<div className="flex gap-2">
        <button onClick={() => setShowProfile(true)} className="btn-ghost px-3.5 py-2 rounded-lg text-sm inline-flex items-center gap-1.5"><Settings2 size={14} /> Profile</button>
        <button onClick={() => setShowAdd(true)} className="btn-primary px-3.5 py-2 rounded-lg text-sm inline-flex items-center gap-1.5"><Plus size={14} /> Log food</button>
      </div>}>

      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-1"><Target size={16} style={{ color: 'var(--primary)' }} /><span className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Daily targets</span></div>
          <div className="flex items-end gap-2 mt-2">
            <span className="font-display text-5xl font-semibold">{targets.calories}</span>
            <span className="text-sm mb-1.5" style={{ color: 'var(--muted)' }}>kcal / day</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-5">
            <MacroPill icon={<Activity size={14} />} label="Protein" value={targets.protein} unit="g" color="var(--primary)" />
            <MacroPill icon={<Flame size={14} />} label="Carbs" value={targets.carbs} unit="g" color="var(--warning)" />
            <MacroPill icon={<Droplets size={14} />} label="Fat" value={targets.fat} unit="g" color="var(--info)" />
          </div>
          <div className="mt-5 p-4 rounded-xl" style={{ background: 'var(--surface-2)' }}>
            <div className="flex items-center gap-2 text-sm"><Droplets size={15} style={{ color: 'var(--info)' }} /> Suggested hydration</div>
            <div className="font-display text-2xl font-semibold mt-1">{targets.water} <span className="text-sm font-normal" style={{ color: 'var(--muted)' }}>liters</span></div>
          </div>
          <div className="mt-5 pt-5 border-t hairline">
            <div className="text-xs" style={{ color: 'var(--muted)' }}>Profile</div>
            <div className="flex items-center gap-2 mt-1.5 text-sm">
              <User size={14} style={{ color: 'var(--muted)' }} /> {profile?.name ?? 'Default profile'}
              {profile?.goal && <span className="chip text-[10px]">{profile.goal}</span>}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display text-xl font-semibold">Today's intake</h3>
            <div className="flex items-center gap-3">
              <ScoreRing score={Math.min(100, (totals.kcal / targets.calories) * 100)} size={64} label="kcal" />
            </div>
          </div>

          <div className="space-y-3 mb-5">
            <Bar label="Calories" value={totals.kcal} max={targets.calories} valueLabel={`${Math.round(totals.kcal)} / ${targets.calories}`} color="var(--accent)" />
            <Bar label="Protein" value={totals.p} max={targets.protein} valueLabel={`${Math.round(totals.p)} / ${targets.protein}g`} color="var(--primary)" />
            <Bar label="Carbs" value={totals.c} max={targets.carbs} valueLabel={`${Math.round(totals.c)} / ${targets.carbs}g`} color="var(--warning)" />
            <Bar label="Fat" value={totals.f} max={targets.fat} valueLabel={`${Math.round(totals.f)} / ${targets.fat}g`} color="var(--info)" />
          </div>

          <div className="pt-4 border-t hairline">
            <h4 className="text-sm font-semibold mb-3">Logged today</h4>
            {logs.length === 0 ? (
              <EmptyState icon={<Apple size={20} />} title="Nothing logged yet" sub="Tap 'Log food' to add a meal." />
            ) : (
              <div className="space-y-2">
                {logs.map(l => (
                  <div key={l.id} className="flex items-center justify-between p-3 rounded-lg group" style={{ background: 'var(--surface-2)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(111,191,115,0.12)' }}><Apple size={15} style={{ color: 'var(--primary)' }} /></div>
                      <div>
                        <div className="text-sm font-medium">{l.item}</div>
                        <div className="text-xs" style={{ color: 'var(--muted-2)' }}>{l.meal ?? 'Snack'} · {Math.round(l.protein_g)}p {Math.round(l.carbs_g)}c {Math.round(l.fat_g)}f</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-display text-sm font-semibold">{Math.round(l.calories)} <span className="text-xs font-normal" style={{ color: 'var(--muted)' }}>kcal</span></span>
                      <button onClick={() => deleteLog(l.id)} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--muted-2)' }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {showProfile && <ProfileModal profile={profile} onClose={() => setShowProfile(false)} onSave={saveProfile} />}
      {showAdd && <AddFoodModal onClose={() => setShowAdd(false)} onAdd={addLog} />}
    </PageShell>
  );
}

function MacroPill({ icon, label, value, unit, color }: { icon: React.ReactNode; label: string; value: number; unit: string; color: string }) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: 'var(--surface-2)' }}>
      <div className="flex items-center justify-center gap-1 text-xs" style={{ color }}>{icon}<span>{label}</span></div>
      <div className="font-display text-xl font-semibold mt-1">{value}<span className="text-xs ml-0.5 font-normal" style={{ color: 'var(--muted-2)' }}>{unit}</span></div>
    </div>
  );
}

function ProfileModal({ profile, onClose, onSave }: { profile: ProfileRow | null; onClose: () => void; onSave: (p: ProfileRow) => void }) {
  const [form, setForm] = useState({
    name: profile?.name ?? 'You', age: profile?.age ?? 30, weight_kg: profile?.weight_kg ?? 70, height_cm: profile?.height_cm ?? 170,
    activity_level: profile?.activity_level ?? 'moderate', goal: profile?.goal ?? 'maintain',
  });

  return (
    <Modal open onClose={onClose} title="Nutrition profile">
      <div className="space-y-4">
        <Field label="Name"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Age"><input type="number" value={form.age} onChange={e => setForm({ ...form, age: +e.target.value })} className="input" /></Field>
          <Field label="Weight (kg)"><input type="number" value={form.weight_kg} onChange={e => setForm({ ...form, weight_kg: +e.target.value })} className="input" /></Field>
          <Field label="Height (cm)"><input type="number" value={form.height_cm} onChange={e => setForm({ ...form, height_cm: +e.target.value })} className="input" /></Field>
        </div>
        <Field label="Activity level">
          <select value={form.activity_level} onChange={e => setForm({ ...form, activity_level: e.target.value })} className="input">
            <option value="sedentary">Sedentary</option><option value="light">Light</option><option value="moderate">Moderate</option><option value="active">Active</option><option value="very_active">Very active</option>
          </select>
        </Field>
        <Field label="Goal">
          <select value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })} className="input">
            <option value="lose">Lose weight</option><option value="maintain">Maintain</option><option value="gain">Gain muscle</option>
          </select>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-ghost px-4 py-2 rounded-lg text-sm">Cancel</button>
          <button onClick={() => onSave({ ...(profile ?? { id: '', dietary_prefs: [], allergies: [], daily_calorie_target: 2200, updated_at: new Date().toISOString() }), ...form } as ProfileRow)} className="btn-primary px-4 py-2 rounded-lg text-sm">Save profile</button>
        </div>
      </div>
      <style>{`.input{width:100%;border-radius:0.75rem;padding:0.5rem 0.75rem;font-size:0.875rem;border:1px solid var(--border);background:var(--surface-2);color:var(--text)}`}</style>
    </Modal>
  );
}

function AddFoodModal({ onClose, onAdd }: { onClose: () => void; onAdd: (item: string, kcal: number, p: number, c: number, f: number, meal: string) => void }) {
  const [query, setQuery] = useState('');
  const [meal, setMeal] = useState('Snack');
  const filtered = CALORIE_DB.filter(f => f.item.toLowerCase().includes(query.toLowerCase()));
  return (
    <Modal open onClose={onClose} title="Log food">
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search foods…" autoFocus className="w-full rounded-xl px-3.5 py-2.5 text-sm border hairline mb-3" style={{ background: 'var(--surface-2)', color: 'var(--text)' }} />
      <div className="flex gap-2 mb-3">
        {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(m => (
          <button key={m} onClick={() => setMeal(m)} className="px-3 py-1.5 rounded-lg text-xs" style={meal === m ? { background: 'var(--primary)', color: '#06280a', fontWeight: 600 } : { background: 'var(--surface-2)', color: 'var(--muted)', border: '1px solid var(--border)' }}>{m}</button>
        ))}
      </div>
      <div className="max-h-64 overflow-y-auto space-y-1.5">
        {filtered.map(f => (
          <button key={f.item} onClick={() => onAdd(f.item, f.kcal, f.protein, f.carbs, f.fat, meal)}
            className="w-full text-left p-3 rounded-lg flex items-center justify-between hover:bg-[var(--surface-2)]" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div>
              <div className="text-sm font-medium">{f.item}</div>
              <div className="text-xs" style={{ color: 'var(--muted-2)' }}>{f.serving} · {f.protein}p {f.carbs}c {f.fat}f</div>
            </div>
            <span className="font-display font-semibold" style={{ color: 'var(--accent)' }}>{f.kcal} kcal</span>
          </button>
        ))}
        {filtered.length === 0 && <p className="text-sm text-center py-6" style={{ color: 'var(--muted)' }}>No matches. Try another term.</p>}
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs mb-1.5 block" style={{ color: 'var(--muted)' }}>{label}</label>{children}</div>;
}
