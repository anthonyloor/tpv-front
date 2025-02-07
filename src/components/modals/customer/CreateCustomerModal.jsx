import React, { useState, useContext } from "react";
import Modal from "../Modal";
import { AuthContext } from "../../../contexts/AuthContext";
import { useApiFetch } from "../../../components/utils/useApiFetch";

const CreateCustomerModal = ({ isOpen, onClose, onComplete }) => {
  const [step, setStep] = useState(1);
  const apiFetch = useApiFetch();
  const { shopId } = useContext(AuthContext);
  const [customerData, setCustomerData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    id_shop: shopId,
    id_default_group: 3,
  });
  const [addressData, setAddressData] = useState({
    id_country: 6,
    id_state: "",
    alias: "direccion-tpv",
    company: "",
    lastname: "",
    firstname: "",
    address1: "",
    address2: "",
    postcode: "",
    city: "",
    other: "",
    phone: "",
    phone_mobile: "",
    vat_number: "",
    dni: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [newCustomerId, setNewCustomerId] = useState(null);

  const [isNoWeb, setIsNoWeb] = useState(false);

  const generateRandomString = (length) => {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join("");
  };

  const handleNoWebToggle = (e) => {
    const checked = e.target.checked;
    setIsNoWeb(checked);
    if (checked) {
      const localPart = generateRandomString(7);
      const domain = generateRandomString(5);
      const email = `${localPart}@${domain}.com`;
      setCustomerData((prev) => ({
        ...prev,
        email,
        password: localPart, // La contraseña es la primera parte del correo
      }));
    } else {
      setCustomerData((prev) => ({
        ...prev,
        email: "",
        password: "",
      }));
    }
  };

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddressData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateCustomer = async () => {
    try {
      const data = await apiFetch(
        "https://apitpv.anthonyloor.com/create_customer",
        {
          method: "POST",
          body: JSON.stringify(customerData),
        }
      );
      if (data && data.id_customer) {
        setNewCustomerId(data.id_customer);
        // Asumimos que los nombres y apellidos del address deben coincidir con los del cliente
        setAddressData((prev) => ({
          ...prev,
          firstname: customerData.firstname,
          lastname: customerData.lastname,
        }));
        setStep(2);
        setErrorMessage("");
      } else {
        setErrorMessage("No se pudo crear el cliente.");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Error al crear el cliente.");
    }
  };

  const handleCreateAddress = async () => {
    try {
      const addressPayload = { ...addressData, id_customer: newCustomerId };
      const createdAddress = await apiFetch(
        "https://apitpv.anthonyloor.com/create_address",
        {
          method: "POST",
          body: JSON.stringify(addressPayload),
        }
      );

      // Llamar a onComplete con cliente y dirección creados si se proporcionó
      if (onComplete) {
        const createdClient = { ...customerData, id_customer: newCustomerId };
        onComplete(createdClient, createdAddress);
      }
      // Si se crea correctamente la dirección, cerrar el modal o reiniciar el flujo
      onClose();
    } catch (error) {
      console.error(error);
      setErrorMessage("Error al crear la dirección.");
    }
  };

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <div>
          <h3 className="font-bold mb-2">Paso 1: Crear Cliente</h3>
          <input
            type="text"
            name="firstname"
            placeholder="Nombre"
            value={customerData.firstname}
            onChange={handleCustomerChange}
            className="w-full p-2 border rounded mb-2"
          />
          <input
            type="text"
            name="lastname"
            placeholder="Apellidos"
            value={customerData.lastname}
            onChange={handleCustomerChange}
            className="w-full p-2 border rounded mb-2"
          />
          <div className="mb-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={isNoWeb}
                onChange={handleNoWebToggle}
              />
              <span className="ml-2">Cliente no web</span>
            </label>
          </div>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={customerData.email}
            disabled={isNoWeb}
            onChange={handleCustomerChange}
            className="w-full p-2 border rounded mb-2"
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={customerData.password}
            disabled={isNoWeb}
            onChange={handleCustomerChange}
            className="w-full p-2 border rounded mb-2"
          />
          {errorMessage && <p className="text-red-500 mb-2">{errorMessage}</p>}
          <div className="flex justify-end space-x-2">
            <button
              className="bg-gray-500 text-white px-4 py-2 rounded"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              className="bg-green-500 text-white px-4 py-2 rounded"
              onClick={handleCreateCustomer}
            >
              Crear Cliente
            </button>
          </div>
        </div>
      );
    } else if (step === 2) {
      return (
        <div>
          <h3 className="font-bold mb-2">Paso 2: Crear Dirección</h3>
          {/* Repetir para otros campos de la dirección según sea necesario */}
          <input
            type="text"
            name="address1"
            placeholder="Calle, Avenida, etc."
            value={addressData.address1}
            onChange={handleAddressChange}
            className="w-full p-2 border rounded mb-2"
          />
          <input
            type="text"
            name="address2"
            placeholder="Piso, puerta, etc."
            value={addressData.address2}
            onChange={handleAddressChange}
            className="w-full p-2 border rounded mb-2"
          />
          <input
            type="text"
            name="postcode"
            placeholder="Código Postal"
            value={addressData.postcode}
            onChange={handleAddressChange}
            className="w-full p-2 border rounded mb-2"
          />
          <input
            type="text"
            name="city"
            placeholder="Ciudad"
            value={addressData.city}
            onChange={handleAddressChange}
            className="w-full p-2 border rounded mb-2"
          />
          <input
            type="text"
            name="phone_combined"
            placeholder="Teléfono / Móvil"
            value={addressData.phone || addressData.phone_mobile}
            onChange={(e) => {
              const value = e.target.value;
              // Actualizamos ambos campos en el estado
              setAddressData((prev) => ({
                ...prev,
                phone: value,
                phone_mobile: value,
              }));
            }}
            className="w-full p-2 border rounded mb-2"
          />

          {addressData.isCompanyInvoice && (
            <div className="mt-2 space-y-2">
              <input
                type="text"
                name="company"
                placeholder="Nombre de la empresa"
                value={addressData.company || ""}
                onChange={handleAddressChange}
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                name="dni"
                placeholder="DNI / CIF"
                value={addressData.dni || ""}
                onChange={handleAddressChange}
                className="w-full p-2 border rounded"
              />
            </div>
          )}

          <label className="flex items-center space-x-2">
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
              className="form-checkbox"
            />
            <span>Empresa/Factura</span>
          </label>

          {/* Mensaje de error en los valores */}
          {errorMessage && <p className="text-red-500 mb-2">{errorMessage}</p>}

          {/* Sección de campos de IDs */}
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
                // Opcional: asignar id_country en función de id_state
                let id_country = "";
                switch (newIdState) {
                  case "313":
                    id_country = "ES";
                    break;
                  // Agregar más condiciones si es necesario
                  default:
                    id_country = addressData.id_country || "";
                }
                setAddressData((prev) => ({
                  ...prev,
                  id_state: newIdState,
                  id_country,
                }));
              }}
              className="w-full p-2 border rounded mb-2"
            >
              <option value="">Seleccione un estado</option>
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
              <option value="343">Madrid</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              className="bg-gray-500 text-white px-4 py-2 rounded"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              className="bg-green-500 text-white px-4 py-2 rounded"
              onClick={handleCreateAddress}
            >
              Crear Dirección
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 1 ? "Crear Cliente" : "Crear Dirección"}
      showCloseButton
      showBackButton={step === 2}
      onBack={() => (step === 2 ? setStep(1) : onClose())}
      size="lg"
      height="lg"
    >
      <div className="mb-4 text-sm text-gray-500">
        {step === 1
          ? "Paso 1: Crear Cliente -> Paso 2: Crear Dirección"
          : "Paso 2: Crear Dirección"}
      </div>
      {renderStepContent()}
    </Modal>
  );
};

export default CreateCustomerModal;
