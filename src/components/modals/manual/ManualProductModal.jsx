import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { toast } from "sonner";

const ManualProductModal = ({ isOpen, onClose, onAddProduct }) => {
  const [productName, setProductName] = useState("");
  const [unitPrice, setUnitPrice] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const handleAdd = () => {
    // Validaciones básicas
    if (!productName.trim() || unitPrice <= 0 || quantity <= 0) return;
    const uniqueId = Date.now(); // Genera un id único para el producto manual
    const manualProduct = {
      id_product: 0,
      id_product_attribute: 0,
      id_stock_available: 0,
      product_name: productName,
      combination_name: "",
      reference_combination: "manual-product-" + uniqueId,
      ean13_combination: "",
      price_incl_tax: Number(unitPrice),
      final_price_incl_tax: Number(unitPrice),
      tax_rate: 0,
      image_url: "",
      shop_name: "",
      id_shop: 0,
    };
    // Se utiliza el callback para añadir el producto con la cantidad indicada
    onAddProduct(manualProduct, null, null, false, quantity);
    toast.success("Producto añadido manualmente");
    onClose();
  };

  return (
    <Dialog
      header="Añadir Producto Manual"
      visible={isOpen}
      onHide={onClose}
      modal
      draggable={false}
      resizable={false}
    >
      <div className="p-fluid">
        {/* Nombre Producto */}
        <div className="p-field">
          <label htmlFor="productName">Nombre Producto</label>
          <InputText
            id="productName"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />
        </div>
        {/* Precio Unitario */}
        <div className="p-field">
          <label htmlFor="unitPrice">Precio Unitario</label>
          <InputNumber
            id="unitPrice"
            value={unitPrice}
            onValueChange={(e) => setUnitPrice(e.value)}
            mode="currency"
            currency="EUR"
            locale="es-ES"
          />
        </div>
        {/* Cantidad */}
        <div className="p-field">
          <label htmlFor="quantity">Cantidad</label>
          <InputNumber
            id="quantity"
            value={quantity}
            onValueChange={(e) => setQuantity(e.value)}
          />
        </div>
        <Button label="Añadir" onClick={handleAdd} className="p-mt-2" />
      </div>
    </Dialog>
  );
};

export default ManualProductModal;
