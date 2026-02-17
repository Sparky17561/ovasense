import { useState, useEffect } from 'react';
import { classifySymptoms, getHistory, downloadReport } from '../api';
import './Analyse.css';

const STEPS = [
    {
        id: 'cycle',
        title: 'Menstrual Cycle',
        fields: [
            { key: 'cycle_gap_days', label: 'Average days between periods', type: 'number', min: 15, max: 120, placeholder: 'e.g. 28' },
            { key: 'periods_regular', label: 'Are your periods regular?', type: 'boolean' },
            { key: 'longest_cycle_gap_last_year', label: 'Longest gap between periods in the last year (days)', type: 'number', min: 0, max: 365, placeholder: 'e.g. 45' },
            { key: 'cycle_irregularity_duration_months', label: 'How many months have your cycles been irregular?', type: 'number', min: 0, max: 120, placeholder: 'e.g. 6' },
        ]
    },
    {
        id: 'androgen',
        title: 'Skin & Hair Signs',
        fields: [
            { key: 'acne', label: 'Do you have persistent acne?', type: 'boolean' },
            { key: 'acne_duration_months', label: 'How many months have you had acne?', type: 'number', min: 0, max: 120, placeholder: '0', condition: (data) => data.acne === true },
            { key: 'hair_loss', label: 'Are you experiencing hair thinning or loss?', type: 'boolean' },
            { key: 'facial_hair_growth', label: 'Excessive facial or body hair growth?', type: 'boolean' },
            { key: 'dark_patches', label: 'Dark patches on skin (neck, arms, underarms)?', type: 'boolean' },
        ]
    },
    {
        id: 'metabolic',
        title: 'Weight & Metabolism',
        fields: [
            { key: 'bmi', label: 'What is your BMI?', type: 'number', min: 10, max: 60, step: 0.1, placeholder: 'e.g. 24.5' },
            { key: 'waist_cm', label: 'Waist circumference (cm)', type: 'number', min: 40, max: 200, placeholder: 'e.g. 80' },
            { key: 'weight_gain', label: 'Have you had unexplained weight gain?', type: 'boolean' },
            { key: 'weight_gain_duration_months', label: 'How many months has weight gain persisted?', type: 'number', min: 0, max: 120, placeholder: '0', condition: (data) => data.weight_gain === true },
            { key: 'sudden_weight_change', label: 'Was weight change sudden (within 3 months)?', type: 'boolean', condition: (data) => data.weight_gain === true },
            { key: 'sugar_cravings', label: 'Do you have frequent sugar cravings?', type: 'boolean' },
            { key: 'fatigue_after_meals', label: 'Do you feel tired after eating?', type: 'boolean' },
            { key: 'family_diabetes_history', label: 'Any family history of diabetes?', type: 'boolean' },
        ]
    },
    {
        id: 'lifestyle',
        title: 'Lifestyle',
        fields: [
            { key: 'stress_level', label: 'Your stress level', type: 'range', min: 1, max: 10 },
            { key: 'sleep_hours', label: 'Average hours of sleep per night', type: 'number', min: 1, max: 16, step: 0.5, placeholder: 'e.g. 7' },
            { key: 'mood_swings', label: 'Do you experience frequent mood swings?', type: 'boolean' },
            { key: 'pill_usage', label: 'Are you currently using birth control pills?', type: 'boolean' },
            { key: 'trying_to_conceive', label: 'Are you trying to conceive?', type: 'boolean' },
        ]
    },
    {
        id: 'history',
        title: 'Medical History',
        fields: [
            { key: 'recent_major_stress_event', label: 'Major stressful event in the last 3 months?', type: 'boolean' },
            { key: 'thyroid_history', label: 'Any history of thyroid issues?', type: 'boolean' },
            { key: 'recent_travel_or_illness', label: 'Recent illness or travel?', type: 'boolean' },
        ]
    },
    {
        id: 'redflags',
        title: 'Important Safety Check',
        fields: [
            { key: 'heavy_bleeding', label: 'Do you experience excessively heavy bleeding?', type: 'boolean' },
            { key: 'severe_pelvic_pain', label: 'Are you having severe pelvic pain?', type: 'boolean' },
            { key: 'possible_pregnancy', label: 'Is there a possibility of pregnancy?', type: 'boolean' },
            { key: 'spotting_between_periods', label: 'Do you have spotting between periods?', type: 'boolean' },
        ]
    },
];

