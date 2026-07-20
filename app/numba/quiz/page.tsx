'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, RotateCcw, Sparkles, FlaskConical } from 'lucide-react';
import Link from 'next/link';

/* ───── Types ───── */
interface Step {
  id: string;
  question: string;
  options: { emoji: string; label: string; subLabel: string; value: string }[];
}

interface FormulaLine {
  note: string;
  label: string;
  percent: number;
  color: string;
}

/* ───── Quiz steps ───── */
const STEPS: Step[] = [
  {
    id: 'mood',
    question: 'Quelle ambiance vous attire le plus ?',
    options: [
      { emoji: '🌊', label: 'Frais & Aquatique',      subLabel: 'Air marin, agrumes, verts',       value: 'fresh'    },
      { emoji: '🌸', label: 'Floral & Romantique',    subLabel: 'Rose, jasmin, pivoine',            value: 'floral'   },
      { emoji: '🌲', label: 'Boisé & Terreux',        subLabel: 'Cèdre, vétiver, mousse',          value: 'woody'    },
      { emoji: '🔥', label: 'Oriental & Envoûtant',   subLabel: 'Oud, ambre, épices chaudes',      value: 'oriental' },
    ],
  },
  {
    id: 'season',
    question: 'À quelle saison portez-vous ce parfum ?',
    options: [
      { emoji: '🌱', label: 'Printemps',  subLabel: 'Fleurs éclosent, air doux',     value: 'spring' },
      { emoji: '☀️', label: 'Été',        subLabel: 'Chaleur, plage, liberté',       value: 'summer' },
      { emoji: '🍂', label: 'Automne',    subLabel: 'Feuilles, bois, nostalgie',     value: 'autumn' },
      { emoji: '❄️', label: 'Hiver',      subLabel: 'Chaud, chaleureux, profond',    value: 'winter' },
    ],
  },
  {
    id: 'intensity',
    question: 'Quelle intensité recherchez-vous ?',
    options: [
      { emoji: '💨', label: 'Légère',      subLabel: 'Pour le quotidien, subtile',   value: 'light'    },
      { emoji: '🌿', label: 'Moyenne',     subLabel: 'Polyvalente, équilibrée',      value: 'medium'   },
      { emoji: '💎', label: 'Forte',       subLabel: 'Pour les soirées, marquante',  value: 'strong'   },
      { emoji: '🌙', label: 'Très Forte',  subLabel: 'Signature, inoubliable',       value: 'intense'  },
    ],
  },
  {
    id: 'occasion',
    question: 'Pour quelle occasion principalement ?',
    options: [
      { emoji: '👔', label: 'Bureau & Pro',          subLabel: 'Élégant, discret, professionnel', value: 'office'   },
      { emoji: '🎉', label: 'Soirée & Sortie',       subLabel: 'Séduisant, présent, mémorable',   value: 'evening'  },
      { emoji: '🏖️', label: 'Décontracté & W-E',    subLabel: 'Casual, frais, spontané',         value: 'casual'   },
      { emoji: '💑', label: 'Romantique & Intime',   subLabel: 'Envoûtant, sensuel, proche',      value: 'romantic' },
    ],
  },
];

/* ───── Formula generation ───── */
const FILL_MAP: Record<string, number> = {
  light: 20, medium: 30, strong: 38, intense: 45,
};

function generateFormula(answers: Record<string, string>): FormulaLine[] {
  const mood = answers.mood;
  const season = answers.season;
  const intensity = answers.intensity;
  const occasion = answers.occasion;

  // Base note weights per mood
  const weights: Record<string, Record<string, number>> = {
    fresh:    { 'Tête (Agrumes & Verts)': 50, 'Cœur (Aquatique)': 30, 'Fond (Musc Blanc)': 20 },
    floral:   { 'Tête (Bergamote)': 30, 'Cœur (Rose & Jasmin)': 45, 'Fond (Musc Poudré)': 25 },
    woody:    { 'Tête (Poivre Noir)': 25, 'Cœur (Cèdre & Vétiver)': 45, 'Fond (Ambre & Mousse)': 30 },
    oriental: { 'Tête (Épices & Cardamome)': 20, 'Cœur (Rose Oudh)': 35, 'Fond (Oud & Ambre Chaud)': 45 },
  };

  const base = weights[mood] || weights.fresh;

  // Season adjustments (subtle)
  const seasonBonus: Record<string, [string, number]> = {
    spring: ['Cœur (Rose & Jasmin)', 5],
    summer: ['Tête (Agrumes & Verts)', 5],
    autumn: ['Fond (Ambre & Mousse)', 5],
    winter: ['Fond (Oud & Ambre Chaud)', 5],
  };

  // Occasion tweaks
  const occasionBonus: Record<string, [string, number]> = {
    office:   ['Tête (Bergamote)', 3],
    evening:  ['Fond (Oud & Ambre Chaud)', 3],
    casual:   ['Tête (Agrumes & Verts)', 3],
    romantic: ['Cœur (Rose Oudh)', 3],
  };

  const adjusted = { ...base };
  const [sKey, sVal] = seasonBonus[season] ?? ['', 0];
  const [oKey, oVal] = occasionBonus[occasion] ?? ['', 0];

  // Apply adjustments to the first matching key
  const firstKey = Object.keys(adjusted)[0];
  if (sKey && adjusted[sKey] !== undefined) {
    adjusted[sKey] += sVal;
    adjusted[firstKey] = Math.max(5, adjusted[firstKey] - sVal);
  }
  if (oKey && adjusted[oKey] !== undefined) {
    adjusted[oKey] += oVal;
    adjusted[firstKey] = Math.max(5, adjusted[firstKey] - oVal);
  }

  // Normalize to 100%
  const total = Object.values(adjusted).reduce((a, b) => a + b, 0);
  const colors = ['#C5A059', '#7C9B8A', '#8E6B9E', '#5B8DB8'];

  return Object.entries(adjusted).map(([note, pct], i) => ({
    note,
    label: note,
    percent: Math.round((pct / total) * 100),
    color: colors[i % colors.length],
  }));
}

