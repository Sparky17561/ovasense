import { useState, useEffect } from 'react';
import { classifySymptoms, getHistory, downloadReport } from '../api';
import { 
    Activity, 
    Calendar, 
    ChevronRight, 
    ChevronLeft, 
    ClipboardList,
    Brain,
    Utensils,
    AlertTriangle,
    FileText,
    CheckCircle,
    Thermometer,
    Download,
    RefreshCw,
    Plus,
    Info,
    X
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// STEP DEFINITIONS
// ─────────────────────────────────────────────────────────────
const STEPS = [
  {
    id: 'cycle', title: 'Menstrual Cycle', icon: <Calendar className="w-5 h-5" />, fields: [
      { key: 'cycle_gap_days', label: 'Average days between periods', type: 'number', min: 15, max: 120, info: "The typical number of days from the start of one period to the start of the next.", isInteger: true },
      { key: 'periods_regular', label: 'Are your periods regular?', type: 'boolean', info: "Do your periods arrive at predictable intervals every month?" },
      { key: 'longest_cycle_gap_last_year', label: 'Longest gap between periods in last year', type: 'number', info: "The maximum number of days you went without a period in the last 12 months.", isInteger: true },
      { key: 'cycle_irregularity_duration_months', label: 'Months cycles have been irregular', type: 'number', info: "How many months you've been experiencing irregular cycles.", isInteger: true },
      { key: 'spotting_between_periods', label: 'Spotting between periods?', type: 'boolean', info: "Light bleeding that occurs outside of your regular period." },
    ],
  },
  {
    id: 'androgen', title: 'Skin & Hair Signs', icon: <Activity className="w-5 h-5" />, fields: [
      { key: 'acne', label: 'Persistent acne?', type: 'boolean', info: "Consistent acne that is difficult to treat, often along the jawline." },
      { key: 'acne_duration_months', label: 'Months acne present', type: 'number', condition: d => d.acne === true, info: "Duration of persistent acne symptoms.", isInteger: true },
      { key: 'hair_loss', label: 'Hair thinning or loss?', type: 'boolean', info: "Thinning on the scalp or widening of the part." },
      { key: 'facial_hair_growth', label: 'Excess facial/body hair?', type: 'boolean', info: "Dark, coarse hair on the face, chin, or chest (Hirsutism)." },
      { key: 'dark_patches', label: 'Dark patches on skin?', type: 'boolean', info: "Velvety dark patches on skin folds like the neck or armpits (Acanthosis Nigricans)." },
    ],
  },
  {
    id: 'metabolic', title: 'Weight & Metabolism', icon: <Activity className="w-5 h-5" />, fields: [
      { key: 'bmi', label: 'BMI', type: 'number', info: "Body Mass Index, a measure of body fat based on height and weight." },
      { key: 'waist_cm', label: 'Waist circumference (cm)', type: 'number', info: "Measurement around your waist at the level of your belly button.", isInteger: true },
      { key: 'weight_gain', label: 'Unexplained weight gain?', type: 'boolean', info: "Significant weight gain without changes in diet or exercise." },
      { key: 'weight_gain_duration_months', label: 'Months weight gain persisted', type: 'number', condition: d => d.weight_gain === true, info: "Duration of unexplained weight gain.", isInteger: true },
      { key: 'sudden_weight_change', label: 'Sudden weight change (<3 months)?', type: 'boolean', info: "Rapid weight change in a short period." },
      { key: 'sugar_cravings', label: 'Frequent sugar cravings?', type: 'boolean', info: "Intense desire for sweets, often due to insulin resistance." },
      { key: 'fatigue_after_meals', label: 'Tired after meals?', type: 'boolean', info: "Feeling extremely tired or sluggish after eating." },
      { key: 'family_diabetes_history', label: 'Family history of diabetes?', type: 'boolean', info: "Immediate family members diagnosed with diabetes." },
    ],
  },
  {
    id: 'lifestyle', title: 'Lifestyle & Stress', icon: <Activity className="w-5 h-5" />, fields: [
      { key: 'stress_level', label: 'Stress level (1–10)', type: 'range', min: 1, max: 10, info: "Your perceived daily stress level (1 = Low, 10 = High)." },
      { key: 'sleep_hours', label: 'Sleep hours per night', type: 'number', info: "Average duration of sleep per night." },
      { key: 'mood_swings', label: 'Mood swings?', type: 'boolean', info: "Rapid or extreme changes in mood, anxiety, or depression." },
      { key: 'exercise_days_per_week', label: 'Exercise days per week', type: 'number', info: "Days per week you engage in at least 30 mins of activity." },
      { key: 'processed_food_intake', label: 'Eat processed food frequently?', type: 'boolean', info: "Regular consumption of packaged, sugary, or fried foods." },
      { key: 'chronic_inflammation_symptoms', label: 'Joint pain / bloating / gut issues?', type: 'boolean', info: "Signs like joint pain, frequent bloating, or digestive issues." },
    ],
  },
  {
    id: 'fertility', title: 'Fertility', icon: <Activity className="w-5 h-5" />, fields: [
      { key: 'trying_to_conceive', label: 'Trying to conceive?', type: 'boolean', info: "Are you actively trying to get pregnant?" },
      { key: 'miscarriages', label: 'Number of miscarriages', type: 'number', info: "Total number of pregnancy losses.", isInteger: true },
      { key: 'infertility_years', label: 'Years of infertility', type: 'number', info: "Duration of difficulty conceiving.", isInteger: true },
    ],
  },
  {
    id: 'history', title: 'Medical History', icon: <ClipboardList className="w-5 h-5" />, fields: [
      { key: 'pill_usage', label: 'Using birth control pills?', type: 'boolean', info: "Current usage of oral contraceptives." },
      { key: 'thyroid_history', label: 'History of thyroid issues?', type: 'boolean', info: "Diagnosed thyroid conditions like Hypothyroidism." },
      { key: 'recent_major_stress_event', label: 'Major stress event recently?', type: 'boolean', info: "Significant life events like job loss, loss of loved one, etc." },
      { key: 'recent_travel_or_illness', label: 'Recent illness or travel?', type: 'boolean', info: "Travel or illness in the last 3 months." },
    ],
  },
  {
    id: 'redflags', title: 'Safety Check', icon: <AlertTriangle className="w-5 h-5" />, fields: [
      { key: 'heavy_bleeding', label: 'Excessive bleeding?', type: 'boolean', info: "Soaking through one or more pads/tampons every hour." },
      { key: 'severe_pelvic_pain', label: 'Severe pelvic pain?', type: 'boolean', info: "Pain that interferes with daily activities." },
      { key: 'possible_pregnancy', label: 'Possible pregnancy?', type: 'boolean', info: "Possibility of current pregnancy." },
    ],
  },
  {
    id: 'labs', title: 'Lab Tests', icon: <Thermometer className="w-5 h-5" />, fields: [
      { key: 'fasting_glucose', label: 'Fasting glucose', type: 'number', info: "Blood sugar level after at least 8 hours of fasting.", optional: true },
      { key: 'fasting_insulin', label: 'Fasting insulin', type: 'number', info: "Insulin level after fasting; helps check for insulin resistance.", optional: true },
      { key: 'lh_fsh_ratio', label: 'LH/FSH ratio', type: 'number', info: "The ratio of Luteinizing Hormone to Follicle Stimulating Hormone.", optional: true },
      { key: 'testosterone_level', label: 'Testosterone level', type: 'number', info: "Level of male hormones (androgens) in your blood.", optional: true },
      { key: 'amh_level', label: 'AMH level', type: 'number', info: "Anti-Mullerian Hormone, reflects your ovarian reserve.", optional: true },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// DATA NORMALISATION
// ─────────────────────────────────────────────────────────────
const normaliseResult = (raw) => {
  if (!raw) return null;
  if (raw.result && typeof raw.result === 'object') {
    const { result, ...outerMeta } = raw;
    return { ...result, ...outerMeta };
  }
  return raw;
};

// ─────────────────────────────────────────────────────────────
// AI TEXT PARSER
// ─────────────────────────────────────────────────────────────
const parseAiContent = (raw) => {
  if (!raw || typeof raw !== 'string') return null;

  const cleaned = raw
    .replace(/^#{1,3}\s*[-–]?\s*(ANALYSIS|DIET PLAN|SUMMARY)\s*$/gim, '')
    .replace(/^-\s*(DIET PLAN|ANALYSIS|SUMMARY)\s*$/gim, '')
    .trim();

  const lines = cleaned.split('\n');
  const elements = [];
  let listBuffer = [];
  let listType = null; 

  const flushList = () => {
    if (!listBuffer.length) return;
    const Tag = listType === 'ol' ? 'ol' : 'ul';
    elements.push(
      <Tag key={`list-${elements.length}`} className="my-3 pl-5 space-y-1 text-gray-300 list-disc marker:text-pink-500">
        {listBuffer.map((item, i) => (
          <li key={i}>{renderInlineBold(item)}</li>
        ))}
      </Tag>
    );
    listBuffer = [];
    listType = null;
  };

  const renderInlineBold = (text) => {
    if (!text.includes('**')) return text;
    const parts = text.split(/\*\*(.+?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 0 ? part : <strong key={i} className="text-white font-semibold">{part}</strong>
    );
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) { flushList(); return; }

    const headingMatch = trimmed.match(/^#{1,3}\s+(.+)$/);
    if (headingMatch) {
      flushList();
      elements.push(<h4 key={i} className="text-lg font-bold text-pink-400 mt-6 mb-3">{headingMatch[1].replace(/\*\*/g, '')}</h4>);
      return;
    }

    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      if (listType === 'ol') flushList();
      listType = 'ul';
      listBuffer.push(bulletMatch[1]);
      return;
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      if (listType === 'ul') flushList();
      listType = 'ol';
      listBuffer.push(orderedMatch[1]);
      return;
    }

    flushList();

    if (/^\*\*[^*]+\*\*:?$/.test(trimmed)) {
      elements.push(<p key={i} className="font-bold text-white mt-4 mb-2">{trimmed.replace(/\*\*/g, '')}</p>);
      return;
    }

    elements.push(<p key={i} className="text-gray-300 leading-relaxed mb-3">{renderInlineBold(trimmed)}</p>);
  });

  flushList();
  return elements.length > 0 ? elements : null;
};

// ─────────────────────────────────────────────────────────────
// RISK SCORE FORMATTER
// ─────────────────────────────────────────────────────────────
const formatRiskScore = (score) => {
  if (score == null) return null;
  const n = parseFloat(score);
  if (isNaN(n)) return null;
  const pct = n > 0 && n <= 1 ? n * 100 : n;
  return pct.toFixed(0);
};

// ─────────────────────────────────────────────────────────────
// CONFIDENCE CIRCLE SVG
// ─────────────────────────────────────────────────────────────
const ConfidenceCircle = ({ confidence }) => {
  const pct = Math.min(100, Math.max(0, parseFloat(confidence) || 0));
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  
  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="relative w-24 h-24">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="48" cy="48" r={r} fill="none" stroke="#222" strokeWidth="8" />
            <circle
              cx="48" cy="48" r={r}
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
             <span className="text-xl font-bold text-white">{pct.toFixed(0)}%</span>
             <span className="text-[8px] text-gray-400 uppercase tracking-widest">Confidence</span>
          </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function Analyse() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null); 
  const [history, setHistory] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null); 
  const [activeTooltip, setActiveTooltip] = useState(null);

  useEffect(() => { loadHistory(); }, []);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeTooltip && !e.target.closest('.info-trigger')) {
        setActiveTooltip(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeTooltip]);

  const loadHistory = async () => {
    try {
      const data = await getHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error loading history:', e);
    }
  };

  const handleChange = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  const canProceed = () => {
    // Check if step is optional? No, checks individual fields
    const required = currentStep.fields.filter(f => (!f.condition || f.condition(formData)) && !f.optional);
    return required.every(f => formData[f.key] !== undefined && formData[f.key] !== null && formData[f.key] !== '');
  };

  const handleNext = () => { if (isLastStep) handleSubmit(); else setStep(s => s + 1); };
  const handleBack = () => { if (step > 0) setStep(s => s - 1); };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Sanitize Data: Convert empty strings/undefined to null or remove them
      const cleanData = Object.fromEntries(
        Object.entries(formData).map(([k, v]) => [k, v === '' || v === undefined ? null : v])
      );
      
      const response = await classifySymptoms(cleanData);
      setResult(normaliseResult(response));
      await loadHistory();
    } catch (e) {
      console.error('Classification error:', e);
      if (e.response && e.response.data) {
        console.error('Server Error Details:', e.response.data);
        alert(`Error: ${JSON.stringify(e.response.data, null, 2)}`);
      } else {
        alert('Error submitting data. Please try again.');
      }
    }
    setIsSubmitting(false);
  };

  const startNewAnalysis = () => {
    setStep(0); setFormData({}); setResult(null); setSelectedReport(null);
  };

  const viewReport = (item) => {
    setSelectedReport(normaliseResult(item));
    setResult(null);
  };

  const displayData = selectedReport || result;
  const showForm = !displayData;

  // ─────────────────────────────────────────────────────────────
  // RESULT RENDERER
  // ─────────────────────────────────────────────────────────────
  const renderResult = (r) => {
    if (!r) return null;

    const resultId = r.result_id ?? r.id;
    // Check multiple possible keys for risk score from backend
    const rawScore = r.future_risk_score ?? r.risk_score ?? r.riskScore; 
    const riskPct  = formatRiskScore(rawScore);
    const aiParsed   = parseAiContent(r.ai_explanation);
    const dietParsed = parseAiContent(r.diet_plan);

    return (
      <div className="flex-1 animate-in fade-in duration-500 pb-12">
        
        {/* Top Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
                 <h2 className="text-2xl font-bold text-white mb-1">Assessment Result</h2>
                 <p className="text-gray-400 text-sm">Generated on {new Date(r.created_at || Date.now()).toLocaleDateString()}</p>
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
                 {selectedReport ? (
                  <button onClick={() => setSelectedReport(null)} className="btn btn-outline flex-1 md:flex-none justify-center items-center gap-2">
                    <ChevronLeft className="w-4 h-4"/> Back
                  </button>
                ) : (
                  <button onClick={startNewAnalysis} className="btn btn-pink flex-1 md:flex-none justify-center items-center gap-2">
                    <Plus className="w-4 h-4"/> New Analysis
                  </button>
                )}
                 {resultId && (
                  <button onClick={() => downloadReport(resultId)} className="btn btn-secondary flex-1 md:flex-none justify-center items-center gap-2">
                    <Download className="w-4 h-4"/> PDF
                  </button>
                )}
            </div>
        </div>

        {/* Hero Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2 bg-gradient-to-br from-[#1a1a1a] to-[#111] border border-[#222] rounded-2xl p-6 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                 
                 <div className="flex items-start justify-between">
                     <div>
                        <span className="text-pink-400 font-medium tracking-wider text-sm uppercase mb-2 block">Primary Classification</span>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 font-['Lora']">
                            {r.phenotype ?? 'Unknown'}
                        </h1>
                        <p className="text-gray-400 max-w-lg mb-6 leading-relaxed">
                            Based on your unique symptom profile, our AI has identified this as the most likely classification.
                        </p>
                     </div>
                     <div className="hidden md:block">
                        <ConfidenceCircle confidence={r.confidence} />
                     </div>
                 </div>

                 {/* Mobile Confidence */}
                 <div className="md:hidden flex justify-center py-4">
                    <ConfidenceCircle confidence={r.confidence} />
                 </div>

                 {r.reasons?.length > 0 && (
                  <div className="bg-[#0a0a0a]/50 rounded-xl p-4 border border-[#333]">
                    <h4 className="text-gray-300 font-semibold mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-pink-500"/> Key Factors
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {r.reasons.map((reason, i) => (
                             <span key={i} className="inline-block px-3 py-1 bg-[#222] border border-[#333] rounded-full text-xs text-gray-300">
                                {reason}
                             </span>
                        ))}
                    </div>
                  </div>
                )}
            </div>

             {/* Risk Score Card */}
            <div className="bg-[#111] border border-[#222] rounded-2xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden">
                {riskPct ? (
                    <>
                        <h3 className="text-gray-400 font-medium mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500"/> Future Risk
                        </h3>
                        <div className="text-5xl font-bold bg-gradient-to-br from-orange-400 to-red-500 bg-clip-text text-transparent mb-2">
                            {riskPct}%
                        </div>
                        <div className="w-full bg-[#222] rounded-full h-2 mb-4 overflow-hidden">
                             <div className="h-full bg-gradient-to-r from-orange-500 to-red-500" style={{ width: `${riskPct}%` }} />
                        </div>
                        <p className="text-xs text-gray-500">Estimated probability based on current metabolic markers.</p>
                    </>
                ) : (
                    <div className="text-gray-500">No risk data available</div>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* AI Analysis */}
            {aiParsed && (
                <div className="bg-[#111] border border-[#222] rounded-2xl p-6 md:p-8">
                     <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#222]">
                         <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Brain className="w-6 h-6 text-purple-400"/>
                         </div>
                         <h3 className="text-xl font-bold text-white">Clinical Insight</h3>
                     </div>
                     <div className="prose prose-invert max-w-none text-gray-300 text-sm md:text-base leading-relaxed">
                        {aiParsed}
                     </div>
                </div>
            )}

            {/* Diet Plan */}
            {dietParsed && (
                <div className="bg-[#111] border border-[#222] rounded-2xl p-6 md:p-8">
                     <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#222]">
                         <div className="p-2 bg-green-500/10 rounded-lg">
                            <Utensils className="w-6 h-6 text-green-400"/>
                         </div>
                         <h3 className="text-xl font-bold text-white">Recommended Nutrition</h3>
                     </div>
                     <div className="prose prose-invert max-w-none text-gray-300 text-sm md:text-base leading-relaxed">
                        {dietParsed}
                     </div>
                </div>
            )}
        </div>

        {/* Actionable Steps & Tests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
             {/* Lifestyle */}
             {r.priority_lifestyle_changes?.length > 0 && (
                <div className="bg-[#111] border border-[#222] rounded-2xl p-6">
                     <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-blue-400"/> Priority Actions
                     </h3>
                     <ul className="space-y-3">
                        {r.priority_lifestyle_changes.map((t, i) => (
                            <li key={i} className="flex items-start gap-3 p-3 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs mt-0.5">✓</span>
                                <span className="text-sm text-gray-300">{t}</span>
                            </li>
                        ))}
                     </ul>
                </div>
             )}

             {/* Lab Tests */}
             {(r.recommended_lab_tests?.length > 0 || r.mixed_pcos_types?.length > 0) && (
                <div className="bg-[#111] border border-[#222] rounded-2xl p-6">
                     {r.mixed_pcos_types?.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-white mb-3">Possible Mixed Types</h3>
                            <div className="flex flex-wrap gap-2">
                                {r.mixed_pcos_types.map((t, i) => <span key={i} className="px-3 py-1.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-lg text-xs font-medium">{t}</span>)}
                            </div>
                        </div>
                     )}
                     
                     {r.recommended_lab_tests?.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-gray-400"/> Recommended Tests
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {r.recommended_lab_tests.map((t, i) => <span key={i} className="px-3 py-1.5 bg-[#222] text-gray-300 border border-[#333] rounded-lg text-xs font-medium">{t}</span>)}
                            </div>
                        </div>
                     )}
                </div>
             )}
        </div>
        
        {/* Disclaimer */}
         <div className="mt-8 p-4 bg-orange-500/5 border border-orange-500/10 rounded-xl flex gap-3">
             <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5"/>
             <p className="text-xs text-orange-400/80 leading-relaxed">
                This analysis is generated by AI based on self-reported symptoms and is for informational purposes only. It is not a medical diagnosis. Please consult a qualified healthcare professional for medical advice.
             </p>
         </div>

      </div>
    );
  };

  const getHistoryMeta = (item) => {
    const r = (item.result && typeof item.result === 'object') ? item.result : item;
    return {
      phenotype:  r.phenotype  ?? 'Pending',
      confidence: r.confidence != null ? parseFloat(r.confidence).toFixed(0) : '—',
      date:       item.created_at ?? r.created_at,
      id:         item.symptom_log_id ?? item.id ?? r.result_id,
    };
  };

  const activeId = displayData ? (displayData.result_id ?? displayData.id ?? displayData.symptom_log_id) : null;

  // ─────────────────────────────────────────────────────────────
  // RENDER MAIN
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#0a0a0a] overflow-hidden">
      
      {/* ══ Main content ══ */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
         <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 lg:max-w-5xl lg:mx-auto w-full">
            
            {showForm ? (
                <div className="max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="mb-8 text-center">
                        <h1 className="text-4xl font-bold font-['Lora'] text-white mb-2">PCOS Analysis</h1>
                        <p className="text-gray-400">Answer a few questions to get your personalized assessment.</p>
                    </div>

                    {/* Progress */}
                    <div className="mb-10">
                        <div className="flex justify-between mb-2">
                            <span className="text-xs text-gray-500 font-medium">Step {step + 1} of {STEPS.length}</span>
                            <span className="text-xs text-pink-500 font-medium capitalize">{currentStep.title}</span>
                        </div>
                        <div className="h-2 bg-[#222] rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-pink-600 to-purple-600 transition-all duration-500 ease-out"
                                style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Form Card */}
                    <div className="bg-[#111] border border-[#222] rounded-2xl p-6 md:p-8 shadow-xl">
                        
                        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-[#222]">
                            <div className="p-3 bg-pink-500/10 rounded-xl text-pink-500">
                                {currentStep.icon}
                            </div>
                            <h2 className="text-xl font-bold text-white">{currentStep.title}</h2>
                        </div>

                        <div className="space-y-6">
                            {currentStep.fields.map(field => {
                                if (field.condition && !field.condition(formData)) return null;
                                return (
                                <div key={field.key} className="animate-in fade-in duration-300">
                                    <div className="flex items-center gap-2 mb-3 ml-1 relative">
                                        <label className="block text-sm font-medium text-gray-300">
                                            {field.label} {field.optional && <span className="text-gray-500 text-xs font-normal">(Optional)</span>}
                                        </label>
                                        {field.info && (
                                            <div className="relative">
                                                <button 
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveTooltip(activeTooltip === field.key ? null : field.key);
                                                    }}
                                                    className="info-trigger text-gray-500 hover:text-pink-400 transition-colors"
                                                >
                                                    <Info className="w-4 h-4" />
                                                </button>
                                                {activeTooltip === field.key && (
                                                    <div className="absolute left-0 bottom-full mb-2 w-64 bg-[#222] border border-[#333] p-3 rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
                                                        <div className="text-xs text-gray-300 leading-relaxed">{field.info}</div>
                                                        <div className="absolute left-2 top-full w-2 h-2 bg-[#222] border-r border-b border-[#333] transform rotate-45 -mt-1"></div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {field.type === 'boolean' && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => handleChange(field.key, true)}
                                                className={`py-3 px-4 rounded-xl border font-medium transition-all ${
                                                    formData[field.key] === true 
                                                    ? 'bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-500/20' 
                                                    : 'bg-[#181818] border-[#333] text-gray-400 hover:border-gray-500 hover:bg-[#222]'
                                                }`}
                                            >
                                                Yes
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleChange(field.key, false)}
                                                className={`py-3 px-4 rounded-xl border font-medium transition-all ${
                                                    formData[field.key] === false 
                                                    ? 'bg-[#222] border-gray-500 text-white' 
                                                    : 'bg-[#181818] border-[#333] text-gray-400 hover:border-gray-500 hover:bg-[#222]'
                                                }`}
                                            >
                                                No
                                            </button>
                                        </div>
                                    )}

                                    {field.type === 'number' && (
                                        <div className="relative">
                                            <input
                                                type="number"
                                                className="w-full bg-[#181818] border border-[#333] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all placeholder-gray-600"
                                                value={formData[field.key] ?? ''}
                                                min={field.min}
                                                max={field.max}
                                                placeholder="Enter value"
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    if (!val) {
                                                        handleChange(field.key, null);
                                                    } else {
                                                        handleChange(field.key, field.isInteger ? parseInt(val, 10) : parseFloat(val));
                                                    }
                                                }}
                                            />
                                        </div>
                                    )}

                                    {field.type === 'range' && (
                                        <div className="bg-[#181818] p-4 rounded-xl border border-[#333]">
                                            <div className="flex justify-between text-xs text-gray-500 mb-2">
                                                <span>Low ({field.min})</span>
                                                <span 
                                                    className="font-bold text-base transition-colors"
                                                    style={{
                                                        color: `hsl(${120 - ((formData[field.key] ?? field.min) * 12)}, 100%, 50%)`
                                                    }}
                                                >
                                                    {formData[field.key] ?? field.min}
                                                </span>
                                                <span>High ({field.max})</span>
                                            </div>
                                            <input
                                                type="range"
                                                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-[#333]"
                                                min={field.min}
                                                max={field.max}
                                                value={formData[field.key] ?? field.min}
                                                onChange={e => handleChange(field.key, parseInt(e.target.value))}
                                                style={{
                                                    backgroundImage: 'linear-gradient(to right, #22c55e, #eab308, #ef4444)',
                                                    backgroundSize: `${((formData[field.key] ?? field.min) - field.min) * 100 / (field.max - field.min)}% 100%`,
                                                    backgroundRepeat: 'no-repeat',
                                                    accentColor: `hsl(${120 - ((formData[field.key] ?? field.min) * 12)}, 100%, 50%)`
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                                );
                            })}
                        </div>
                        
                        <div className="mt-10 pt-6 border-t border-[#222] flex justify-between items-center">
                             {step > 0 ? (
                                <button type="button" onClick={handleBack} className="text-gray-500 hover:text-white font-medium transition-colors flex items-center gap-2">
                                    <ChevronLeft className="w-4 h-4"/> Back
                                </button>
                             ) : <div/>}

                             <button
                                type="button"
                                onClick={handleNext}
                                disabled={!canProceed() || isSubmitting}
                                className={`
                                    flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all
                                    ${!canProceed() || isSubmitting 
                                        ? 'bg-[#222] text-gray-600 cursor-not-allowed' 
                                        : 'bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:opacity-90 hover:shadow-lg hover:shadow-pink-500/20'
                                    }
                                `}
                             >
                                {isSubmitting ? (
                                    <><RefreshCw className="w-5 h-5 animate-spin"/> Analyzing...</>
                                ) : isLastStep ? (
                                    <>Analyze Results <ChevronRight className="w-5 h-5"/></>
                                ) : (
                                    <>Next Step <ChevronRight className="w-5 h-5"/></>
                                )}
                             </button>
                        </div>
                    </div>
                </div>
            ) : (
                renderResult(displayData)
            )}
         </div>
      </div>

      {/* ══ History sidebar ══ */}
      <div className="hidden lg:flex w-80 bg-[#0f0f0f] border-l border-[#222] flex-col h-full">
         <div className="p-6 border-b border-[#222]">
            <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-gray-200">History</h3>
                <button onClick={startNewAnalysis} className="p-2 bg-[#222] hover:bg-[#333] rounded-lg text-gray-400 hover:text-white transition-all" title="New Analysis">
                    <Plus className="w-4 h-4" />
                </button>
            </div>
            <p className="text-xs text-gray-600">Your past assessments</p>
         </div>
         
         <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
            {history.length === 0 ? (
                <div className="text-center py-10 opacity-50">
                    <ClipboardList className="w-8 h-8 mx-auto mb-2 text-gray-600"/>
                    <p className="text-xs text-gray-500">No history yet</p>
                </div>
            ) : (
                history.map((item, idx) => {
                    const meta = getHistoryMeta(item);
                    const isActive = activeId != null && meta.id != null ? String(meta.id) === String(activeId) : false;
                    
                    return (
                        <button
                            key={meta.id ?? idx}
                            onClick={() => viewReport(item)}
                            className={`w-full p-4 rounded-xl text-left border transition-all group ${
                                isActive 
                                ? 'bg-[#1a1a1a] border-pink-500/50 shadow-lg shadow-pink-500/10' 
                                : 'bg-[#111] border-[#222] hover:border-[#444] hover:bg-[#161616]' 
                            }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${isActive ? 'bg-pink-500 text-white' : 'bg-[#222] text-gray-400'}`}>
                                    {meta.confidence}% Confidence
                                </span>
                                <span className="text-[10px] text-gray-500">
                                    {meta.date ? new Date(meta.date).toLocaleDateString() : ''}
                                </span>
                            </div>
                            <h4 className={`font-bold text-sm mb-1 ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                                {meta.phenotype}
                            </h4>
                        </button>
                    )
                })
            )}
         </div>
         
         <div className="p-4 border-t border-[#222]">
             <div className="p-4 bg-gradient-to-br from-pink-900/10 to-purple-900/10 rounded-xl border border-pink-500/10">
                 <h4 className="text-xs font-bold text-pink-400 mb-1">OvaSense AI</h4>
                 <p className="text-[10px] text-gray-500 leading-snug">
                     Your health data is encrypted and secure. We strictly follow privacy guidelines.
                 </p>
             </div>
         </div>
      </div>
    </div>
  );
}