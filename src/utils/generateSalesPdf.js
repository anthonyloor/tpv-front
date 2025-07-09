import jsPDF from "jspdf";
import "jspdf-autotable";
import { formatLongDate } from "./dateUtils";

export const generateSalesPdf = (data, shopName, closureData, configData) => {
  try {
    const doc = new jsPDF("p", "pt", "a4");
    const margin = 40;
    let yPos = margin;

    // Función auxiliar para formatear fecha y hora
    const formatDateTime = (date) => {
      const d = new Date(date);
      const hh = ("0" + d.getHours()).slice(-2);
      const min = ("0" + d.getMinutes()).slice(-2);
      return `${hh}:${min} - ${formatLongDate(d)}`;
    };

    doc.setFontSize(18);
    doc.text(`Reporte de ventas: ${shopName}`, margin, yPos);
    // Nuevo: Incluir ticket_text_header_1 desde ConfigContext
    yPos += 20;
    doc.setFontSize(14);
    doc.text(`${configData.ticket_text_header_1}`, margin, yPos);
    yPos += 25;
    doc.setFontSize(12);
    // Se elimina la línea de "Fecha generación reporte"
    // Nuevo: Incluir datos de cierre (apertura y cierre)
    yPos += 15;
    // Mostrar apertura
    if (closureData.employee_open) {
      doc.text(
        `Apertura: ${closureData.employee_open} - ${formatDateTime(
          closureData.date_add
        )}`,
        margin,
        yPos
      );
    } else {
      doc.text(
        `Apertura: ${formatDateTime(closureData.date_add)}`,
        margin,
        yPos
      );
    }
    yPos += 15;
    // Mostrar cierre
    if (closureData.employee_close) {
      doc.text(
        `Cierre: ${closureData.employee_close} - ${formatDateTime(
          closureData.date_close
        )}`,
        margin,
        yPos
      );
    } else {
      doc.text(
        `Cierre: ${formatDateTime(closureData.date_close)}`,
        margin,
        yPos
      );
    }
    yPos += 20;

    // Procesar descuentos (order_cart_rules)
    data.forEach((order) => {
      if (order.order_cart_rules && Array.isArray(order.order_cart_rules)) {
        order.order_cart_rules.forEach((rule) => {
          if (rule.description.startsWith("Producto:")) {
            const prodIdentifier = rule.description
              .split("Producto:")[1]
              .trim(); // Ej: "7073-25459"
            order.order_details = order.order_details.map((detail) => {
              const detailIdentifier = `${detail.product_id}-${detail.product_attribute_id}`;
              if (detailIdentifier === prodIdentifier) {
                detail.hasDiscount = true;
                detail.discountRuleName = rule.name;
              }
              return detail;
            });
          } else if (rule.description.startsWith("Descuento sobre venta")) {
            order.hasGlobalDiscount = true;
            order.globalDiscountName = rule.name + " sobre la venta";
          } else if (rule.name) {
            order.hasGlobalDiscount = true;
            order.globalDiscountName = rule.name;
          }
        });
      }
    });

    // NUEVO: Función para calcular totales
    function calculateTotals(orders) {
      let totalCash = 0,
        totalCard = 0,
        totalBizum = 0;
      orders.forEach((order) => {
        totalCash += order.total_cash || 0;
        totalCard += order.total_card || 0;
        totalBizum += order.total_bizum || 0;
      });
      return { totalCash, totalCard, totalBizum };
    }
    const { totalCash, totalCard, totalBizum } = calculateTotals(data);

    // Calcular suma de descuentos y vales de descuento desde order_cart_rules
    let discountSum = 0;
    let voucherSum = 0;
    data.forEach((order) => {
      if (Array.isArray(order.order_cart_rules)) {
        order.order_cart_rules.forEach((rule) => {
          const value = parseFloat(rule.value) || 0;
          const name = rule.name ? rule.name.toLowerCase() : "";
          if (name.startsWith("descuento sobre") || name.startsWith("descuento de")) {
            discountSum += value;
          } else if (name.startsWith("vale descuento")) {
            voucherSum += value;
          }
        });
      }
    });

    // Actualizar columnas de la tabla para incluir "Hora"
    const tableColumn = [
      "Hora",
      "Ticket",
      "Cliente",
      "Cant.",
      "Referencia",
      "Combinación",
      "Importe",
    ];
    const priceColumnIndex = tableColumn.indexOf("Importe");

    // Recalcular la propiedad "combination_name" para cada detalle si no está definida
    data.forEach((order) => {
      order.order_details.forEach((detail) => {
        if (!detail.combination_name) {
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
          detail.combination_name = combination;
        }
      });
    });

    // Calcular detalles del pago para cada orden
    data.forEach((order) => {
      const paymentField = order.payment ? order.payment.trim() : "";
      const payments = paymentField
        ? paymentField.split(",").map((p) => p.trim().toLowerCase())
        : [];
      const includedMethods = [];
      const addMethod = (label, field) => {
        let amount = order[field];
        if (amount === null || amount === undefined || amount === "") {
          amount = order.total_paid || 0;
        }
        includedMethods.push({ method: label, amount });
      };
      if (payments.includes("efectivo")) {
        addMethod("efectivo", "total_cash");
      }
      if (payments.includes("contra reembolso")) {
        addMethod("contra reembolso", "total_cash");
      }
      if (payments.includes("tarjeta")) {
        addMethod("tarjeta", "total_card");
      }
      if (payments.includes("redsys - tarjeta")) {
        addMethod("redsys - tarjeta", "total_card");
      }
      if (payments.includes("bizum")) {
        addMethod("bizum", "total_bizum");
      }
      if (payments.includes("redsys - bizum")) {
        addMethod("redsys - bizum", "total_bizum");
      }

      // Incluir información de vale descuento en la línea de pago
      let voucherAmount = 0;
      if (Array.isArray(order.order_cart_rules)) {
        order.order_cart_rules.forEach((rule) => {
          const name = rule.name ? rule.name.toLowerCase() : "";
          if (name.startsWith("vale descuento")) {
            voucherAmount += parseFloat(rule.value) || 0;
          }
        });
      }
      if (voucherAmount > 0) {
        includedMethods.push({ method: "vale descuento", amount: voucherAmount });
      }

      if (includedMethods.length === 0) {
        // Si no hay métodos de pago especificados, mostrar sólo el total de la orden
        order.payment_summary = `${Number(order.total_paid || 0).toFixed(2)}€`;
      } else {
        order.payment_summary = includedMethods
          .map((m) => `${m.method} ${Number(m.amount).toFixed(2)}€`)
          .join(", ");
      }
    });

    let rowOrderMap = {};
    let currentRowIndex = 0;
    const tableRows = data.flatMap((order, orderIdx) => {
      let rows = [];
      // Extraer hora de order.date_add (formato "HH:MM")
      const timeStr = order.date_add
        ? order.date_add.split(" ")[1].substring(0, 5)
        : "";
      order.order_details.forEach((detail) => {
        let precio;
        if (
          detail.reduction_amount_tax_incl &&
          detail.reduction_amount_tax_incl !== 0
        ) {
          precio = {
            discount: true,
            original: Number(detail.total_price_tax_incl).toFixed(2) + "€",
            discounted:
              Number(detail.reduction_amount_tax_incl).toFixed(2) + "€",
          };
        } else {
          precio = Number(detail.total_price_tax_incl).toFixed(2) + "€";
        }
        // Inserción de la hora al inicio de cada fila
        rows.push([
          timeStr,
          order.id_order,
          order.customer_name?.includes("TPV") ? "TPV" : order.customer_name,
          detail.product_quantity,
          detail.product_reference,
          detail.combination_name,
          precio,
        ]);
        rowOrderMap[currentRowIndex] = orderIdx;
        currentRowIndex++;
        if (detail.hasDiscount) {
          rows.push([
            {
              content: detail.discountRuleName,
              colSpan: tableColumn.length,
            },
          ]);
          rowOrderMap[currentRowIndex] = orderIdx;
          currentRowIndex++;
        }
      });
      if (order.hasGlobalDiscount) {
        rows.push([
          {
            content: order.globalDiscountName,
            colSpan: tableColumn.length,
          },
        ]);
        rowOrderMap[currentRowIndex] = orderIdx;
        currentRowIndex++;
      }
      // Fila resumen de pago
      rows.push([
        {
          content: `Pago: ${order.payment_summary}`,
          colSpan: tableColumn.length,
          styles: { fontStyle: "bold", halign: "right" },
        },
      ]);
      rowOrderMap[currentRowIndex] = orderIdx;
      currentRowIndex++;
      return rows;
    });

    let rowColors = {};
    let lastOrder = null;
    let useGray = false;
    const orderRects = {};

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: yPos,
      margin: { left: margin, right: margin },
      styles: { fontSize: 12 },
      theme: "grid",
      didParseCell: function (data) {
        if (
          data.column.index === priceColumnIndex &&
          data.cell.raw &&
          data.cell.raw.discount
        ) {
          data.cell.text = [];
        }
        if (data.row.section === "body") {
          const rowIndex = data.row.index;
          const orderIdx = rowOrderMap[rowIndex];
          if (rowColors[rowIndex] === undefined && data.column.index === 0) {
            if (orderIdx !== lastOrder) {
              useGray = !useGray;
              lastOrder = orderIdx;
            }
            rowColors[rowIndex] = useGray ? [240, 240, 240] : [255, 255, 255];
          }
          data.cell.styles.fillColor = rowColors[rowIndex];
        }
      },
      didDrawCell: function (data) {
        if (data.row.section === "body" && data.column.index === priceColumnIndex) {
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
        if (data.row.section === "body" && data.column.index === 0) {
          const orderIdx = rowOrderMap[data.row.index];
          if (orderIdx !== undefined) {
            if (!orderRects[orderIdx]) {
              orderRects[orderIdx] = {
                startY: data.cell.y,
                page: doc.internal.getNumberOfPages(),
              };
            }
            const nextOrderIdx = rowOrderMap[data.row.index + 1];
            if (nextOrderIdx !== orderIdx) {
              const rect = orderRects[orderIdx];
              if (rect.page === doc.internal.getNumberOfPages()) {
                const width = doc.internal.pageSize.getWidth() - margin * 2;
                const height = data.cell.y + data.cell.height - rect.startY;
                doc.setDrawColor(0);
                doc.rect(margin, rect.startY, width, height);
              }
            }
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

    const totalPaid = totalCash + totalCard + totalBizum;

    const totalsTableBody = [];
    if (discountSum > 0) {
      totalsTableBody.push(["TOTAL DESCUENTOS:", discountSum.toFixed(2) + "€"]);
    }
    if (voucherSum > 0) {
      totalsTableBody.push(["TOTAL VALES DESCUENTOS:", voucherSum.toFixed(2) + "€"]);
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

    doc.save(`Reporte de Ventas ${shopName}.pdf`);
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return false;
  }
};
