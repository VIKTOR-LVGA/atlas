#!/usr/bin/env python3
"""Generate deterministic, synthetic Swiss insurance PDFs for ATLAS E2E tests."""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "e2e" / "fixtures"
COMPLETE_PDF = OUTPUT_DIR / "swiss-motor-policy-synthetic.pdf"
INCOMPLETE_PDF = OUTPUT_DIR / "swiss-policy-incomplete-synthetic.pdf"

NAVY = colors.HexColor("#12243A")
BLUE = colors.HexColor("#2563EB")
PALE = colors.HexColor("#EFF6FF")
MUTED = colors.HexColor("#5F6B7A")


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#DCE3EC"))
    canvas.line(20 * mm, 16 * mm, 190 * mm, 16 * mm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(20 * mm, 10 * mm, "Documento sintetico - nessun dato personale reale")
    canvas.drawRightString(190 * mm, 10 * mm, f"Pagina {doc.page}")
    canvas.restoreState()


def styles():
    result = getSampleStyleSheet()
    result.add(
        ParagraphStyle(
            name="AtlasTitle",
            parent=result["Title"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=27,
            textColor=NAVY,
            spaceAfter=5 * mm,
        )
    )
    result.add(
        ParagraphStyle(
            name="AtlasHeading",
            parent=result["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=15,
            textColor=NAVY,
            spaceBefore=4 * mm,
            spaceAfter=2 * mm,
        )
    )
    result.add(
        ParagraphStyle(
            name="AtlasBody",
            parent=result["BodyText"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=14,
            textColor=NAVY,
        )
    )
    result.add(
        ParagraphStyle(
            name="AtlasMeta",
            parent=result["BodyText"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=12,
            textColor=MUTED,
        )
    )
    result.add(
        ParagraphStyle(
            name="AtlasAmount",
            parent=result["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=15,
            alignment=TA_RIGHT,
            textColor=NAVY,
        )
    )
    return result


def table(rows, widths, header=True):
    body_cell = ParagraphStyle(
        "TableBodyCell",
        fontName="Helvetica",
        fontSize=8.2,
        leading=10.5,
        textColor=NAVY,
    )
    header_cell = ParagraphStyle(
        "TableHeaderCell",
        parent=body_cell,
        fontName="Helvetica-Bold",
        textColor=colors.white,
    )
    wrapped_rows = [
        [
            Paragraph(str(value), header_cell if header and row_index == 0 else body_cell)
            for value in row
        ]
        for row_index, row in enumerate(rows)
    ]
    result = Table(
        wrapped_rows,
        colWidths=widths,
        repeatRows=1 if header else 0,
        hAlign="LEFT",
    )
    commands = [
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("LEADING", (0, 0), (-1, -1), 12),
        ("TEXTCOLOR", (0, 0), (-1, -1), NAVY),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#DCE3EC")),
        ("ROWBACKGROUNDS", (0, 1 if header else 0), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]
    if header:
        commands.extend(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ]
        )
    result.setStyle(TableStyle(commands))
    return result


def build_complete():
    s = styles()
    doc = SimpleDocTemplate(
        str(COMPLETE_PDF),
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=19 * mm,
        bottomMargin=23 * mm,
        title="Polizza veicoli sintetica ATLAS",
        author="ATLAS Insurance QA",
        invariant=1,
    )
    story = [
        Paragraph("ALPINA ASSICURAZIONI SA", s["AtlasMeta"]),
        Paragraph("Polizza veicoli a motore", s["AtlasTitle"]),
        Paragraph(
            "DOCUMENTO SINTETICO PER TEST - Tutti i nomi, numeri e importi sono fittizi.",
            ParagraphStyle(
                "Banner",
                parent=s["AtlasBody"],
                fontName="Helvetica-Bold",
                textColor=BLUE,
                backColor=PALE,
                borderColor=BLUE,
                borderWidth=0.5,
                borderPadding=8,
                spaceAfter=5 * mm,
            ),
        ),
        Paragraph("Dati contrattuali", s["AtlasHeading"]),
        table(
            [
                ["Campo", "Valore"],
                ["Contraente", "Mario Testa, Via Esempio 10, 6900 Lugano"],
                ["Numero polizza", "SYN-MOTOR-2026-0001"],
                ["Prodotto", "Auto Privata Completa"],
                ["Veicolo", "Volvo XC40, anno 2024, targa TI 999999"],
                ["Validita", "01.01.2026 - 31.12.2026"],
                ["Rinnovo", "Annuale automatico salvo disdetta"],
                ["Termine di disdetta", "30.09.2026"],
            ],
            [48 * mm, 122 * mm],
        ),
        Paragraph("Premio", s["AtlasHeading"]),
        table(
            [
                ["Voce", "Periodo", "Importo"],
                ["Responsabilita civile", "annuale", "CHF 420.00"],
                ["Casco collisione", "annuale", "CHF 270.00"],
                ["Casco parziale", "annuale", "CHF 120.00"],
                ["Assistenza stradale", "annuale", "CHF 54.00"],
                ["Premio totale lordo", "01.01.2026 - 31.12.2026", "CHF 864.00"],
            ],
            [75 * mm, 55 * mm, 40 * mm],
        ),
        Spacer(1, 3 * mm),
        Paragraph("Frequenza di pagamento: annuale. Importo dovuto: CHF 864.00.", s["AtlasAmount"]),
        PageBreak(),
        Paragraph("Coperture e prestazioni", s["AtlasTitle"]),
        table(
            [
                ["Copertura", "Stato", "Somma / franchigia", "Descrizione"],
                ["Responsabilita civile", "Inclusa", "CHF 100 mio. / CHF 0", "Danni a terzi causati dal veicolo."],
                ["Casco collisione", "Inclusa", "Valore venale maggiorato / CHF 1'000", "Danni da collisione al veicolo assicurato."],
                ["Casco parziale", "Inclusa", "Valore venale maggiorato / CHF 200", "Furto, incendio, grandine, vetri e danni naturali."],
                ["Assistenza stradale CH/Europa", "Inclusa", "Senza franchigia", "Soccorso, traino e rientro del veicolo."],
                ["Protezione giuridica circolazione", "Esclusa", "-", "Non compresa nella presente polizza."],
            ],
            [43 * mm, 20 * mm, 42 * mm, 65 * mm],
        ),
        Paragraph("Esclusioni principali", s["AtlasHeading"]),
        Paragraph(
            "Sono esclusi i danni causati intenzionalmente, la partecipazione a gare non autorizzate, "
            "la guida senza licenza valida e i danni preesistenti. Le condizioni generali prevalgono in caso di divergenza.",
            s["AtlasBody"],
        ),
        Paragraph("Contatti sinistri", s["AtlasHeading"]),
        Paragraph(
            "Alpina Assicurazioni SA (societa fittizia) - sinistri@example.invalid - +41 00 000 00 00",
            s["AtlasBody"],
        ),
    ]
    doc.build(story, onFirstPage=footer, onLaterPages=footer)


def build_incomplete():
    s = styles()
    doc = SimpleDocTemplate(
        str(INCOMPLETE_PDF),
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=19 * mm,
        bottomMargin=23 * mm,
        title="Estratto assicurativo sintetico incompleto ATLAS",
        author="ATLAS Insurance QA",
        invariant=1,
    )
    story = [
        Paragraph("HELVETICA CASA SA", s["AtlasMeta"]),
        Paragraph("Estratto copertura economia domestica", s["AtlasTitle"]),
        Paragraph(
            "DOCUMENTO SINTETICO E INTENZIONALMENTE INCOMPLETO - Non usare come contratto.",
            ParagraphStyle(
                "Warning",
                parent=s["AtlasBody"],
                fontName="Helvetica-Bold",
                textColor=colors.HexColor("#9A3412"),
                backColor=colors.HexColor("#FFF7ED"),
                borderColor=colors.HexColor("#FDBA74"),
                borderWidth=0.5,
                borderPadding=8,
                spaceAfter=5 * mm,
            ),
        ),
        Paragraph("Informazioni disponibili", s["AtlasHeading"]),
        table(
            [
                ["Campo", "Valore"],
                ["Contraente", "Persona Demo, 8000 Zurigo"],
                ["Riferimento", "SYN-HOME-INCOMPLETE-0001"],
                ["Rischio", "Economia domestica"],
                ["Decorrenza indicata", "01.03.2026"],
                ["Copertura menzionata", "Mobilia domestica - somma CHF 80'000"],
            ],
            [52 * mm, 118 * mm],
        ),
        Paragraph("Informazioni mancanti o non verificabili", s["AtlasHeading"]),
        Paragraph(
            "Questo estratto non contiene il premio totale, la frequenza di pagamento, la data di scadenza, "
            "il termine di disdetta, le franchigie, l'elenco completo delle coperture o le condizioni generali. "
            "Qualsiasi importo o copertura ulteriore deve essere marcato come da verificare e non deve essere inventato.",
            s["AtlasBody"],
        ),
        Spacer(1, 8 * mm),
        Paragraph(
            "Fine dell'estratto sintetico. Richiedere la polizza completa prima di prendere decisioni assicurative.",
            s["AtlasMeta"],
        ),
    ]
    doc.build(story, onFirstPage=footer, onLaterPages=footer)


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    build_complete()
    build_incomplete()
    print(COMPLETE_PDF)
    print(INCOMPLETE_PDF)


if __name__ == "__main__":
    main()
