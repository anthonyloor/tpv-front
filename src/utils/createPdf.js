import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import printjs from "print-js";

// Modificar la asignación de vfs para usar pdfFonts.vfs si pdfFonts.pdfMake no está definido
pdfMake.vfs =
  pdfFonts.pdfMake && pdfFonts.pdfMake.vfs
    ? pdfFonts.pdfMake.vfs
    : pdfFonts.vfs;

const createPdf = async (props, output = "print") => {
  return new Promise((resolve, reject) => {
    try {
      const {
        pageSize = { width: 204.4, height: 840.7 },
        // Para impresión se aplican márgenes positivos para compensar posibles bordes agregados por la impresora
        pageMargins = output === "print"
          ? [5.66, 5.66, 5.66, 5.66]
          : [5.66, 5.66, 5.66, 5.66],
        info = {
          title: "F001-000001",
          author: "maclode",
          subject: "ticket",
          keywords: "tck, sale",
        },
        styles = {
          header: { fontSize: 8, bold: true, alignment: "center" },
          tHeaderLabel: { fontSize: 8, alignment: "right" },
          tHeaderValue: { fontSize: 8, bold: true },
          tProductsHeader: { fontSize: 8, bold: true },
          tProductsBody: { fontSize: 8 },
          tTotals: { fontSize: 8, bold: true, alignment: "right" },
          tClientLabel: { fontSize: 8, alignment: "right" },
          tClientValue: { fontSize: 8, bold: true },
          text: { fontSize: 8, alignment: "center" },
          link: {
            fontSize: 8,
            bold: true,
            margin: [0, 0, 0, 4],
            alignment: "center",
          },
          tableHeader: { fontSize: 8, bold: true, fillColor: "#eeeeee" },
          tableBody: { fontSize: 8 },
        },
        content,
      } = props;

      const docDefinition = {
        pageSize,
        pageMargins,
        info,
        content,
        styles,
      };

      if (output === "b64") {
        const pdfMakeCreatePdf = pdfMake.createPdf(docDefinition);
        pdfMakeCreatePdf.getBase64((data) => {
          resolve({
            success: true,
            content: data,
            message: "Archivo generado correctamente.",
          });
        });
        return;
      }

      if (output === "print") {
        const pdfMakeCreatePdf = pdfMake.createPdf(docDefinition);
        pdfMakeCreatePdf.getBase64((data) => {
          printjs({
            printable: data,
            type: "pdf",
            base64: true,
          });
          resolve({
            success: true,
            content: null,
            message: "Documento enviado a impresión.",
          });
        });
        return;
      }

      reject({
        success: false,
        content: null,
        message: "Debes enviar tipo salida.",
      });
    } catch (error) {
      reject({
        success: false,
        content: null,
        message: error?.message ?? "No se pudo generar proceso.",
      });
    }
  });
};

export default createPdf;
