import { useState, useEffect } from 'react';
import { classifySymptoms, getHistory, downloadReport } from '../api';
import './Analyse.css';

// ─────────────────────────────────────────────────────────────
// STEP DEFINITIONS
// ─────────────────────────────────────────────────────────────
const STEPS = [
  {
    id: 'cycle', title: 'Menstrual Cycle', fields: [
      { key: 'cycle_gap_days', label: 'Average days between periods', type: 'number', min: 15, max: 120 },
      { key: 'periods_regular', label: 'Are your periods regular?', type: 'boolean' },
      { key: 'longest_cycle_gap_last_year', label: 'Longest gap between periods in last year', type: 'number' },
      { key: 'cycle_irregularity_duration_months', label: 'Months cycles have been irregular', type: 'number' },
      { key: 'spotting_between_periods', label: 'Spotting between periods?', type: 'boolean' },
    ],
  },
  {
    id: 'androgen', title: 'Skin & Hair Signs', fields: [
      { key: 'acne', label: 'Persistent acne?', type: 'boolean' },
      { key: 'acne_duration_months', label: 'Months acne present', type: 'number', condition: d => d.acne === true },
      { key: 'hair_loss', label: 'Hair thinning or loss?', type: 'boolean' },
      { key: 'facial_hair_growth', label: 'Excess facial/body hair?', type: 'boolean' },
      { key: 'dark_patches', label: 'Dark patches on skin?', type: 'boolean' },
    ],
  },
  {
    id: 'metabolic', title: 'Weight & Metabolism', fields: [
      { key: 'bmi', label: 'BMI', type: 'number' },
      { key: 'waist_cm', label: 'Waist circumference (cm)', type: 'number' },
      { key: 'weight_gain', label: 'Unexplained weight gain?', type: 'boolean' },
      { key: 'weight_gain_duration_months', label: 'Months weight gain persisted', type: 'number', condition: d => d.weight_gain === true },
      { key: 'sudden_weight_change', label: 'Sudden weight change (<3 months)?', type: 'boolean' },
      { key: 'sugar_cravings', label: 'Frequent sugar cravings?', type: 'boolean' },
      { key: 'fatigue_after_meals', label: 'Tired after meals?', type: 'boolean' },
      { key: 'family_diabetes_history', label: 'Family history of diabetes?', type: 'boolean' },
    ],
  },
  {
    id: 'lifestyle', title: 'Lifestyle & Stress', fields: [
      { key: 'stress_level', label: 'Stress level (1–10)', type: 'range', min: 1, max: 10 },
      { key: 'sleep_hours', label: 'Sleep hours per night', type: 'number' },
      { key: 'mood_swings', label: 'Mood swings?', type: 'boolean' },
      { key: 'exercise_days_per_week', label: 'Exercise days per week', type: 'number' },
      { key: 'processed_food_intake', label: 'Eat processed food frequently?', type: 'boolean' },
      { key: 'chronic_inflammation_symptoms', label: 'Joint pain / bloating / gut issues?', type: 'boolean' },
    ],
  },
  {
    id: 'fertility', title: 'Fertility', fields: [
      { key: 'trying_to_conceive', label: 'Trying to conceive?', type: 'boolean' },
      { key: 'miscarriages', label: 'Number of miscarriages', type: 'number' },
      { key: 'infertility_years', label: 'Years of infertility', type: 'number' },
    ],
  },
  {
    id: 'history', title: 'Medical History', fields: [
      { key: 'pill_usage', label: 'Using birth control pills?', type: 'boolean' },
      { key: 'thyroid_history', label: 'History of thyroid issues?', type: 'boolean' },
      { key: 'recent_major_stress_event', label: 'Major stress event recently?', type: 'boolean' },
      { key: 'recent_travel_or_illness', label: 'Recent illness or travel?', type: 'boolean' },
    ],
  },
  {
    id: 'redflags', title: 'Safety Check', fields: [
      { key: 'heavy_bleeding', label: 'Excessive bleeding?', type: 'boolean' },
      { key: 'severe_pelvic_pain', label: 'Severe pelvic pain?', type: 'boolean' },
      { key: 'possible_pregnancy', label: 'Possible pregnancy?', type: 'boolean' },
    ],
  },
  {
    id: 'labs', title: 'Optional Lab Tests', fields: [
      { key: 'fasting_glucose', label: 'Fasting glucose', type: 'number' },
      { key: 'fasting_insulin', label: 'Fasting insulin', type: 'number' },
      { key: 'lh_fsh_ratio', label: 'LH/FSH ratio', type: 'number' },
      { key: 'testosterone_level', label: 'Testosterone level', type: 'number' },
      { key: 'amh_level', label: 'AMH level', type: 'number' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// DATA NORMALISATION
// The backend returns a flat object:
//   { phenotype, confidence, reasons, ai_explanation, diet_plan,
//     future_risk_score, mixed_pcos_types, recommended_lab_tests,
//     priority_lifestyle_changes, differential_diagnosis,
//     result_id, symptom_log_id, created_at, ... }
//
// History items may return:
//   { result: { phenotype, confidence, ai_explanation, ... },
//     symptom_log_id, created_at, ... }
//   OR already flat (same shape as above).
//
// normaliseResult() always produces a single flat object with ALL
// fields accessible directly (r.ai_explanation, r.diet_plan, etc.)
// ─────────────────────────────────────────────────────────────
const normaliseResult = (raw) => {
  if (!raw) return null;

  if (raw.result && typeof raw.result === 'object') {
    // Nested: merge top-level metadata INTO the inner result object
    // so fields like ai_explanation and diet_plan (which live on raw.result)
    // are directly accessible, and created_at / symptom_log_id from the
    // outer wrapper are also available.
    const { result, ...outerMeta } = raw;
    return { ...result, ...outerMeta };
  }

  // Already flat – return as-is
  return raw;
};

// ─────────────────────────────────────────────────────────────
// AI TEXT PARSER
// Converts the raw markdown-ish strings from the backend into
// clean React elements. Handles:
//   ## headings / ## - PREFIX headings  → stripped or rendered as <h4>
//   **bold** inline / standalone bold lines
//   - bullet / * bullet / 1. numbered list items
//   plain paragraphs
// ─────────────────────────────────────────────────────────────
const parseAiContent = (raw) => {
  if (!raw || typeof raw !== 'string') return null;

  // Pre-clean: strip lone `## - SECTION TITLE` style sentinel lines
  // that the backend wraps its text with (they're not useful to show)
  const cleaned = raw
    .replace(/^#{1,3}\s*[-–]?\s*(ANALYSIS|DIET PLAN|SUMMARY)\s*$/gim, '')
    .replace(/^-\s*(DIET PLAN|ANALYSIS|SUMMARY)\s*$/gim, '')
    .trim();

  const lines = cleaned.split('\n');
  const elements = [];
  let listBuffer = [];
  let listType = null; // 'ul' | 'ol'

  const flushList = () => {
    if (!listBuffer.length) return;
    const Tag = listType === 'ol' ? 'ol' : 'ul';
    elements.push(
      <Tag key={`list-${elements.length}`} className="ai-list">
        {listBuffer.map((item, i) => (
          <li key={i}>{renderInlineBold(item)}</li>
        ))}
      </Tag>
    );
    listBuffer = [];
    listType = null;
  };

  // Render **bold** inline within a string
  const renderInlineBold = (text) => {
    if (!text.includes('**')) return text;
    const parts = text.split(/\*\*(.+?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 0 ? part : <strong key={i}>{part}</strong>
    );
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    // Skip empty lines (but flush any pending list)
    if (!trimmed) {
      flushList();
      return;
    }

    // Markdown heading: ## Some Title
    const headingMatch = trimmed.match(/^#{1,3}\s+(.+)$/);
    if (headingMatch) {
      flushList();
      const headingText = headingMatch[1].replace(/\*\*/g, '');
      elements.push(
        <h4 key={i} className="ai-heading">{headingText}</h4>
      );
      return;
    }

    // Unordered bullet: - item or * item
    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      if (listType === 'ol') flushList();
      listType = 'ul';
      listBuffer.push(bulletMatch[1]);
      return;
    }

    // Ordered list: 1. item
    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      if (listType === 'ul') flushList();
      listType = 'ol';
      listBuffer.push(orderedMatch[1]);
      return;
    }

    flushList();

    // Standalone bold line (acts as a sub-heading)
    if (/^\*\*[^*]+\*\*:?$/.test(trimmed)) {
      elements.push(
        <p key={i} className="ai-subheading">
          {trimmed.replace(/\*\*/g, '')}
        </p>
      );
      return;
    }

    // Normal paragraph (may have inline bold)
    elements.push(
      <p key={i} className="ai-para">
        {renderInlineBold(trimmed)}
      </p>
    );
  });

  flushList();

  return elements.length > 0 ? elements : null;
};

// ─────────────────────────────────────────────────────────────
// RISK SCORE FORMATTER
// Backend sends 0.12 meaning 12%, or sometimes already 12.
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
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="result-confidence-circle">
      <svg viewBox="0 0 72 72" width="72" height="72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
        <circle
          cx="36" cy="36" r={r}
          fill="none"
          stroke="var(--pink)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <span>{pct.toFixed(0)}%</span>
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
  const [result, setResult] = useState(null);       // fresh result after submit
  const [history, setHistory] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null); // history item being viewed

  useEffect(() => { loadHistory(); }, []);

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
    const required = currentStep.fields.filter(f => !f.condition || f.condition(formData));
    return required.every(f =>
      formData[f.key] !== undefined && formData[f.key] !== null && formData[f.key] !== ''
    );
  };

  const handleNext = () => { if (isLastStep) handleSubmit(); else setStep(s => s + 1); };
  const handleBack = () => { if (step > 0) setStep(s => s - 1); };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await classifySymptoms(formData);
      setResult(normaliseResult(response));
      await loadHistory();
    } catch (e) {
      console.error('Classification error:', e);
      alert('Error submitting data. Please try again.');
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

  // Active display: prefer selectedReport, then fresh result
  const displayData = selectedReport || result;
  const showForm = !displayData;

  // ─────────────────────────────────────────────────────────────
  // RESULT RENDERER  (receives a fully-normalised flat object)
  // ─────────────────────────────────────────────────────────────
  const renderResult = (r) => {
    if (!r) return null;

    const resultId = r.result_id ?? r.id;
    const riskPct  = formatRiskScore(r.future_risk_score);

    const aiParsed   = parseAiContent(r.ai_explanation);
    const dietParsed = parseAiContent(r.diet_plan);

    return (
      <div className="result-view">

        {/* ── Top bar ── */}
        <div className="result-top">
          <h2>Assessment Result</h2>
          <div className="result-top-actions">
            {resultId && (
              <button className="btn btn-secondary" onClick={() => downloadReport(resultId)}>
                📄 Download PDF
              </button>
            )}
            {selectedReport ? (
              <button className="btn btn-secondary" onClick={() => setSelectedReport(null)}>
                ← Back
              </button>
            ) : (
              <button className="btn btn-primary" onClick={startNewAnalysis}>
                + New Analysis
              </button>
            )}
          </div>
        </div>

        {/* ── Classification + Confidence ── */}
        <div className="result-phenotype">
          <div className="result-phenotype-row">
            <div>
              <div className="result-label">Classification</div>
              <div className="result-phenotype-text">{r.phenotype ?? '—'}</div>
            </div>
            <ConfidenceCircle confidence={r.confidence} />
          </div>
        </div>

        {/* ── Key Factors ── */}
        {r.reasons?.length > 0 && (
          <div className="result-reasons">
            <h3>Key Factors</h3>
            <ul>
              {r.reasons.map((reason, i) => <li key={i}>{reason}</li>)}
            </ul>
          </div>
        )}

        {/* ── AI Analysis ── */}
        {aiParsed && (
          <div className="result-section result-ai">
            <h3><span className="section-icon">🧠</span> AI Analysis</h3>
            <div className="ai-content">{aiParsed}</div>
          </div>
        )}

        {/* ── Diet Plan ── */}
        {dietParsed && (
          <div className="result-section result-diet">
            <h3><span className="section-icon">🥗</span> Personalized Diet Plan</h3>
            <div className="ai-content">{dietParsed}</div>
          </div>
        )}

        {/* ── Future Risk ── */}
        {riskPct && (
          <div className="result-section result-risk">
            <h3><span className="section-icon">🔮</span> Future PCOS Risk</h3>
            <div className="risk-score-row">
              <div className="risk-score-bar-wrap">
                <div className="risk-score-bar" style={{ width: `${riskPct}%` }} />
              </div>
              <span className="risk-score-label">{riskPct}%</span>
            </div>

            {r.mixed_pcos_types?.length > 0 && (
              <div className="result-subsection">
                <h4>Possible Mixed Types</h4>
                <ul className="tag-list">
                  {r.mixed_pcos_types.map((t, i) => <li key={i} className="tag">{t}</li>)}
                </ul>
              </div>
            )}

            {r.recommended_lab_tests?.length > 0 && (
              <div className="result-subsection">
                <h4>Recommended Lab Tests</h4>
                <ul className="tag-list">
                  {r.recommended_lab_tests.map((t, i) => <li key={i} className="tag tag-blue">{t}</li>)}
                </ul>
              </div>
            )}

            {r.priority_lifestyle_changes?.length > 0 && (
              <div className="result-subsection">
                <h4>Lifestyle Priorities</h4>
                <ul className="check-list">
                  {r.priority_lifestyle_changes.map((t, i) => (
                    <li key={i}><span className="check-icon">✓</span>{t}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── Differential Notes ── */}
        {r.differential_diagnosis && (
          <div className="result-differential">
            <h3>Differential Notes</h3>
            <p>{r.differential_diagnosis}</p>
          </div>
        )}

        {/* ── Disclaimer ── */}
        <div className="result-disclaimer">
          ⚠️ This is an AI-based screening tool, not a medical diagnosis. Please consult a healthcare professional.
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // HISTORY SIDEBAR HELPERS
  // ─────────────────────────────────────────────────────────────
  const getHistoryMeta = (item) => {
    // item may be flat or nested { result: {...}, created_at, ... }
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
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="analyse-layout">

      {/* ══ Main content ══ */}
      <div className="analyse-main">
        <div className="analyse-inner">

          {showForm ? (
            <>
              <div className="analyse-header">
                <h1>PCOS Analysis</h1>
                <p>Answer the questions below to get your personalized assessment</p>
              </div>

              {/* Progress bar */}
              <div className="progress-bar">
                {STEPS.map((s, i) => (
                  <div key={s.id} className={`progress-step ${i === step ? 'active' : i < step ? 'done' : ''}`}>
                    <div className="progress-dot">{i < step ? '✓' : i + 1}</div>
                    <div className="progress-label">{s.title}</div>
                  </div>
                ))}
              </div>

              {/* Form card */}
              <div className="form-card">
                <h2>{currentStep.title}</h2>
                <div className="form-fields">
                  {currentStep.fields.map(field => {
                    if (field.condition && !field.condition(formData)) return null;
                    return (
                      <div key={field.key} className="field">
                        <label>{field.label}</label>

                        {field.type === 'boolean' && (
                          <div className="toggle-group">
                            <button
                              type="button"
                              className={`toggle-btn yes ${formData[field.key] === true ? 'active' : ''}`}
                              onClick={() => handleChange(field.key, true)}
                            >Yes</button>
                            <button
                              type="button"
                              className={`toggle-btn no ${formData[field.key] === false ? 'active' : ''}`}
                              onClick={() => handleChange(field.key, false)}
                            >No</button>
                          </div>
                        )}

                        {field.type === 'number' && (
                          <input
                            type="number"
                            className="input"
                            value={formData[field.key] ?? ''}
                            min={field.min}
                            max={field.max}
                            onChange={e => handleChange(field.key, e.target.value ? parseFloat(e.target.value) : null)}
                          />
                        )}

                        {field.type === 'range' && (
                          <div className="range-field">
                            <input
                              type="range"
                              className="range-input"
                              min={field.min}
                              max={field.max}
                              value={formData[field.key] ?? field.min}
                              onChange={e => handleChange(field.key, parseInt(e.target.value))}
                            />
                            <span className="range-value">
                              {formData[field.key] ?? field.min} / {field.max}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="form-actions">
                  {step > 0
                    ? <button type="button" className="btn btn-secondary" onClick={handleBack}>← Back</button>
                    : <div />
                  }
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleNext}
                    disabled={!canProceed() || isSubmitting}
                  >
                    {isSubmitting
                      ? <><span className="spinner" /> Analysing…</>
                      : isLastStep ? '🔬 Submit & Analyse' : 'Next →'
                    }
                  </button>
                </div>
              </div>
            </>
          ) : (
            renderResult(displayData)
          )}

        </div>
      </div>

      {/* ══ History sidebar ══ */}
      <div className="analyse-sidebar">
        <div className="sidebar-section-header">
          <h3>Analysis History</h3>
          <button className="btn btn-ghost btn-sm" onClick={startNewAnalysis}>+ New</button>
        </div>

        <div className="history-list">
          {history.length === 0 ? (
            <div className="history-empty">No analyses yet</div>
          ) : (
            history.map((item, idx) => {
              const meta = getHistoryMeta(item);
              const isActive = activeId != null && meta.id != null
                ? String(meta.id) === String(activeId)
                : false;

              return (
                <button
                  key={meta.id ?? idx}
                  className={`history-item ${isActive ? 'active' : ''}`}
                  onClick={() => viewReport(item)}
                >
                  <div className="history-item-top">
                    <span className="history-confidence">{meta.confidence}%</span>
                    <span className="history-date">
                      {meta.date
                        ? new Date(meta.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : ''}
                    </span>
                  </div>
                  <div className="history-phenotype">{meta.phenotype}</div>
                </button>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}