import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import axios from "axios";

export async function generatePdf(id, datum) {
  const response = await axios.get(`/api/getPdfData/${id}/${datum}`);
  const data = response.data;

  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([842, 595]); // A4 Landscape
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 40;
  let y = 550;
  const rowHeight = 22;
  const colWidths = [70, 70, 70, 70, 60, 60, 60, 310]; // Buchungsinfo breit

  // --- Text passend machen ---
  function fitText(text, maxWidth, font, size) {
    let t = String(text ?? "");
    while (font.widthOfTextAtSize(t, size) > maxWidth && t.length > 0) {
      t = t.slice(0, -1);
    }
    if (t !== text) t = t.slice(0, -3) + "..."; // "..." wenn abgeschnitten
    return t;
  }

  // --- Logo oben rechts ---
  try {
    const logoUrl = "/logo.png"; // Pfad prüfen!
    const logoBytes = await fetch(logoUrl).then((r) => r.arrayBuffer());
    const logoImg = await pdfDoc.embedPng(logoBytes);

    page.drawImage(logoImg, {
      x: 842 - 150,
      y: 515,
      width: 110,
      height: 45,
    });
  } catch (e) {
    console.warn("Logo konnte nicht geladen werden:", e);
  }

  // --- Titel ---
  page.drawText("Saldenbestätigung", {
    x: margin,
    y: y,
    size: 20,
    font,
  });

  y -= 40;

  const headers = [
    "Datum",
    "Lieferschein",
    "Abholschein",
    "Rechnung",
    "Lieferung ZS",
    "Abholung ZS",
    "Saldo",
    "Buchungsinfo",
  ];

  // --- Fußzeile ---
  function addFooter() {
    page.drawText(`Seite ${pdfDoc.getPageCount()}`, {
      x: 400,
      y: 20,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  // --- Zeile zeichnen ---
  function drawRow(row, isHeader = false, index = 0) {
    let x = margin;
    const fontSize = 9;

    // Alternierende Zeilenfarbe
    if (!isHeader && index % 2 === 1) {
      page.drawRectangle({
        x,
        y: y - rowHeight,
        width: colWidths.reduce((a, b) => a + b),
        height: rowHeight,
        color: rgb(0.93, 0.93, 0.93),
      });
    }

    row.forEach((text, i) => {
      page.drawRectangle({
        x,
        y: y - rowHeight,
        width: colWidths[i],
        height: rowHeight,
        borderColor: rgb(0.2, 0.2, 0.2),
        borderWidth: 1,
      });

      let displayText = String(text ?? "");
      if (i === 7) {
        displayText = fitText(displayText, colWidths[7] - 6, font, fontSize); // Buchungsinfo kürzen
      }

      const textY = y - rowHeight / 2 - fontSize / 2 + 4; // vertikal zentriert
      page.drawText(displayText, {
        x: x + 3,
        y: textY,
        font,
        size: fontSize,
        color: isHeader ? rgb(1, 1, 1) : rgb(0, 0, 0),
      });

      x += colWidths[i];
    });

    y -= rowHeight;

    // Seitenumbruch
    if (y < 60) {
      addFooter();
      page = pdfDoc.addPage([842, 595]);
      y = 550;
    }
  }

  // --- Header ---
  page.drawRectangle({
    x: margin,
    y: y - rowHeight,
    width: colWidths.reduce((a, b) => a + b),
    height: rowHeight,
    color: rgb(0.15, 0.35, 0.65),
  });
  drawRow(headers, true);

  // --- Datenzeilen ---
  data.forEach((item, index) => {
    drawRow(
      [
        item.lieferAbholdatum,
        item.lieferscheinNr,
        item.abholscheinNr,
        item.rechnungsNrZS,
        item.lieferungZS,
        item.abholungZS,
        item.saldo,
        item.buchungsinfo,
      ],
      false,
      index
    );
  });

  addFooter();

  // --- PDF speichern & herunterladen ---
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `report_${id}.pdf`;
  link.click();

  URL.revokeObjectURL(url);
}
