"""
PDF report generation for PCOS phenotype results.
Includes AI-powered analysis and personalized diet plan.
"""
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from io import BytesIO
from datetime import datetime


def generate_pdf_report(symptom_log, phenotype_result, ai_explanation="", diet_plan=""):
    """
    Generate a comprehensive PDF report with AI analysis and diet plan.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=letter,
        leftMargin=0.75*inch, rightMargin=0.75*inch,
        topMargin=0.75*inch, bottomMargin=0.75*inch
    )
    styles = getSampleStyleSheet()
    story = []

    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle', parent=styles['Heading1'],
        fontSize=22, textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=6, alignment=1
    )
    
    subtitle_style = ParagraphStyle(
        'SubTitle', parent=styles['Normal'],
        fontSize=10, textColor=colors.HexColor('#999999'),
        alignment=1, spaceAfter=20
    )
    
    heading_style = ParagraphStyle(
        'SectionHead', parent=styles['Heading2'],
        fontSize=14, textColor=colors.HexColor('#ff2d78'),
        spaceBefore=20, spaceAfter=10
    )
    
    body_style = ParagraphStyle(
        'BodyText', parent=styles['Normal'],
        fontSize=10, leading=15,
        textColor=colors.HexColor('#333333'),
        spaceAfter=8
    )
    
    small_style = ParagraphStyle(
        'SmallText', parent=styles['Normal'],
        fontSize=9, textColor=colors.HexColor('#666666'),
        leading=13, spaceAfter=6
    )

    # ===== HEADER =====
    story.append(Paragraph("OvaSense AI", title_style))
    story.append(Paragraph("PCOS Phenotype Assessment Report", subtitle_style))
    story.append(Paragraph(
        f"Generated: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}",
        subtitle_style
    ))
    story.append(Spacer(1, 0.2 * inch))

    # ===== CLASSIFICATION RESULT =====
    story.append(Paragraph("Classification Result", heading_style))
    
    result_data = [
        ['Phenotype:', phenotype_result.phenotype],
        ['Confidence:', f"{phenotype_result.confidence:.1f}%"],
        ['Data Quality:', f"{phenotype_result.data_quality_score or 'N/A'}%"],
        ['Assessment Date:', symptom_log.created_at.strftime('%B %d, %Y')],
    ]
    
    result_table = Table(result_data, colWidths=[1.8*inch, 4.7*inch])
    result_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8f8f8')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1a1a1a')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e0e0e0')),
    ]))
    story.append(result_table)
    story.append(Spacer(1, 0.2 * inch))

    # ===== SYMPTOM DATA =====
    story.append(Paragraph("Symptom Data", heading_style))
    
    symptom_rows = []
    field_labels = {
        'cycle_gap_days': ('Cycle Gap', 'days'),
        'bmi': ('BMI', ''),
        'stress_level': ('Stress Level', '/10'),
        'sleep_hours': ('Sleep Hours', 'hrs'),
        'waist_cm': ('Waist', 'cm'),
    }
    bool_fields = {
        'acne': 'Acne', 'hair_loss': 'Hair Loss', 'facial_hair_growth': 'Facial Hair',
        'dark_patches': 'Dark Patches', 'weight_gain': 'Weight Gain',
        'sugar_cravings': 'Sugar Cravings', 'fatigue_after_meals': 'Post-Meal Fatigue',
        'mood_swings': 'Mood Swings', 'periods_regular': 'Regular Periods',
        'family_diabetes_history': 'Family Diabetes History',
        'thyroid_history': 'Thyroid History', 'heavy_bleeding': 'Heavy Bleeding',
    }
    
    for field, (label, unit) in field_labels.items():
        val = getattr(symptom_log, field, None)
        if val is not None:
            symptom_rows.append([f"{label}:", f"{val} {unit}".strip()])
    
    for field, label in bool_fields.items():
        val = getattr(symptom_log, field, None)
        if val is not None:
            symptom_rows.append([f"{label}:", 'Yes' if val else 'No'])
    
    if symptom_rows:
        # Split into 2 columns
        mid = (len(symptom_rows) + 1) // 2
        col1 = symptom_rows[:mid]
        col2 = symptom_rows[mid:]
        
        # Pad shorter column
        while len(col2) < len(col1):
            col2.append(['', ''])
        
        combined = [[c1[0], c1[1], c2[0], c2[1]] for c1, c2 in zip(col1, col2)]
        
        sym_table = Table(combined, colWidths=[1.5*inch, 1.8*inch, 1.5*inch, 1.8*inch])
        sym_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8f8f8')),
            ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#f8f8f8')),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e0e0e0')),
        ]))
        story.append(sym_table)
    
    story.append(Spacer(1, 0.2 * inch))

    # ===== KEY FACTORS =====
    story.append(Paragraph("Key Contributing Factors", heading_style))
    for i, reason in enumerate(phenotype_result.reasons or [], 1):
        # Clean up emoji for PDF
        clean_reason = reason.replace("⚠️", "[!]")
        story.append(Paragraph(f"{i}. {clean_reason}", body_style))
    
    story.append(Spacer(1, 0.15 * inch))

    # ===== AI ANALYSIS =====
    if ai_explanation and ai_explanation != "AI analysis unavailable. Rule-based classification was used.":
        story.append(Paragraph("AI-Powered Detailed Analysis", heading_style))
        # Split by newlines and render as paragraphs
        for line in ai_explanation.split('\n'):
            line = line.strip()
            if line:
                # Clean markdown-style formatting
                line = line.replace('**', '').replace('##', '').replace('#', '')
                if line.startswith('- '):
                    story.append(Paragraph(f"• {line[2:]}", small_style))
                else:
                    story.append(Paragraph(line, body_style))
        story.append(Spacer(1, 0.15 * inch))

    # ===== DIET PLAN =====
    if diet_plan and diet_plan != "Diet plan generation failed. Please try again.":
        story.append(PageBreak())
        story.append(Paragraph("Personalized Diet Plan", heading_style))
        for line in diet_plan.split('\n'):
            line = line.strip()
            if line:
                line = line.replace('**', '').replace('##', '').replace('#', '')
                if line.startswith('- '):
                    story.append(Paragraph(f"• {line[2:]}", small_style))
                elif line.startswith('* '):
                    story.append(Paragraph(f"• {line[2:]}", small_style))
                else:
                    story.append(Paragraph(line, body_style))
        story.append(Spacer(1, 0.3 * inch))

    # ===== DISCLAIMER =====
    disclaimer_style = ParagraphStyle(
        'Disclaimer', parent=styles['Normal'],
        fontSize=8, textColor=colors.HexColor('#999999'),
        leading=11, spaceBefore=20
    )
    story.append(Paragraph(
        "<b>Disclaimer:</b> This report is generated by OvaSense AI, an educational screening tool. "
        "It is NOT a medical diagnosis. Always consult a qualified healthcare professional "
        "for medical advice, diagnosis, or treatment. Do not disregard professional medical "
        "advice based on this report.",
        disclaimer_style
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer
