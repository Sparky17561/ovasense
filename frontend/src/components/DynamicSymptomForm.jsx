import React, { useState } from 'react';
import './DynamicSymptomForm.css';

const FIELD_CONFIG = {
    // Cycle Details
    cycle_gap_days: { label: "Average days between periods", type: "number", min: 15, max: 90 },
    periods_regular: { label: "Are your periods regular?", type: "boolean" },
    longest_cycle_gap_last_year: { label: "Longest gap between periods in last year (days)", type: "number" },
    cycle_irregularity_duration_months: { label: "How long have cycles been irregular? (months)", type: "number" },

    // Androgen Signs
    acne: { label: "Do you have persistent acne?", type: "boolean" },
    acne_duration_months: { label: "How long have you had acne? (months)", type: "number" },
    hair_loss: { label: "Experiencing hair thinning/loss?", type: "boolean" },
    facial_hair_growth: { label: "Excessive facial or body hair?", type: "boolean" },
    dark_patches: { label: "Dark skin patches (neck/arms)?", type: "boolean" },

    // Metabolic
    bmi: { label: "Body Mass Index (BMI)", type: "number", step: 0.1 },
    waist_cm: { label: "Waist circumference (cm)", type: "number" },
    weight_gain: { label: "Unexplained weight gain?", type: "boolean" },
    weight_gain_duration_months: { label: "How long has weight gain persisted? (months)", type: "number" },
    sudden_weight_change: { label: "Was weight change sudden (<3 months)?", type: "boolean" },
    sugar_cravings: { label: "Frequent sugar cravings?", type: "boolean" },
    fatigue_after_meals: { label: "Feel tired after eating?", type: "boolean" },
    family_diabetes_history: { label: "Family history of diabetes?", type: "boolean" },

    // Lifestyle & Mental
    stress_level: { label: "Stress Level (1-10)", type: "range", min: 1, max: 10 },
    sleep_hours: { label: "Average sleep hours per night", type: "number", step: 0.5 },
    mood_swings: { label: "Frequent mood swings/anxiety?", type: "boolean" },

    // Differential / History
    recent_major_stress_event: { label: "Major stress event in last 3 months?", type: "boolean" },
    thyroid_history: { label: "History of thyroid issues?", type: "boolean" },
    recent_travel_or_illness: { label: "Recent travel or viral illness?", type: "boolean" },
    pill_usage: { label: "Recently used birth control pills?", type: "boolean" },

    // Red Flags
    heavy_bleeding: { label: "Excessive heavy bleeding?", type: "boolean" },
    severe_pelvic_pain: { label: "Severe pelvic pain?", type: "boolean" },
    possible_pregnancy: { label: "Possibility of pregnancy?", type: "boolean" }
};

const DynamicSymptomForm = ({ missingFields, onSubmit }) => {
    const [formData, setFormData] = useState({});

    // Filter fields that actually have config (safety check) and sort by importance
    const visibleFields = missingFields.filter(f => FIELD_CONFIG[f]);

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (visibleFields.length === 0) return null;

    return (
        <div className="dynamic-form-container">
            <div className="form-header">
                <h3>📝 Information Needed</h3>
                <p>Please fill in these details to help Baymax analyze your symptoms accurately.</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    {visibleFields.map(field => {
                        const config = FIELD_CONFIG[field];
                        return (
                            <div key={field} className="form-group">
                                <label>{config.label}</label>

                                {config.type === 'boolean' && (
                                    <div className="btn-group">
                                        <button
                                            type="button"
                                            className={`btn-select ${formData[field] === true ? 'active yes' : ''}`}
                                            onClick={() => handleChange(field, true)}
                                        >
                                            Yes
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn-select ${formData[field] === false ? 'active no' : ''}`}
                                            onClick={() => handleChange(field, false)}
                                        >
                                            No
                                        </button>
                                    </div>
                                )}

                                {config.type === 'number' && (
                                    <input
                                        type="number"
                                        min={config.min || 0}
                                        max={config.max || 300}
                                        step={config.step || 1}
                                        value={formData[field] || ''}
                                        onChange={(e) => handleChange(field, parseFloat(e.target.value))}
                                        placeholder="Enter value..."
                                        required
                                    />
                                )}

                                {config.type === 'range' && (
                                    <div className="range-container">
                                        <input
                                            type="range"
                                            min={config.min}
                                            max={config.max}
                                            value={formData[field] || Math.round((config.max + config.min) / 2)}
                                            onChange={(e) => handleChange(field, parseInt(e.target.value))}
                                        />
                                        <span className="range-value">{formData[field] || '-'}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <button type="submit" className="submit-btn">
                    Submit Updates to Baymax
                </button>
            </form>
        </div>
    );
};

export default DynamicSymptomForm;
