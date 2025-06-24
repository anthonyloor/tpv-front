import jsPDF from "jspdf";
import "jspdf-autotable";
import { formatShortDate, formatLongDate } from "./dateUtils";

export const generateSessionsPdf = (sessions, shopName, configData) => {
  try {
    const grouped = {};
    sessions.forEach((s) => {
      const key = formatShortDate(s.date_add);
      if (!grouped[key]) {
        grouped[key] = { date: key, cash: 0, card: 0, bizum: 0 };
      }
      grouped[key].cash += parseFloat(s.total_cash) || 0;
      grouped[key].card += parseFloat(s.total_card) || 0;
      grouped[key].bizum += parseFloat(s.total_bizum) || 0;
    });

    const aggregated = Object.values(grouped).sort((a, b) => {
      const da = a.date.split("-").reverse().join("-");
      const db = b.date.split("-").reverse().join("-");
      return new Date(da) - new Date(db);
    });

    const doc = new jsPDF("p", "pt", "a4");
    const margin = 40;
    let yPos = margin;

    doc.setFontSize(18);
    doc.text(`Reporte de ventas: ${shopName}`, margin, yPos);
    yPos += 20;
    doc.setFontSize(14);
    if (configData?.ticket_text_header_1) {
      doc.text(`${configData.ticket_text_header_1}`, margin, yPos);
      yPos += 25;
    }
    doc.setFontSize(12);

    const tableColumn = [
      "Fecha",
      "Total Efectivo",
      "Total Tarjeta",
      "Total Bizum",
      "Total",
    ];

    const tableRows = aggregated.map((s) => {
      const cash = s.cash;
      const card = s.card;
      const bizum = s.bizum;
      return [
        s.date,
        cash.toFixed(2) + "€",
        card.toFixed(2) + "€",
        bizum.toFixed(2) + "€",
        (cash + card + bizum).toFixed(2) + "€",
      ];
    });

    const totals = aggregated.reduce(
      (acc, s) => {
        acc.cash += s.cash;
        acc.card += s.card;
        acc.bizum += s.bizum;
        return acc;
      },
      { cash: 0, card: 0, bizum: 0 }
    );
    const boldStyle = { fontStyle: "bold" };
    const totalRow = [
      { content: "TOTAL", styles: boldStyle },
      { content: totals.cash.toFixed(2) + "€", styles: boldStyle },
      { content: totals.card.toFixed(2) + "€", styles: boldStyle },
      { content: totals.bizum.toFixed(2) + "€", styles: boldStyle },
      {
        content: (totals.cash + totals.card + totals.bizum).toFixed(2) + "€",
        styles: boldStyle,
      },
    ];
    if (tableRows.length > 0) {
      tableRows.push(totalRow);
    }

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: yPos,
      margin: { left: margin, right: margin },
      styles: { fontSize: 12 },
      theme: "grid",
    });

    const finalY = doc.lastAutoTable.finalY || yPos;
    const generationDate = formatLongDate(new Date());
    doc.text(`Fecha generación reporte: ${generationDate}`, margin, finalY + 30);

    doc.save(`Reporte de Ventas ${shopName}.pdf`);
    return true;
  } catch (error) {
    console.error("Error generating sessions PDF:", error);
    return false;
  }
};

export default generateSessionsPdf;
