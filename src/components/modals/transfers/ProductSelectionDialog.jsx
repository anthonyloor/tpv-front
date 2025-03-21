import React, { useState } from "react";
import { Dialog } from "primereact/dialog";

/**
 * Componente para mostrar un diálogo (PrimeReact) con la lista de productos
 * y permitir su selección.
 *
 * @param {boolean} visible        - Controla si se muestra el diálogo.
 * @param {function} onHide        - Función para cerrar el diálogo.
 * @param {Array} products         - Lista de productos transformados (stockOrigin, stockDestination).
 * @param {function} onSelectProducts - Callback para añadir los productos seleccionados.
 * @param {string} originShopName
 * @param {string} destinationShopName
 * @param {string} type            - 'traspaso', 'entrada' o 'salida'
 */
const ProductSelectionDialog = ({
  visible,
  onHide,
  products,
  onSelectProducts,
  originShopName = "Origen",
  destinationShopName = "Destino",
  type = "traspaso", // 'traspaso' | 'entrada' | 'salida'
}) => {
  const [selectedItems, setSelectedItems] = useState([]);

  // Al hacer check
  const handleCheckboxChange = (product) => {
    setSelectedItems((prev) => {
      const found = prev.find(
        (p) =>
          p.id_product === product.id_product &&
          p.id_product_attribute === product.id_product_attribute
      );
      if (found) {
        // Quitar
        return prev.filter(
          (p) =>
            !(
              p.id_product === product.id_product &&
              p.id_product_attribute === product.id_product_attribute
            )
        );
      } else {
        // Agregar
        return [...prev, product];
      }
    });
  };

  const isSelected = (product) =>
    !!selectedItems.find(
      (p) =>
        p.id_product === product.id_product &&
        p.id_product_attribute === product.id_product_attribute
    );

  // Determina si se muestra la columna "stockOrigin"
  const showOriginStock = type === "salida" || type === "traspaso";
  // Determina si se muestra la columna "stockDestination"
  const showDestinationStock = type === "entrada" || type === "traspaso";

  // Al pulsar "Añadir" en el footer
  const handleConfirm = () => {
    if (selectedItems.length === 0) {
      alert("No has seleccionado ningún producto.");
      return;
    }
    onSelectProducts(selectedItems);
    setSelectedItems([]);
  };

  const renderFooter = () => {
    return (
      <div className="flex justify-end gap-2">
        <button
          className="p-button p-component p-button-text"
          onClick={() => {
            setSelectedItems([]);
            onHide();
          }}
        >
          Cancelar
        </button>
        <button
          className="p-button p-component p-button-primary"
          onClick={handleConfirm}
        >
          Añadir
        </button>
      </div>
    );
  };

  return (
    <Dialog
      header="Seleccionar Producto"
      visible={visible}
      onHide={onHide}
      modal
      draggable={false}
      resizable={false}
      style={{
        width: "70vw",
        maxWidth: "900px",
        backgroundColor: "var(--surface-0)",
        color: "var(--text-color)",
      }}
      footer={renderFooter()}
    >
      <div className="overflow-auto" style={{ maxHeight: "65vh" }}>
        <table
          className="min-w-full border"
          style={{
            backgroundColor: "var(--surface-0)",
            color: "var(--text-color)",
          }}
        >
          <thead
            className="sticky top-0 z-10"
            style={{
              backgroundColor: "var(--surface-100)",
              color: "var(--text-color)",
            }}
          >
            <tr>
              <th
                className="py-2 px-4 border-b"
                style={{
                  borderColor: "var(--surface-border)",
                  textAlign: "left",
                }}
              >
                Selec.
              </th>
              <th
                className="py-2 px-4 border-b"
                style={{
                  borderColor: "var(--surface-border)",
                  textAlign: "left",
                }}
              >
                Producto
              </th>
              <th
                className="py-2 px-4 border-b"
                style={{
                  borderColor: "var(--surface-border)",
                  textAlign: "left",
                }}
              >
                EAN13
              </th>
              <th
                className="py-2 px-4 border-b"
                style={{
                  borderColor: "var(--surface-border)",
                  textAlign: "left",
                }}
              >
                idCS
              </th>
              {showOriginStock && (
                <th
                  className="py-2 px-4 border-b"
                  style={{
                    borderColor: "var(--surface-border)",
                    textAlign: "left",
                  }}
                >
                  Stock {originShopName}
                </th>
              )}
              {showDestinationStock && (
                <th
                  className="py-2 px-4 border-b"
                  style={{
                    borderColor: "var(--surface-border)",
                    textAlign: "left",
                  }}
                >
                  Stock {destinationShopName}
                </th>
              )}
              {type === "traspaso" && (
                <th
                  className="py-2 px-4 border-b"
                  style={{
                    borderColor: "var(--surface-border)",
                    textAlign: "left",
                  }}
                >
                  Cantidad Destino
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {products.map((prod) => {
              const selected = isSelected(prod);
              return (
                <tr
                  key={`${prod.id_product}_${prod.id_product_attribute}`}
                  // Efecto hover acorde al tema
                  style={{
                    borderColor: "var(--surface-border)",
                    backgroundColor: "var(--surface-0)",
                  }}
                  className="hover:bg-[var(--surface-100)]"
                >
                  <td
                    className="py-2 px-4 border-b"
                    style={{ borderColor: "var(--surface-border)" }}
                  >
                    <input
                      type="checkbox"
                      disabled={!!prod.id_control_stock} // Desactivar si tiene id_control_stock
                      checked={selected}
                      onChange={() => handleCheckboxChange(prod)}
                    />
                  </td>
                  <td
                    className="py-2 px-4 border-b"
                    style={{ borderColor: "var(--surface-border)" }}
                  >
                    {`${prod.product_name} ${prod.combination_name}`}
                  </td>
                  <td
                    className="py-2 px-4 border-b"
                    style={{ borderColor: "var(--surface-border)" }}
                  >
                    {prod.ean13}
                  </td>
                  <td
                    className="py-2 px-4 border-b"
                    style={{ borderColor: "var(--surface-border)" }}
                  >
                    {prod.id_control_stock || ''}
                  </td>
                  {showOriginStock && (
                    <td
                      className="py-2 px-4 border-b"
                      style={{ borderColor: "var(--surface-border)" }}
                    >
                      {prod.stockOrigin ?? 0}
                    </td>
                  )}
                  {showDestinationStock && (
                    <td
                      className="py-2 px-4 border-b"
                      style={{ borderColor: "var(--surface-border)" }}
                    >
                      {prod.stockDestination ?? 0}
                    </td>
                  )}
                  {type === "traspaso" && (
                    <td
                      className="py-2 px-4 border-b"
                      style={{ borderColor: "var(--surface-border)" }}
                    >
                      {prod.destinationQuantity}
                    </td>
                  )}
                </tr>
              );
            })}

            {products.length === 0 && (
              <tr style={{ backgroundColor: "var(--surface-0)" }}>
                <td
                  colSpan={
                    3 +
                    (showOriginStock ? 1 : 0) +
                    (showDestinationStock ? 1 : 0) +
                    (type === "traspaso" ? 1 : 0)
                  }
                  className="p-4 text-center"
                  style={{ borderColor: "var(--surface-border)" }}
                >
                  No hay productos para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Dialog>
  );
};

export default ProductSelectionDialog;
