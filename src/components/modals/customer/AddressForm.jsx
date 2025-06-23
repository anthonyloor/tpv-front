import React from "react";
import { InputText } from "primereact/inputtext";
import SPAIN_STATES from "../../../data/spainStates";

export default function AddressForm({
  addressData,
  onChange,
  setAddressData,
  errorMessage,
}) {
  return (
    <div className="p-fluid">
      {/* Primera fila: Calle / Avenida y Piso/puerta */}
      <div className="p-grid" style={{ marginBottom: "1rem" }}>
        <div className="p-col-6">
          <div className="p-inputgroup w-full">
            <span className="p-inputgroup-addon">
              <i className="pi pi-home" />
            </span>
            <InputText
              id="address1"
              className="w-full"
              name="address1"
              value={addressData.address1}
              onChange={onChange}
              placeholder="Calle, Avenida, etc."
            />
          </div>
        </div>
        <div className="p-col-6">
          <div className="p-inputgroup w-full">
            <span className="p-inputgroup-addon">
              <i className="pi pi-building" />
            </span>
            <InputText
              id="address2"
              className="w-full"
              name="address2"
              value={addressData.address2}
              onChange={onChange}
              placeholder="Piso, puerta, etc."
            />
          </div>
        </div>
      </div>
      {/* Segunda fila: Código Postal y Ciudad */}
      <div className="p-grid" style={{ marginBottom: "1rem" }}>
        <div className="p-col-6">
          <div className="p-inputgroup w-full">
            <span className="p-inputgroup-addon">
              <i className="pi pi-map-marker" />
            </span>
            <InputText
              id="postcode"
              className="w-full"
              name="postcode"
              value={addressData.postcode}
              onChange={onChange}
              placeholder="Código Postal"
            />
          </div>
        </div>
        <div className="p-col-6">
          <div className="p-inputgroup w-full">
            <span className="p-inputgroup-addon">
              <i className="pi pi-map" />
            </span>
            <InputText
              id="city"
              className="w-full"
              name="city"
              value={addressData.city}
              onChange={onChange}
              placeholder="Ciudad"
            />
          </div>
        </div>
      </div>
      {/* Tercera fila: Teléfono/Móvil */}
      <div className="p-grid" style={{ marginBottom: "1rem" }}>
        <div className="p-col-12">
          <div className="p-inputgroup w-full">
            <span className="p-inputgroup-addon">
              <i className="pi pi-phone" />
            </span>
            <InputText
              id="phone_combined"
              className="w-full"
              name="phone_combined"
              value={addressData.phone || addressData.phone_mobile}
              onChange={(e) => {
                const value = e.target.value;
                setAddressData((prev) => ({
                  ...prev,
                  phone: value,
                  phone_mobile: value,
                }));
              }}
              placeholder="Teléfono / Móvil"
            />
          </div>
        </div>
      </div>
      {addressData.isCompanyInvoice && (
        <div className="p-grid" style={{ marginBottom: "1rem" }}>
          <div className="p-col-6">
            <div className="p-inputgroup w-full">
              <span className="p-inputgroup-addon">
                <i className="pi pi-briefcase" />
              </span>
              <InputText
                id="company"
                className="w-full"
                name="company"
                value={addressData.company || ""}
                onChange={onChange}
                placeholder="Nombre de la empresa"
              />
            </div>
          </div>
          <div className="p-col-6">
            <div className="p-inputgroup w-full">
              <span className="p-inputgroup-addon">
                <i className="pi pi-id-card" />
              </span>
              <InputText
                id="dni"
                className="w-full"
                name="dni"
                value={addressData.dni || ""}
                onChange={onChange}
                placeholder="DNI / CIF"
              />
            </div>
          </div>
        </div>
      )}
      <div
        className="p-d-flex p-ai-center p-mb-3"
        style={{ gap: "0.5rem", marginBottom: "1rem" }}
      >
        <input
          type="checkbox"
          name="isCompanyInvoice"
          checked={addressData.isCompanyInvoice || false}
          onChange={(e) =>
            setAddressData((prev) => ({
              ...prev,
              isCompanyInvoice: e.target.checked,
            }))
          }
          style={{ cursor: "pointer" }}
        />
        <span>Empresa/Factura</span>
      </div>
      <div className="mt-4">
        <h3 className="font-bold mb-2">Ubicación</h3>
        <label htmlFor="id_state" className="block mb-1">
          Estado
        </label>
        <select
          name="id_state"
          value={addressData.id_state || ""}
          onChange={(e) => {
            const newIdState = e.target.value;
            // Mantener id_country por defecto en 6 (España)
            setAddressData((prev) => ({
              ...prev,
              id_state: newIdState,
              id_country: prev.id_country || 6,
            }));
          }}
          className="w-full p-2 border rounded mb-2"
        >
          <option value="">Seleccione un estado</option>
          {SPAIN_STATES.map((st) => (
            <option key={st.value} value={st.value}>
              {st.label}
            </option>
          ))}
        </select>
      </div>
      {errorMessage && (
        <div className="p-mb-3" style={{ color: "var(--red-500)" }}>
          {errorMessage}
        </div>
      )}
    </div>
  );
}
