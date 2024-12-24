// src/components/Reports/SalesReport.jsx
import React, { useState, useEffect } from 'react';

const SalesReport = () => {
  const [salesData, setSalesData] = useState([]);

  useEffect(() => {
    // Aquí puedes reemplazar esta parte con una llamada a tu API para obtener los datos reales
    const fetchSalesData = async () => {
      // Simulando una llamada a una API
      const data = [
        {
          "id_order": 87503,
          "id_shop": 9,
          "id_customer": 6555,
          "id_address_delivery": 9012,
          "payment": "",
          "total_paid": -104,
          "total_paid_tax_excl": -85.95,
          "total_products": -85.95,
          "order_details": [
            {
              "product_id": 6947,
              "product_attribute_id": 22655,
              "stock_available_id": 180494,
              "product_name": "Faja Colombiana Reloj De Arena Cocoa - XS ",
              "product_quantity": -1,
              "product_price": 85.95,
              "product_ean13": "1736192070741",
              "product_reference": "Reloj De Arena",
              "total_price_tax_incl": -104,
              "total_price_tax_excl": -85.95,
              "unit_price_tax_incl": 104,
              "unit_price_tax_excl": 85.95,
              "id_shop": 9
            }
          ]
        },
        {
          "id_order": 87502,
          "id_shop": 9,
          "id_customer": 6555,
          "id_address_delivery": 9012,
          "payment": "tarjeta",
          "total_paid": 64,
          "total_paid_tax_excl": 52.9,
          "total_products": 52.9,
          "order_details": [
            {
              "product_id": 7380,
              "product_attribute_id": 24425,
              "stock_available_id": 191551,
              "product_name": "Sujetador Post Quirúrgico Luciana Cocoa - M",
              "product_quantity": 1,
              "product_price": 26.45,
              "product_ean13": "4690673089295",
              "product_reference": "Luciana",
              "total_price_tax_incl": 32,
              "total_price_tax_excl": 26.45,
              "unit_price_tax_incl": 32,
              "unit_price_tax_excl": 26.45,
              "id_shop": 9
            },
            {
              "product_id": 7380,
              "product_attribute_id": 24426,
              "stock_available_id": 191824,
              "product_name": "Sujetador Post Quirúrgico Luciana Cocoa - L",
              "product_quantity": 1,
              "product_price": 26.45,
              "product_ean13": "6086049963722",
              "product_reference": "Luciana",
              "total_price_tax_incl": 32,
              "total_price_tax_excl": 26.45,
              "unit_price_tax_incl": 32,
              "unit_price_tax_excl": 26.45,
              "id_shop": 9
            }
          ]
        },
        // ... otros pedidos
      ];

      // Procesar los datos para obtener una lista plana de productos vendidos
      const processedData = data.flatMap(order => 
        order.order_details.map(detail => ({
          id_order: order.id_order,
          id_customer: order.id_customer,
          product_name: detail.product_name,
          unit_price_tax_incl: detail.unit_price_tax_incl,
          product_quantity: detail.product_quantity,
          total_price_tax_incl: detail.total_price_tax_incl
        }))
      );

      setSalesData(processedData);
    };

    fetchSalesData();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Reporte de Ventas del Día</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="py-2 px-4 border">Número de Ticket</th>
              <th className="py-2 px-4 border">ID Cliente</th>
              <th className="py-2 px-4 border">Nombre del Producto</th>
              <th className="py-2 px-4 border">Precio Unitario con IVA (€)</th>
              <th className="py-2 px-4 border">Cantidad</th>
              <th className="py-2 px-4 border">Precio Total con IVA (€)</th>
            </tr>
          </thead>
          <tbody>
            {salesData.length > 0 ? (
              salesData.map((item, index) => (
                <tr key={index} className="text-center">
                  <td className="py-2 px-4 border">{item.id_order}</td>
                  <td className="py-2 px-4 border">{item.id_customer}</td>
                  <td className="py-2 px-4 border">{item.product_name}</td>
                  <td className="py-2 px-4 border">{item.unit_price_tax_incl.toFixed(2)}</td>
                  <td className="py-2 px-4 border">{item.product_quantity}</td>
                  <td className="py-2 px-4 border">{item.total_price_tax_incl.toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="py-2 px-4 border text-center">
                  No hay ventas registradas para hoy.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesReport;