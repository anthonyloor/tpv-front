import React from "react";
import { InputText } from "primereact/inputtext";

export default function AddressForm({ addressData, onChange, setAddressData, errorMessage }) {
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
                setAddressData((prev) => ({ ...prev, phone: value, phone_mobile: value }));
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
      <div className="p-d-flex p-ai-center p-mb-3" style={{ gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          type="checkbox"
          name="isCompanyInvoice"
          checked={addressData.isCompanyInvoice || false}
          onChange={(e) => setAddressData((prev) => ({ ...prev, isCompanyInvoice: e.target.checked }))}
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
            let id_country = "";
            switch (newIdState) {
              case "313":
                id_country = "ES";
                break;
              default:
                id_country = addressData.id_country || "";
            }
            setAddressData((prev) => ({ ...prev, id_state: newIdState, id_country }));
          }}
          className="w-full p-2 border rounded mb-2"
        >
          <option value="">Seleccione un estado</option>
          <option value="343">Madrid</option>
          <option value="313">A Coruña</option>
          <option value="314">Álava</option>
          <option value="315">Albacete</option>
          <option value="316">Alacant</option>
          <option value="317">Almería</option>
          <option value="318">Asturias</option>
          <option value="319">Ávila</option>
          <option value="320">Badajoz</option>
          <option value="322">Barcelona</option>
          <option value="323">Burgos</option>
          <option value="324">Cáceres</option>
          <option value="325">Cádiz</option>
          <option value="326">Cantabria</option>
          <option value="327">Castelló</option>
          <option value="328">Ciudad Real</option>
          <option value="329">Córdoba</option>
          <option value="330">Cuenca</option>
          <option value="331">Girona</option>
          <option value="332">Granada</option>
          <option value="333">Guadalajara</option>
          <option value="334">Gipuzkoa</option>
          <option value="335">Huelva</option>
          <option value="336">Huesca</option>
          <option value="337">Jaén</option>
          <option value="338">La Rioja</option>
          <option value="340">León</option>
          <option value="341">Lleida</option>
          <option value="342">Lugo</option>
          <option value="344">Málaga</option>
          <option value="345">Murcia</option>
          <option value="346">Nafarroa</option>
          <option value="347">Ourense</option>
          <option value="348">Palencia</option>
          <option value="349">Pontevedra</option>
          <option value="350">Salamanca</option>
          <option value="352">Segovia</option>
          <option value="353">Sevilla</option>
          <option value="354">Soria</option>
          <option value="355">Tarragona</option>
          <option value="356">Teruel</option>
          <option value="357">Toledo</option>
          <option value="358">València</option>
          <option value="359">Valladolid</option>
          <option value="360">Bizkaia</option>
          <option value="361">Zamora</option>
          <option value="362">Zaragoza</option>
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