export default function Analyse() {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const data = await getHistory();
            setHistory(data);
        } catch (e) {
            console.error('Error loading history:', e);
        }
    };

    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const currentStep = STEPS[step];
    const isLastStep = step === STEPS.length - 1;

    const canProceed = () => {
        const requiredFields = currentStep.fields.filter(f => !f.condition || f.condition(formData));
        return requiredFields.every(f => formData[f.key] !== undefined && formData[f.key] !== null && formData[f.key] !== '');
    };

    const handleNext = () => {
        if (isLastStep) {
            handleSubmit();
        } else {
            setStep(s => s + 1);
        }
    };

    const handleBack = () => {
        if (step > 0) setStep(s => s - 1);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const response = await classifySymptoms(formData);
            setResult(response);
            await loadHistory();
        } catch (e) {
            console.error('Classification error:', e);
            alert('Error submitting data. Please try again.');
        }
        setIsSubmitting(false);
    };

    const startNewAnalysis = () => {
        setStep(0);
        setFormData({});
        setResult(null);
        setSelectedReport(null);
    };

    const viewReport = (item) => {
        setSelectedReport(item);
        setResult(null);
    };

    const getPhenotypeStyle = (phenotype) => {
        if (!phenotype) return 'badge-pink';
        if (phenotype.includes('Insulin')) return 'badge-red';
        if (phenotype.includes('Lean')) return 'badge-yellow';
        if (phenotype.includes('Low Risk')) return 'badge-green';
        if (phenotype.includes('Non-PCOS')) return 'badge-green';
        return 'badge-pink';
    };

    // Render result view
    const renderResult = (data, isHistory = false) => {
        const r = isHistory ? data.result : data;
        if (!r) return null;

        const resultId = isHistory ? data.result?.id : data.result_id;

        return (
            <div className="result-view fade-in">
                <div className="result-top">
                    <h2>Assessment Result</h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {resultId && (
                            <a href={downloadReport(resultId)} target="_blank" rel="noreferrer" className="btn btn-pink btn-sm">
                                📄 Download PDF
                            </a>
                        )}
                        {!isHistory && (
                            <button className="btn btn-outline btn-sm" onClick={startNewAnalysis}>
                                + New Analysis
                            </button>
                        )}
                        {isHistory && (
                            <button className="btn btn-outline btn-sm" onClick={() => setSelectedReport(null)}>
                                ← Back
                            </button>
                        )}
                    </div>
                </div>

                <div className="result-phenotype card">
                    <div className="result-phenotype-row">
                        <div>
                            <div className="result-label">Classification</div>
                            <div className="result-phenotype-text">{r.phenotype}</div>
                        </div>
                        <div className="result-confidence-circle">
                            <svg viewBox="0 0 36 36">
                                <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="#222"
                                    strokeWidth="3"
                                />
                                <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="var(--pink)"
                                    strokeWidth="3"
                                    strokeDasharray={`${r.confidence}, 100`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <span>{r.confidence?.toFixed(0)}%</span>
                        </div>
                    </div>
                </div>

                <div className="result-reasons card">
                    <h3>Key Factors</h3>
                    <ul>
                        {r.reasons?.map((reason, i) => (
                            <li key={i}>{reason}</li>
                        ))}
                    </ul>
                </div>

                {/* AI Explanation */}
                {(data.ai_explanation || r.ai_explanation) && (
                    <div className="result-ai card">
                        <h3>🧠 AI Analysis</h3>
                        <div className="ai-content">
                            {(data.ai_explanation || r.ai_explanation)?.split('\n').map((line, i) => {
                                const trimmed = line.trim();
                                if (!trimmed) return null;
                                if (trimmed.startsWith('- ')) return <li key={i}>{trimmed.slice(2)}</li>;
                                return <p key={i}>{trimmed}</p>;
                            })}
                        </div>
                    </div>
                )}

                {/* Diet Plan */}
                {(data.diet_plan || r.diet_plan) && (
                    <div className="result-diet card">
                        <h3>🥗 Personalized Diet Plan</h3>
                        <div className="ai-content">
                            {(data.diet_plan || r.diet_plan)?.split('\n').map((line, i) => {
                                const trimmed = line.trim();
                                if (!trimmed) return null;
                                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) return <li key={i}>{trimmed.slice(2)}</li>;
                                return <p key={i}>{trimmed}</p>;
                            })}
                        </div>
                    </div>
                )}

                {r.differential_diagnosis && (
                    <div className="result-differential card">
                        <h3>Differential Notes</h3>
                        <p>{r.differential_diagnosis}</p>
                    </div>
                )}

                <div className="result-disclaimer">
                    ⚠️ This is an AI-based screening tool, not a medical diagnosis. Please consult a healthcare professional.
                </div>
            </div>
        );
    };

    return (
        <div className="analyse-layout">
            {/* Main Form Area */}
            <div className="analyse-main">
                <div className="page-container">
                    {!result && !selectedReport ? (
                        <>
                            <div className="page-header">
                                <h1>PCOS Analysis</h1>
                                <p>Answer the questions below to get your personalized assessment</p>
                            </div>

                            {/* Progress Bar */}
                            <div className="progress-bar">
                                {STEPS.map((s, i) => (
                                    <div key={s.id} className={`progress-step ${i <= step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
                                        <div className="progress-dot">{i < step ? '✓' : i + 1}</div>
                                        <span className="progress-label">{s.title}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Form Card */}
                            <div className="form-card card fade-in" key={step}>
                                <h2>{currentStep.title}</h2>
                                <div className="form-fields">
                                    {currentStep.fields.map(field => {
                                        // Skip fields with unmet conditions
                                        if (field.condition && !field.condition(formData)) return null;

                                        return (
                                            <div key={field.key} className="field">
                                                <label>{field.label}</label>

                                                {field.type === 'boolean' && (
                                                    <div className="toggle-group">
                                                        <button
                                                            type="button"
                                                            className={`toggle-btn ${formData[field.key] === true ? 'active yes' : ''}`}
                                                            onClick={() => handleChange(field.key, true)}
                                                        >Yes</button>
                                                        <button
                                                            type="button"
                                                            className={`toggle-btn ${formData[field.key] === false ? 'active no' : ''}`}
                                                            onClick={() => handleChange(field.key, false)}
                                                        >No</button>
                                                    </div>
                                                )}

                                                {field.type === 'number' && (
                                                    <input
                                                        className="input"
                                                        type="number"
                                                        min={field.min}
                                                        max={field.max}
                                                        step={field.step || 1}
                                                        value={formData[field.key] ?? ''}
                                                        onChange={e => handleChange(field.key, e.target.value ? parseFloat(e.target.value) : null)}
                                                        placeholder={field.placeholder}
                                                    />
                                                )}

                                                {field.type === 'range' && (
                                                    <div className="range-field">
                                                        <input
                                                            type="range"
                                                            min={field.min}
                                                            max={field.max}
                                                            value={formData[field.key] ?? 5}
                                                            onChange={e => handleChange(field.key, parseInt(e.target.value))}
                                                            className="range-input"
                                                        />
                                                        <span className="range-value">{formData[field.key] ?? '-'} / {field.max}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="form-actions">
                                    {step > 0 && (
                                        <button className="btn btn-outline" onClick={handleBack}>
                                            ← Back
                                        </button>
                                    )}
                                    <button
                                        className="btn btn-pink"
                                        onClick={handleNext}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <><div className="spinner"></div> Analysing...</>
                                        ) : isLastStep ? (
                                            '🔬 Submit & Analyse'
                                        ) : (
                                            'Next →'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : selectedReport ? (
                        renderResult(selectedReport, true)
                    ) : (
                        renderResult(result, false)
                    )}
                </div>
            </div>

            {/* History Sidebar */}
            <div className="analyse-sidebar">
                <div className="sidebar-section-header">
                    <h3>Analysis History</h3>
                    <button className="btn btn-pink btn-sm" onClick={startNewAnalysis}>
                        + New
                    </button>
                </div>
                <div className="history-list">
                    {history.length === 0 ? (
                        <div className="history-empty">
                            <p>No analyses yet</p>
                        </div>
                    ) : (
                        history.map(item => (
                            <button
                                key={item.id}
                                className={`history-item ${selectedReport?.id === item.id ? 'active' : ''}`}
                                onClick={() => viewReport(item)}
                            >
                                <div className="history-item-top">
                                    <span className={`badge ${getPhenotypeStyle(item.result?.phenotype)}`}>
                                        {item.result?.phenotype || 'Pending'}
                                    </span>
                                    <span className="history-confidence">
                                        {item.result?.confidence?.toFixed(0)}%
                                    </span>
                                </div>
                                <div className="history-date">
                                    {new Date(item.created_at).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
