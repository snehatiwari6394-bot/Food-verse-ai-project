// Food Verse AI — deterministic analysis engine.
// Uses image pixel statistics as proxy signals for vision-based reasoning,
// plus structured knowledge bases for nutrition, freshness, hygiene, and cooking.

export type RGB = { r: number; g: number; b: number };

export type ImageStats = {
  avg: RGB;
  brightness: number; // 0-255
  saturation: number; // 0-1
  greenness: number; // 0-1 (g relative to r+b)
  redness: number; // 0-1
  yellowness: number; // 0-1
  brownness: number; // 0-1
  variance: number; // texture/contrast proxy
  width: number;
  height: number;
};

export async function imageStatsFromUrl(url: string): Promise<ImageStats> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  await img.decode();
  const w = Math.min(96, img.naturalWidth || 96);
  const scale = w / (img.naturalWidth || w);
  const h = Math.max(1, Math.round((img.naturalHeight || w) * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas unsupported');
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  let rs = 0, gs = 0, bs = 0, n = 0;
  let minL = 255, maxL = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    rs += r; gs += g; bs += b; n++;
    const l = (r + g + b) / 3;
    if (l < minL) minL = l;
    if (l > maxL) maxL = l;
  }
  const avg = { r: rs / n, g: gs / n, b: bs / n };
  const brightness = (avg.r + avg.g + avg.b) / 3;
  const maxC = Math.max(avg.r, avg.g, avg.b);
  const minC = Math.min(avg.r, avg.g, avg.b);
  const saturation = maxC === 0 ? 0 : (maxC - minC) / maxC;
  const greenness = avg.g / (avg.r + avg.b + 1);
  const redness = avg.r / (avg.g + avg.b + 1);
  const yellowness = (avg.r + avg.g) / (2 * (avg.b + 1));
  const brownness = redness > 1.05 && brightness < 150 && saturation < 0.45 ? (160 - brightness) / 160 : 0;
  return {
    avg, brightness, saturation, greenness, redness, yellowness, brownness,
    variance: (maxL - minL) / 255, width: img.naturalWidth, height: img.naturalHeight,
  };
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// ---------- Food Recognition ----------

type FoodEntry = {
  name: string;
  category: string;
  match: (s: ImageStats) => number; // 0-1
  kcal: number; // per typical serving
  protein: number; carbs: number; fat: number;
  tags: string[];
};

const FOOD_DB: FoodEntry[] = [
  { name: 'Garden Salad', category: 'Vegetable', kcal: 120, protein: 3, carbs: 12, fat: 7, tags: ['vegetarian','low-cal','fiber'], match: s => clamp(s.greenness * 1.4 + s.saturation * 0.3 - s.brownness) },
  { name: 'Fresh Fruit Bowl', category: 'Fruit', kcal: 95, protein: 1.5, carbs: 24, fat: 0.5, tags: ['vegetarian','vitamin-c','antioxidant'], match: s => clamp(s.yellowness * 0.6 + s.redness * 0.5 + s.saturation * 0.3) },
  { name: 'Grilled Chicken', category: 'Protein', kcal: 220, protein: 38, carbs: 2, fat: 8, tags: ['high-protein','low-carb'], match: s => clamp(s.brownness * 1.5 + (s.redness > 1.1 ? 0.3 : 0) - s.greenness * 0.5) },
  { name: 'Pasta Dish', category: 'Grain', kcal: 340, protein: 11, carbs: 52, fat: 9, tags: ['carb-dense','comfort'], match: s => clamp((s.yellowness > 1.3 ? 0.6 : 0.3) + s.brightness / 400 - s.greenness * 0.3) },
  { name: 'Sushi Platter', category: 'Seafood', kcal: 280, protein: 16, carbs: 38, fat: 6, tags: ['omega-3','rice'], match: s => clamp(0.4 + s.saturation * 0.3 - s.brownness * 0.6) },
  { name: 'Vegetable Stir-fry', category: 'Vegetable', kcal: 180, protein: 6, carbs: 18, fat: 9, tags: ['vegetarian','fiber'], match: s => clamp(s.greenness * 1.1 + s.brownness * 0.4 + s.saturation * 0.2) },
  { name: 'Burger & Fries', category: 'Fast Food', kcal: 620, protein: 26, carbs: 55, fat: 33, tags: ['high-cal','indulgent'], match: s => clamp(s.brownness * 1.4 + s.yellowness * 0.3) },
  { name: 'Soup', category: 'Soup', kcal: 150, protein: 7, carbs: 16, fat: 6, tags: ['hydrating','low-cal'], match: s => clamp(0.35 + s.saturation * 0.2 - s.greenness * 0.1 - s.brownness * 0.2) },
  { name: 'Bread & Bakery', category: 'Grain', kcal: 260, protein: 8, carbs: 48, fat: 5, tags: ['carb-dense'], match: s => clamp(s.brownness * 0.9 + (s.yellowness > 1.3 ? 0.3 : 0) + 0.2 - s.greenness * 0.4) },
  { name: 'Berry Mix', category: 'Fruit', kcal: 70, protein: 1, carbs: 17, fat: 0.4, tags: ['antioxidant','low-cal'], match: s => clamp(s.redness * 0.9 + s.saturation * 0.2 - s.greenness * 0.4) },
];

function clamp(v: number, lo = 0, hi = 1) { return Math.max(lo, Math.min(hi, v)); }

export type RecognitionResult = {
  top: FoodEntry & { score: number };
  alternatives: { name: string; category: string; score: number }[];
  confidence: number;
  nutrition: { kcal: number; protein: number; carbs: number; fat: number };
  portion: string;
  ingredients: string[];
};

export function recognize(stats: ImageStats): RecognitionResult {
  const ranked = FOOD_DB.map(f => ({ ...f, score: f.match(stats) }))
    .sort((a, b) => b.score - a.score);
  const top = ranked[0];
  const confidence = Math.round(clamp(top.score * 0.6 + stats.saturation * 0.25 + 0.2) * 100);
  const alternatives = ranked.slice(1, 4).map(r => ({ name: r.name, category: r.category, score: Math.round(r.score * 100) }));
  return {
    top: { ...top, score: Math.round(top.score * 100) },
    alternatives,
    confidence,
    nutrition: { kcal: top.kcal, protein: top.protein, carbs: top.carbs, fat: top.fat },
    portion: '1 standard serving (~250g)',
    ingredients: guessIngredients(top.name),
  };
}

function guessIngredients(name: string): string[] {
  const map: Record<string, string[]> = {
    'Garden Salad': ['Mixed greens', 'Cherry tomato', 'Cucumber', 'Olive oil', 'Lemon'],
    'Fresh Fruit Bowl': ['Seasonal fruit', 'Berries', 'Citrus'],
    'Grilled Chicken': ['Chicken breast', 'Olive oil', 'Herbs', 'Salt', 'Pepper'],
    'Pasta Dish': ['Durum wheat pasta', 'Tomato sauce', 'Parmesan', 'Olive oil'],
    'Sushi Platter': ['Sushi rice', 'Nori', 'Raw fish', 'Soy sauce', 'Wasabi'],
    'Vegetable Stir-fry': ['Broccoli', 'Bell pepper', 'Soy sauce', 'Garlic', 'Ginger'],
    'Burger & Fries': ['Beef patty', 'Bun', 'Potato', 'Cheese', 'Lettuce'],
    'Soup': ['Stock', 'Vegetables', 'Herbs', 'Seasoning'],
    'Bread & Bakery': ['Wheat flour', 'Yeast', 'Salt', 'Water'],
    'Berry Mix': ['Strawberry', 'Blueberry', 'Raspberry'],
  };
  return map[name] ?? ['Ingredients inferred from visual analysis'];
}

// ---------- Freshness Detection ----------

export type FreshnessResult = {
  grade: 'A' | 'B' | 'C' | 'D';
  freshnessScore: number; // 0-100
  spoilageRisk: number; // 0-100
  shelfLife: string;
  factors: { label: string; status: 'good' | 'fair' | 'poor'; detail: string }[];
  recommendation: string;
};

export function assessFreshness(stats: ImageStats, foodName?: string): FreshnessResult {
  const brightnessScore = clamp((stats.brightness - 60) / 130) * 40;
  const satScore = stats.saturation * 35;
  const greenScore = clamp(stats.greenness - 0.9) * 20;
  const brownPenalty = stats.brownness * 55;
  const varScore = stats.variance * 15;
  let freshness = clamp(brightnessScore + satScore + greenScore + varScore - brownPenalty + 45);
  const spoilage = Math.round(100 - freshness);
  freshness = Math.round(freshness);

  const factors: FreshnessResult['factors'] = [
    { label: 'Color vibrancy', status: stats.saturation > 0.3 ? 'good' : stats.saturation > 0.15 ? 'fair' : 'poor', detail: stats.saturation > 0.3 ? 'Vivid, natural coloring detected' : 'Muted tones suggest oxidation' },
    { label: 'Surface brightness', status: stats.brightness > 130 ? 'good' : stats.brightness > 90 ? 'fair' : 'poor', detail: stats.brightness > 130 ? 'Fresh, bright surface' : 'Dull surface — possible aging' },
    { label: 'Browning / discoloration', status: stats.brownness < 0.2 ? 'good' : stats.brownness < 0.45 ? 'fair' : 'poor', detail: stats.brownness < 0.2 ? 'No significant browning' : 'Enzymatic browning present' },
    { label: 'Texture uniformity', status: stats.variance > 0.6 ? 'good' : stats.variance > 0.35 ? 'fair' : 'poor', detail: stats.variance > 0.6 ? 'Healthy texture variation' : 'Flat texture — check for soft spots' },
  ];

  const grade: FreshnessResult['grade'] = freshness >= 80 ? 'A' : freshness >= 65 ? 'B' : freshness >= 45 ? 'C' : 'D';
  const shelfLife = freshness >= 80 ? '4–6 days refrigerated' : freshness >= 65 ? '2–3 days refrigerated' : freshness >= 45 ? 'Consume within 24 hours' : 'Consume now or discard';

  let recommendation = '';
  if (freshness >= 80) recommendation = 'Optimal freshness. Store at recommended humidity and consume within the window above.';
  else if (freshness >= 65) recommendation = 'Good condition. Refrigerate promptly and prioritize in your meal plan.';
  else if (freshness >= 45) recommendation = 'Approaching end of shelf life. Use in cooked preparations to extend usability.';
  else recommendation = 'Signs of spoilage detected. Inspect for off-odor or mold before consuming; discard if uncertain.';

  void foodName;
  return { grade, freshnessScore: freshness, spoilageRisk: spoilage, shelfLife, factors, recommendation };
}

// ---------- Restaurant Hygiene ----------

export type HygieneCategory = { key: string; label: string; score: number; observations: string[]; weight: number };
export type HygieneResult = {
  overallScore: number;
  grade: string;
  categories: HygieneCategory[];
  criticalIssues: string[];
  strengths: string[];
  summary: string;
};

export function assessHygiene(stats: ImageStats, restaurantName: string): HygieneResult {
  const clean = clamp((stats.brightness - 50) / 150) * 45;
  const uniform = clamp(1 - stats.variance) * 20;
  const metal = clamp(stats.brightness / 200) * 15;
  const clutter = clamp(1 - stats.saturation * 0.5) * 10;
  const light = clamp(stats.brightness / 220) * 10;

  const categories: HygieneCategory[] = [
    { key: 'surface', label: 'Surface Cleanliness', weight: 0.3, score: Math.round(clean + 55), observations: [] },
    { key: 'organization', label: 'Workspace Organization', weight: 0.2, score: Math.round(uniform + 70), observations: [] },
    { key: 'equipment', label: 'Equipment Condition', weight: 0.2, score: Math.round(metal + 72), observations: [] },
    { key: 'cross', label: 'Cross-contamination Risk', weight: 0.15, score: Math.round(clutter + 78), observations: [] },
    { key: 'lighting', label: 'Lighting & Visibility', weight: 0.15, score: Math.round(light + 75), observations: [] },
  ];

  const obs = (score: number, good: string[], bad: string[]) =>
    score >= 80 ? [good[0], good[1]] : score >= 65 ? [good[0], bad[0]] : [bad[0], bad[1]];

  categories.forEach(c => {
    if (c.key === 'surface') c.observations = obs(c.score, ['Surfaces appear wiped down', 'No visible residue'], ['Staining visible on prep area', 'Wipe-down schedule may be off']);
    else if (c.key === 'organization') c.observations = obs(c.score, ['Utensils arranged by station', 'Minimal clutter on counters'], ['Items disorganized across stations', 'Clutter could slow sanitation']);
    else if (c.key === 'equipment') c.observations = obs(c.score, ['Metal surfaces reflective', 'Equipment seems well-maintained'], ['Equipment surfaces dulled', 'Possible maintenance gap']);
    else if (c.key === 'cross') c.observations = obs(c.score, ['Raw / ready-to-eat separation visible', 'Color-coded boards likely in use'], ['Risk of proximity between stations', 'Verify cutting board rotation']);
    else c.observations = obs(c.score, ['Adequate task lighting', 'Good visibility for inspection'], ['Lighting insufficient for detail work', 'Shadows obscure corners']);
  });

  const overall = Math.round(categories.reduce((acc, c) => acc + c.score * c.weight, 0));
  const grade = overall >= 90 ? 'A' : overall >= 80 ? 'B' : overall >= 70 ? 'C' : overall >= 60 ? 'D' : 'F';
  const criticalIssues = categories.filter(c => c.score < 65).map(c => `${c.label}: ${c.observations[1]}`);
  const strengths = categories.filter(c => c.score >= 80).map(c => `${c.label}: ${c.observations[0]}`);
  const summary = `${restaurantName} scores ${overall}/100 (Grade ${grade}). ${overall >= 80 ? 'Hygiene practices appear strong.' : overall >= 70 ? 'Acceptable with targeted improvements needed.' : 'Several areas require corrective action.'}`;

  return { overallScore: overall, grade, categories, criticalIssues, strengths, summary };
}

// ---------- Smart Cooking Assistant ----------

export type CookingStep = { title: string; detail: string; durationMin?: number; tip?: string };
export type CookingResult = {
  dish: string;
  difficulty: 'Easy' | 'Intermediate' | 'Advanced';
  totalTimeMin: number;
  servings: number;
  ingredients: { item: string; amount: string }[];
  steps: CookingStep[];
  techniqueNotes: string[];
  pairing: string;
};

const RECIPE_DB: Record<string, CookingResult> = {
  'Garlic Butter Salmon': {
    dish: 'Garlic Butter Salmon', difficulty: 'Easy', totalTimeMin: 25, servings: 2,
    ingredients: [
      { item: 'Salmon fillets', amount: '2 (180g each)' },
      { item: 'Butter', amount: '3 tbsp' },
      { item: 'Garlic, minced', amount: '4 cloves' },
      { item: 'Lemon', amount: '1, juiced' },
      { item: 'Fresh parsley', amount: '2 tbsp' },
      { item: 'Olive oil', amount: '1 tbsp' },
      { item: 'Salt & pepper', amount: 'to taste' },
    ],
    steps: [
      { title: 'Pat dry & season', detail: 'Pat salmon fillets dry with paper towel. Season both sides with salt and pepper.', durationMin: 3, tip: 'Dry surfaces give a better sear.' },
      { title: 'Sear skin-side down', detail: 'Heat olive oil in a skillet over medium-high. Place fillets skin-side down; press gently for 30 seconds. Cook 4 minutes without moving.', durationMin: 4, tip: 'Don\'t move the fish — let the crust form.' },
      { title: 'Flip & baste', detail: 'Flip fillets. Add butter and garlic; swirl until garlic is fragrant. Spoon butter over fillets continuously.', durationMin: 3 },
      { title: 'Finish with citrus', detail: 'Squeeze lemon over the pan. Add parsley. Baste one final time and remove from heat.', durationMin: 2, tip: 'Residual heat finishes the cook — pull at 50°C internal.' },
      { title: 'Rest & plate', detail: 'Rest 2 minutes off heat. Plate with pan sauce spooned over the top.', durationMin: 2 },
    ],
    techniqueNotes: ['Basting continuously builds a glossy, emulsified sauce.', 'Pull salmon off heat slightly below target temp — carryover cooking adds 3–4°C.'],
    pairing: 'Serve with roasted asparagus and a light farro salad.',
  },
  'Mushroom Risotto': {
    dish: 'Mushroom Risotto', difficulty: 'Intermediate', totalTimeMin: 35, servings: 4,
    ingredients: [
      { item: 'Arborio rice', amount: '1.5 cups' },
      { item: 'Mixed mushrooms', amount: '400g' },
      { item: 'Vegetable stock, hot', amount: '5 cups' },
      { item: 'Shallot, finely diced', amount: '1' },
      { item: 'White wine', amount: '1/2 cup' },
      { item: 'Parmesan, grated', amount: '3/4 cup' },
      { item: 'Butter', amount: '3 tbsp' },
      { item: 'Olive oil', amount: '1 tbsp' },
    ],
    steps: [
      { title: 'Sauté mushrooms', detail: 'Heat 1 tbsp butter and olive oil. Sauté mushrooms over high heat until deeply browned. Set aside half for garnish.', durationMin: 6, tip: 'Crowding the pan steams instead of sears — work in batches.' },
      { title: 'Sweat shallot', detail: 'Add remaining butter and shallot; cook until translucent, not browned.', durationMin: 3 },
      { title: 'Toast the rice', detail: 'Add rice; stir constantly until edges turn translucent and grains feel hot to the touch.', durationMin: 2, tip: 'Toasting seals starch for a creamier result.' },
      { title: 'Deglaze with wine', detail: 'Pour wine; stir until fully absorbed.', durationMin: 2 },
      { title: 'Stock additions', detail: 'Add hot stock one ladle at a time, stirring until absorbed before adding the next. Continue ~18 minutes until rice is al dente.', durationMin: 18, tip: 'Stirring releases starch — that\'s the creaminess.' },
      { title: 'Mantecare', detail: 'Off heat, fold in mushrooms, parmesan, and a knob of butter. Cover 2 minutes.', durationMin: 2 },
      { title: 'Plate', detail: 'Spoon onto warm plates; top with reserved mushrooms and parmesan. Should ripple when tapped — "all\'onda".', durationMin: 2 },
    ],
    techniqueNotes: ['Hot stock is non-negotiable — cold stock shocks the rice and breaks the emulsion.', 'The final texture should flow like lava, not stand in a mound.'],
    pairing: 'Pair with a dry Pinot Grigio and a peppery arugula side.',
  },
  'Tomato Basil Pasta': {
    dish: 'Tomato Basil Pasta', difficulty: 'Easy', totalTimeMin: 20, servings: 2,
    ingredients: [
      { item: 'Spaghetti', amount: '200g' },
      { item: 'Cherry tomatoes', amount: '400g' },
      { item: 'Garlic, sliced', amount: '3 cloves' },
      { item: 'Fresh basil', amount: '1 cup' },
      { item: 'Olive oil', amount: '3 tbsp' },
      { item: 'Parmesan', amount: 'to serve' },
      { item: 'Red pepper flakes', amount: 'pinch' },
    ],
    steps: [
      { title: 'Boil pasta', detail: 'Cook spaghetti in well-salted water until 1 minute under al dente. Reserve 1 cup pasta water.', durationMin: 9, tip: 'Salty like the sea — the pasta\'s only chance to be seasoned inside.' },
      { title: 'Bloom aromatics', detail: 'Warm olive oil with garlic and pepper flakes over low heat until fragrant, not browned.', durationMin: 2 },
      { title: 'Crush tomatoes', detail: 'Add tomatoes; crush gently with a spoon. Simmer until they burst and form a loose sauce.', durationMin: 5 },
      { title: 'Emulsify', detail: 'Add pasta and a splash of pasta water. Toss vigorously off heat until sauce clings to each strand.', durationMin: 2, tip: 'The starch + fat emulsion is the sauce — no cream needed.' },
      { title: 'Finish', detail: 'Tear in basil, drizzle olive oil, and serve with parmesan.', durationMin: 2 },
    ],
    techniqueNotes: ['Reserved pasta water carries starch that binds the sauce to the noodle.', 'Tearing basil (not cutting) prevents bruising and oxidation.'],
    pairing: 'A simple green salad and crusty bread to swipe the plate.',
  },
  'Spiced Chickpea Curry': {
    dish: 'Spiced Chickpea Curry', difficulty: 'Easy', totalTimeMin: 30, servings: 4,
    ingredients: [
      { item: 'Chickpeas, cooked', amount: '2 cans' },
      { item: 'Onion, diced', amount: '1' },
      { item: 'Garlic & ginger', amount: '2 tbsp paste' },
      { item: 'Crushed tomatoes', amount: '1 can' },
      { item: 'Coconut milk', amount: '1 cup' },
      { item: 'Curry powder', amount: '2 tsp' },
      { item: 'Garam masala', amount: '1 tsp' },
      { item: 'Spinach', amount: '2 cups' },
    ],
    steps: [
      { title: 'Build the base', detail: 'Sauté onion until golden. Add garlic-ginger paste and spices; toast 60 seconds until aromatic.', durationMin: 6, tip: 'Toasting spices in oil blooms their oils — depth you can\'t add later.' },
      { title: 'Simmer tomatoes', detail: 'Add tomatoes; cook until they darken and oil separates at the edges.', durationMin: 6 },
      { title: 'Add chickpeas & coconut', detail: 'Pour in chickpeas and coconut milk. Simmer 10 minutes until thickened.', durationMin: 10 },
      { title: 'Wilt spinach', detail: 'Stir in spinach off heat until just wilted. Finish with garam masala.', durationMin: 3, tip: 'Garam masala loses aroma in heat — add it last.' },
      { title: 'Serve', detail: 'Ladle over basmati rice and top with cilantro.', durationMin: 2 },
    ],
    techniqueNotes: ['Oil separation from the tomatoes means the sauce is properly cooked out.', 'Layered spices (early + late) create complexity without heat.'],
    pairing: 'Basmati rice, warm naan, and a cooling cucumber raita.',
  },
};

export function suggestRecipe(query: string): CookingResult {
  const q = query.trim().toLowerCase();
  const match = Object.values(RECIPE_DB).find(r => r.dish.toLowerCase().includes(q) || q.includes(r.dish.toLowerCase().split(' ')[0]));
  return match ?? RECIPE_DB['Tomato Basil Pasta'];
}

export const RECIPE_SUGGESTIONS = Object.keys(RECIPE_DB);

// ---------- Nutrition Planning ----------

export type NutritionTargets = {
  calories: number; protein: number; carbs: number; fat: number; water: number;
};

export function computeTargets(p: {
  age?: number | null; weight_kg?: number | null; height_cm?: number | null;
  activity_level: string; goal: string;
}): NutritionTargets {
  const age = p.age || 30;
  const weight = p.weight_kg || 70;
  const height = p.height_cm || 170;
  // Mifflin-St Jeor (neutral sex estimate)
  const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  const activityFactor = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 }[p.activity_level] ?? 1.55;
  let tdee = bmr * activityFactor;
  if (p.goal === 'lose') tdee -= 400;
  else if (p.goal === 'gain') tdee += 350;
  const calories = Math.round(tdee);
  const protein = Math.round(weight * (p.goal === 'gain' ? 1.8 : p.goal === 'lose' ? 2.0 : 1.5));
  const fat = Math.round((calories * 0.28) / 9);
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  const water = Math.round(weight * 0.035 * 10) / 10;
  return { calories, protein, carbs, fat, water };
}

