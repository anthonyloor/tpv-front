import jsPDF from "jspdf";
import "jspdf-autotable";

export const generateSalesPdf = (data, shopName) => {
  try {
    const doc = new jsPDF("p", "pt", "a4");
    const margin = 40;
    let yPos = margin;
    doc.setFontSize(18);
    doc.text(`Reporte de ventas: ${shopName}`, margin, yPos);
    yPos += 25;
    doc.setFontSize(12);
    doc.text(
      `Fecha generación reporte: ${new Date().toLocaleString()}`,
      margin,
      yPos
    );
    yPos += 30;

    // Procesar líneas de productos a partir de cada orden
    const productLines = data.flatMap((order) =>
      order.order_details.map((detail) => {
        let combination = detail.product_name;
        if (detail.product_name && detail.product_reference) {
          const refIndex = detail.product_name.indexOf(
            detail.product_reference
          );
          if (refIndex !== -1) {
            let afterRef = detail.product_name.substring(
              refIndex + detail.product_reference.length
            );
            let cleaned = afterRef.trim();
            if (cleaned.startsWith("-")) {
              cleaned = cleaned.slice(1).trim();
            }
            if (cleaned.endsWith("undefined")) {
              cleaned = cleaned.slice(0, -"undefined".length).trim();
            }
            const colorMatch = cleaned.match(/Color\s*[:\-]?\s*([\w\s]+)/i);
            const tallaMatch = cleaned.match(/Talla\s*[:\-]?\s*([\w\s]+)/i);
            if (colorMatch || tallaMatch) {
              const color = colorMatch ? colorMatch[1].trim() : "";
              const talla = tallaMatch ? tallaMatch[1].trim() : "";
              combination = [color, talla].filter(Boolean).join(" - ");
            } else {
              const parts = cleaned
                .split("-")
                .map((p) => p.trim())
                .filter(Boolean);
              if (parts.length >= 2) {
                combination = `${parts[0]} - ${parts[1]}`;
              } else {
                combination = cleaned;
              }
            }
          }
        }
        const payments = order.payment
          .split(",")
          .map((p) => p.trim().toLowerCase());
        const cashAmount = order.total_cash || 0;
        const cardAmount = order.total_card || 0;
        const bizumAmount = order.total_bizum || 0;
        const includedMethods = [];
        if (payments.includes("efectivo")) {
          includedMethods.push({ method: "efectivo", amount: cashAmount });
        }
        if (payments.includes("contra reembolso")) {
          includedMethods.push({
            method: "contra reembolso",
            amount: cashAmount,
          });
        }
        if (payments.includes("tarjeta")) {
          includedMethods.push({ method: "tarjeta", amount: cardAmount });
        }
        if (payments.includes("redsys - tarjeta")) {
          includedMethods.push({
            method: "redsys - tarjeta",
            amount: cardAmount,
          });
        }
        if (payments.includes("bizum")) {
          includedMethods.push({ method: "bizum", amount: bizumAmount });
        }
        if (payments.includes("redsys - bizum")) {
          includedMethods.push({
            method: "redsys - bizum",
            amount: bizumAmount,
          });
        }
        const nonZeroCount = includedMethods.filter((m) => m.amount > 0).length;
        const paymentText = includedMethods
          .map((m) =>
            nonZeroCount > 1 && m.amount > 0
              ? `${m.method}: ${m.amount.toFixed(2)}€`
              : m.method
          )
          .join(", ");
        return {
          id_order: order.id_order,
          customer_name: order.customer_name?.includes("TPV")
            ? "TPV"
            : order.customer_name,
          payment: paymentText,
          product_quantity: detail.product_quantity,
          product_reference: detail.product_reference,
          combination_name: combination,
          product_name: detail.product_name,
          total_price_tax_incl: detail.total_price_tax_incl,
          reduction_amount_tax_incl: detail.reduction_amount_tax_incl || 0,
          total_cash: order.total_cash || 0,
          total_card: order.total_card || 0,
          total_bizum: order.total_bizum || 0,
        };
      })
    );

    // Calcular suma de descuentos realizados en todas las líneas:
    let discountSum = 0;
    data.forEach((order) => {
      order.order_details.forEach((detail) => {
        const reduction = parseFloat(detail.reduction_amount_tax_incl) || 0;
        if (reduction !== 0) {
          const original = parseFloat(detail.total_price_tax_incl);
          discountSum += (original - reduction) * detail.product_quantity;
        }
      });
    });

    const tableRows = productLines.map((item) => {
      let precio;
      if (
        item.reduction_amount_tax_incl &&
        item.reduction_amount_tax_incl !== 0
      ) {
        precio = {
          discount: true,
          original: Number(item.total_price_tax_incl).toFixed(2) + "€",
          discounted: Number(item.reduction_amount_tax_incl).toFixed(2) + "€",
        };
      } else {
        precio = Number(item.total_price_tax_incl).toFixed(2) + "€";
      }
      return [
        item.id_order,
        item.customer_name,
        item.product_quantity,
        item.product_reference,
        item.combination_name,
        item.payment,
        precio,
      ];
    });

    const totalCash = data.reduce(
      (acc, order) => acc + (order.total_cash || 0),
      0
    );
    const totalCard = data.reduce(
      (acc, order) => acc + (order.total_card || 0),
      0
    );
    const totalBizum = data.reduce(
      (acc, order) => acc + (order.total_bizum || 0),
      0
    );

    const tableColumn = [
      "Ticket",
      "Cliente",
      "Cant.",
      "Referencia",
      "Combinación",
      "Pago",
      "Importe",
    ];

    // Definir variables para alternar el fondo por id_order
    let rowColors = {};
    let lastOrder = null;
    let useGray = false;

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: yPos,
      margin: { left: margin, right: margin },
      styles: { fontSize: 12 },
      theme: "grid",
      didParseCell: function (data) {
        // Aplicar colores solo a las filas de productos (excluyendo la cabecera)
        if (data.row.section === "body") {
          const rowIndex = data.row.index;
          if (rowColors[rowIndex] === undefined && data.column.index === 0) {
            const currentOrder = data.cell.text[0];
            if (currentOrder !== lastOrder) {
              useGray = !useGray;
              lastOrder = currentOrder;
            }
            rowColors[rowIndex] = useGray ? [240, 240, 240] : [255, 255, 255];
          }
          data.cell.styles.fillColor = rowColors[rowIndex];
        }

        // Manejo existente para celdas de descuento en la columna "Importe"
        if (
          data.column.index === 6 &&
          data.cell.raw &&
          data.cell.raw.discount
        ) {
          data.cell.text = [];
        }
      },
      didDrawCell: function (data) {
        // Aplicar lógica de descuento solo a las filas de productos
        if (data.row.section === "body" && data.column.index === 6) {
          if (data.cell.raw && data.cell.raw.discount) {
            const originalText = data.cell.raw.original;
            const discountedText = data.cell.raw.discounted;
            const { x, y } = data.cell;
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(8);
            const origX = x + 2;
            const origY = y + 10;
            doc.text(originalText, origX, origY);
            const origTextWidth = doc.getTextWidth(originalText);
            doc.setDrawColor(255, 0, 0);
            doc.setLineWidth(0.5);
            doc.line(origX, origY - 2, origX + origTextWidth, origY - 2);
            doc.setTextColor(255, 0, 0);
            doc.setFontSize(12);
            doc.text(discountedText, origX, origY + 10);
          }
        }
      },
    });

    let finalY = doc.lastAutoTable.finalY + 20;
    const paymentTableHead = [
      ["Total Efectivo", "Total Tarjeta", "Total Bizum"],
    ];
    const paymentTableBody = [
      [
        totalCash.toFixed(2) + "€",
        totalCard.toFixed(2) + "€",
        totalBizum.toFixed(2) + "€",
      ],
    ];
    doc.autoTable({
      head: paymentTableHead,
      body: paymentTableBody,
      startY: finalY,
      margin: { left: margin, right: margin },
      styles: { fontSize: 12 },
      theme: "grid",
    });

    finalY = doc.lastAutoTable.finalY + 20;

    const totalPaid = data.reduce(
      (acc, order) => acc + (order.total_paid || 0),
      0
    );

    // Tabla de totales generales; se añade la fila de descuentos si corresponde.
    const totalsTableBody = [];
    if (discountSum > 0) {
      totalsTableBody.push([
        "TOTAL SIN DESCUENTOS:",
        (totalPaid + discountSum).toFixed(2) + "€",
      ]);
      totalsTableBody.push(["TOTAL DESCUENTOS:", discountSum.toFixed(2) + "€"]);
    }
    totalsTableBody.push(["TOTAL:", totalPaid.toFixed(2) + "€"]);
    doc.autoTable({
      head: [],
      body: totalsTableBody,
      startY: finalY,
      margin: { left: margin, right: margin },
      styles: { fontSize: 12, halign: "right" },
      tableLineWidth: 0,
    });

    doc.save(`Reporte_Ventas_${shopName}.pdf`);
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return false;
  }
};
