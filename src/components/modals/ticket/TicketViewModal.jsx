// src/components/modals/ticket/TicketViewModal.jsx

import React, { useEffect, useState, useContext, useCallback } from "react";
import { Dialog } from "primereact/dialog";
import { useApiFetch } from "../../../utils/useApiFetch";
import { ConfigContext } from "../../../contexts/ConfigContext";
import generateTicket from "../../../utils/ticket";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";
import { useEmployeesDictionary } from "../../../hooks/useEmployeesDictionary";

const TicketViewModal = ({
  isOpen,
  onClose,
  mode = "ticket",
  orderId = null,
  cartRuleCode = null,
  printOnOpen = false,
  giftTicket = false,
  changeAmount = 0,
  widthPercent = "25%",
  heightPercent = "30%",
}) => {
  const { configData } = useContext(ConfigContext);
  const [fetchedData, setFetchedData] = useState(null);
  const [error, setError] = useState(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const apiFetch = useApiFetch();
  const API_BASE_URL = getApiBaseUrl();
  const employeesDict = useEmployeesDictionary();

  const buildPreviewHtmlForTicket = useCallback(
    (orderData, isGiftTicket) => {
      if (!orderData) return;
      const {
        id_order,
        id_customer,
        id_address_delivery,
        date_add,
        total_paid,
        order_details = [],
        order_cart_rules = [],
      } = orderData;
      const header1 = configData?.ticket_text_header_1 || "";
      const header2 = configData?.ticket_text_header_2 || "";
      const footer1 = configData?.ticket_text_footer_1 || "";
      const footer2 = configData?.ticket_text_footer_2 || "";
      let customerLine = `Cliente: ${id_customer}`;
      if (
        configData?.id_customer_default &&
        id_customer === configData.id_customer_default
      ) {
        customerLine = "Cliente: TPV";
      }
      let addressLine = `Dirección: ${id_address_delivery}`;
      if (
        configData?.id_address_delivery_default &&
        id_address_delivery === configData.id_address_delivery_default
      ) {
        addressLine = "";
      }
      let productRows = "";
      order_details.forEach((item) => {
        const productName = item.product_name.trim();
        if (isGiftTicket) {
          productRows += `
          <tr>
            <td>${item.product_quantity}</td>
            <td>${productName}</td>
          </tr>
        `;
        } else {
          const lineTotal = (
            item.unit_price_tax_incl * item.product_quantity
          ).toFixed(2);
          productRows += `
          <tr>
            <td>${item.product_quantity}</td>
            <td>${productName}</td>
            <td style="text-align:right;">${item.unit_price_tax_incl.toFixed(
              2
            )} €</td>
            <td style="text-align:right;">${lineTotal} €</td>
          </tr>
        `;
        }
      });
      let discountsHtml = "";
      if (order_cart_rules?.length > 0) {
        discountsHtml = `
        <h4 style="margin-top: 10px;">Descuentos aplicados</h4>
        <table style="width: 100%; border-collapse: collapse; margin-top: 5px;">
          <thead>
            <tr>
              <th style="text-align:left;">Código</th>
              <th style="text-align:left;">Nombre</th>
            </tr>
          </thead>
          <tbody>
            ${order_cart_rules
              .map(
                (rule) => `
              <tr>
                <td style="padding: 4px;">${rule.code}</td>
                <td style="padding: 4px;">${rule.name}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `;
      }
      const date = new Date(date_add || Date.now());
      const formattedDate = date.toLocaleString("es-ES");
      const preview = `
      <div>
        ${header1 ? `<h3>${header1}</h3>` : ""}
        ${header2 ? `<h3>${header2}</h3>` : ""}
        <hr/>
        <h2>${
          isGiftTicket ? "Ticket Regalo" : "Ticket Compra"
        } #${id_order}</h2>
        <div>Fecha: ${formattedDate}</div>
        <div>${customerLine}</div>
        ${addressLine ? `<div>${addressLine}</div>` : ""}
        <hr/>
        <table style="width:100%; border-collapse:collapse; margin-top:5px;">
          <thead>
            <tr>
              <th>Cant.</th>
              <th>Producto</th>
              ${
                !isGiftTicket
                  ? '<th style="text-align:right;">P/U (€)</th><th style="text-align:right;">Total (€)</th>'
                  : ""
              }
            </tr>
          </thead>
          <tbody>
            ${productRows}
          </tbody>
        </table>
        ${discountsHtml}
        ${
          !isGiftTicket
            ? `
          <hr />
          <div><strong>Total Pagado:</strong> ${total_paid.toFixed(2)} €</div>
        `
            : ""
        }
        <hr/>
        <div style="text-align:center;">
          ${footer1 ? `<p>${footer1}</p>` : ""}
          ${footer2 ? `<p>${footer2}</p>` : ""}
        </div>
      </div>
    `;
      setPreviewHtml(preview);
    },
    [configData]
  );

  const buildPreviewHtmlForCartRule = useCallback(
    (cartRuleData) => {
      if (!cartRuleData) return;
      const {
        code,
        description,
        date_from,
        date_to,
        reduction_percent,
        reduction_amount,
      } = cartRuleData;
      const header1 = configData?.ticket_text_header_1 || "";
      const header2 = configData?.ticket_text_header_2 || "";
      const footer1 = configData?.ticket_text_footer_1 || "";
      const footer2 = configData?.ticket_text_footer_2 || "";
      const fromStr = new Date(date_from).toLocaleString("es-ES");
      const toStr = new Date(date_to).toLocaleString("es-ES");
      let discountLine = "";
      if (reduction_percent > 0) {
        discountLine = `Descuento: ${reduction_percent}%`;
      } else if (reduction_amount > 0) {
        discountLine = `Descuento: ${reduction_amount.toFixed(2)} €`;
      }
      const preview = `
      <div>
        ${header1 ? `<h3>${header1}</h3>` : ""}
        ${header2 ? `<h3>${header2}</h3>` : ""}
        <hr/>
        <h2>Vale Descuento: ${code}</h2>
        <div>${description}</div>
        <hr/>
        <div>Válido desde: ${fromStr}</div>
        <div>Hasta: ${toStr}</div>
        <hr/>
        <div><strong>${discountLine}</strong></div>
        <hr/>
        <div style="text-align:center;">
          ${footer1 ? `<p>${footer1}</p>` : ""}
          ${footer2 ? `<p>${footer2}</p>` : ""}
        </div>
      </div>
    `;
      setPreviewHtml(preview);
    },
    [configData]
  );

  const loadOrder = useCallback(async () => {
    try {
      setError(null);
      const data = await apiFetch(
        `${API_BASE_URL}/get_order?id_order=${orderId}`,
        { method: "GET" }
      );
      setFetchedData(data);
      buildPreviewHtmlForTicket(data, giftTicket);
    } catch (err) {
      setError("No se pudo cargar el ticket de la venta.");
      console.error("[TicketViewModal] Error loadOrder:", err);
    }
  }, [apiFetch, orderId, giftTicket, buildPreviewHtmlForTicket, API_BASE_URL]);

  const loadCartRule = useCallback(async () => {
    try {
      setError(null);
      const data = await apiFetch(
        `${API_BASE_URL}/get_cart_rule?code=${cartRuleCode}`,
        { method: "GET" }
      );
      setFetchedData(data);
      buildPreviewHtmlForCartRule(data);
    } catch (err) {
      setError("No se pudo cargar la información del vale descuento.");
      console.error("[TicketViewModal] Error loadCartRule:", err);
    }
  }, [apiFetch, cartRuleCode, buildPreviewHtmlForCartRule, API_BASE_URL]);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === "ticket" && orderId) {
      loadOrder();
    } else if (mode === "cart_rule" && cartRuleCode) {
      loadCartRule();
    }
  }, [
    isOpen,
    mode,
    orderId,
    cartRuleCode,
    loadOrder,
    loadCartRule,
    API_BASE_URL,
  ]);

  useEffect(() => {
    if (printOnOpen && fetchedData && configData) {
      (async () => {
        const response = await generateTicket("print", fetchedData, configData, employeesDict);
        if (!response.success) {
          console.error("Error al imprimir ticket:", response.message);
        }
      })();
    }
  }, [printOnOpen, previewHtml, fetchedData, configData, employeesDict]);

  if (!isOpen) return null;

  return (
    <Dialog
      header={
        mode === "ticket" ? `Ticket #${orderId}` : `Vale: ${cartRuleCode}`
      }
      visible={isOpen}
      onHide={onClose}
      modal
      draggable={false}
      resizable={false}
      style={{
        width: widthPercent,
        height: heightPercent,
        minWidth: "750px",
        minHeight: "600px",
      }}
    >
      <div className="p-4">
        {error && <p className="text-red-500">{error}</p>}
        {!error && !fetchedData && <p>Cargando datos...</p>}
        {fetchedData && (
          <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
        )}
      </div>
    </Dialog>
  );
};

export default TicketViewModal;