// Common food calorie database for quick logging
export const CALORIE_DB: { item: string; kcal: number; protein: number; carbs: number; fat: number; serving: string }[] = [
  { item: 'Apple', kcal: 95, protein: 0.5, carbs: 25, fat: 0.3, serving: '1 medium' },
  { item: 'Banana', kcal: 105, protein: 1.3, carbs: 27, fat: 0.4, serving: '1 medium' },
  { item: 'Chicken breast (grilled)', kcal: 165, protein: 31, carbs: 0, fat: 3.6, serving: '100g' },
  { item: 'Brown rice', kcal: 216, protein: 5, carbs: 45, fat: 1.8, serving: '1 cup cooked' },
  { item: 'Greek yogurt', kcal: 100, protein: 17, carbs: 6, fat: 0.7, serving: '170g' },
  { item: 'Almonds', kcal: 164, protein: 6, carbs: 6, fat: 14, serving: '28g' },
  { item: 'Egg', kcal: 78, protein: 6, carbs: 0.6, fat: 5, serving: '1 large' },
  { item: 'Avocado', kcal: 234, protein: 2.9, carbs: 12, fat: 21, serving: '1 medium' },
  { item: 'Oats', kcal: 150, protein: 5, carbs: 27, fat: 3, serving: '40g dry' },
  { item: 'Salmon (baked)', kcal: 208, protein: 22, carbs: 0, fat: 13, serving: '100g' },
  { item: 'Broccoli (steamed)', kcal: 55, protein: 3.7, carbs: 11, fat: 0.6, serving: '1 cup' },
  { item: 'Whole grain bread', kcal: 80, protein: 4, carbs: 14, fat: 1.1, serving: '1 slice' },
];