/* ───── Component ───── */
export default function OlfactivQuizPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [direction, setDirection] = useState(1);
  const [done, setDone] = useState(false);

  const step = STEPS[currentStep];
  const fillPercent = FILL_MAP[answers.intensity || 'medium'] ?? 30;
  const formula = done ? generateFormula(answers) : [];

  const selectOption = (value: string) => {
    const newAnswers = { ...answers, [step.id]: value };
    setAnswers(newAnswers);

    if (currentStep < STEPS.length - 1) {
      setDirection(1);
      setTimeout(() => setCurrentStep((s) => s + 1), 100);
    } else {
      setDone(true);
    }
  };

  const goBack = () => {
    if (done) {
      setDone(false);
      return;
    }
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  };

  const restart = () => {
    setAnswers({});
    setCurrentStep(0);
    setDone(false);
    setDirection(1);
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? '60%' : '-60%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (d: number) => ({ x: d > 0 ? '-60%' : '60%', opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gold/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-purple-500/[0.03] blur-[100px]" />
      </div>

      {/* Header bar */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-8 pb-4">
        <button
          onClick={goBack}
          disabled={currentStep === 0 && !done}
          className="flex items-center gap-2 text-foreground/40 hover:text-foreground transition-colors disabled:opacity-20 text-xs uppercase tracking-widest font-mono"
        >
          <ArrowLeft size={14} />
          {done ? 'Modifier' : 'Retour'}
        </button>

        <Link
          href="/numba"
          className="text-[10px] font-mono uppercase tracking-[0.25em] text-foreground/30 hover:text-gold transition-colors"
        >
          [ Numba Lab ]
        </Link>
      </div>

      {/* Progress bar */}
      {!done && (
        <div className="relative z-10 px-6 mb-2">
          <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gold rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Content area */}
      <div className="relative z-10 flex-1 flex flex-col px-6 py-4 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait" custom={direction}>
          {!done ? (
            <motion.div
              key={`step-${currentStep}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col flex-1"
            >
              {/* Step counter */}
              <div className="mb-6">
                <span className="text-5xl font-mono font-bold text-gold/20">
                  {String(currentStep + 1).padStart(2, '0')}
                </span>
                <span className="text-5xl font-mono font-bold text-foreground/10">
                  {' '}/ {String(STEPS.length).padStart(2, '0')}
                </span>
              </div>

              {/* Question */}
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight mb-8">
                {step.question}
              </h1>

              {/* Options grid */}
              <div className="grid grid-cols-2 gap-3 flex-1">
                {step.options.map((opt) => {
                  const selected = answers[step.id] === opt.value;
                  return (
                    <motion.button
                      key={opt.value}
                      onClick={() => selectOption(opt.value)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className={`flex flex-col justify-between p-5 rounded-2xl border text-left transition-all duration-200 ${
                        selected
                          ? 'border-gold bg-gold/10 shadow-[0_0_24px_rgba(197,160,89,0.15)]'
                          : 'border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                      }`}
                    >
                      <span className="text-3xl mb-3 block">{opt.emoji}</span>
                      <div>
                        <p className={`text-sm font-bold mb-1 ${selected ? 'text-gold' : 'text-foreground'}`}>
                          {opt.label}
                        </p>
                        <p className="text-[11px] text-foreground/40 leading-snug">{opt.subLabel}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            /* Result screen */
            <motion.div
              key="result"
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col flex-1"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                  <FlaskConical size={18} className="text-gold" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-mono text-gold">Résultat</p>
                  <h1 className="text-xl font-bold text-foreground">Votre Formule Personnalisée</h1>
                </div>
              </div>

              {/* Formula card */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 mb-5">
                {/* Bottle icon */}
                <div className="flex items-start gap-6 mb-6">
                  <div className="flex-shrink-0">
                    <svg width="54" height="90" viewBox="0 0 54 90" fill="none">
                      <rect x="18" y="2" width="18" height="10" rx="3" fill="#C5A059" opacity="0.3"/>
                      <rect x="8" y="12" width="38" height="72" rx="12" fill="#C5A059" opacity="0.12" stroke="#C5A059" strokeWidth="1.5"/>
                      {/* Liquid fill */}
                      <clipPath id="quiz-bottle-clip">
                        <rect x="9" y="13" width="36" height="70" rx="11"/>
                      </clipPath>
                      <g clipPath="url(#quiz-bottle-clip)">
                        <rect
                          x="9"
                          y={13 + 70 * (1 - fillPercent / 100)}
                          width="36"
                          height={70 * (fillPercent / 100)}
                          fill="#C5A059"
                          opacity="0.35"
                        />
                      </g>
                    </svg>
                  </div>

                  <div className="flex-1">
                    <p className="text-xs text-foreground/40 font-mono uppercase tracking-widest mb-1">
                      Volume recommandé
                    </p>
                    <p className="text-2xl font-bold text-gold">{fillPercent}%</p>
                    <p className="text-xs text-foreground/50 mt-0.5">du flacon</p>
                  </div>
                </div>

                {/* Formula breakdown */}
                <div className="space-y-3">
                  {formula.map((line, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-foreground/70">{line.label}</span>
                        <span className="text-xs font-mono font-bold text-foreground">{line.percent}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${line.percent}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: line.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary pills */}
              <div className="flex flex-wrap gap-2 mb-6">
                {Object.entries(answers).map(([key, val]) => {
                  const stepData = STEPS.find((s) => s.id === key);
                  const opt = stepData?.options.find((o) => o.value === val);
                  return opt ? (
                    <span key={key} className="text-[10px] font-mono px-3 py-1 rounded-full bg-white/5 border border-white/[0.08] text-foreground/50">
                      {opt.emoji} {opt.label}
                    </span>
                  ) : null;
                })}
              </div>

              {/* CTAs */}
              <div className="space-y-3 mt-auto">
                <Link
                  href="/numba/atelier"
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gold text-black font-bold text-sm hover:bg-gold/90 active:scale-[0.98] transition-all"
                >
                  <Sparkles size={15} />
                  Créer cette formule dans l'Atelier
                  <ArrowRight size={15} />
                </Link>
                <button
                  onClick={restart}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 text-xs text-foreground/50 hover:text-foreground hover:border-white/20 transition-all"
                >
                  <RotateCcw size={13} />
                  Recommencer le quiz
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
