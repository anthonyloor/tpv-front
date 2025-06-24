import jsPDF from "jspdf";
import "jspdf-autotable";
import { formatShortDate, formatLongDate } from "./dateUtils";

export const generateSessionsPdf = (sessions, shopName, configData) => {
  try {
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

    const tableRows = sessions.map((s) => {
      const cash = parseFloat(s.total_cash) || 0;
      const card = parseFloat(s.total_card) || 0;
      const bizum = parseFloat(s.total_bizum) || 0;
      return [
        formatShortDate(s.date_add),
        cash.toFixed(2) + "€",
        card.toFixed(2) + "€",
        bizum.toFixed(2) + "€",
        (cash + card + bizum).toFixed(2) + "€",
      ];
    });

    const totals = sessions.reduce(
      (acc, s) => {
        acc.cash += parseFloat(s.total_cash) || 0;
        acc.card += parseFloat(s.total_card) || 0;
        acc.bizum += parseFloat(s.total_bizum) || 0;
        return acc;
      },
      { cash: 0, card: 0, bizum: 0 }
    );
    const totalRow = [
      "TOTAL",
      totals.cash.toFixed(2) + "€",
      totals.card.toFixed(2) + "€",
      totals.bizum.toFixed(2) + "€",
      (totals.cash + totals.card + totals.bizum).toFixed(2) + "€",
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
