# Proyecto TPV con PrimeReact y Tailwind

Este proyecto es una aplicación de Punto de Venta (TPV) que utiliza PrimeReact para los componentes de la interfaz (botones, diálogos, tablas, etc.) y TailwindCSS para estilos adicionales. El objetivo principal es proporcionar un flujo de trabajo fluido para la gestión de clientes, direcciones, creación de nuevos clientes/direcciones, tickets aparcados, entre otras funcionalidades.

## Tecnologías y Librerías

- **React:** Librería base para la construcción de la interfaz de usuario.
- **PrimeReact:**
  - Componentes UI: Diálogos, pasos (Steps), tablas (DataTable), barras de herramientas (Toolbar), botones (Button), inputs (InputText), iconos (primeicons), etc.
  - Temas: Se aplican temas (lara-light-indigo, lara-dark-indigo, etc.) para alternar entre modo claro y oscuro.
  - Transiciones: Algunos componentes incluyen animaciones o transiciones incorporadas.
- **TailwindCSS:**
  - Utilizado para utilidades rápidas en el layout, márgenes, paddings, tipografía, etc.
  - Se ha desactivado preflight en algunos casos para no sobrescribir estilos de PrimeReact.
- **PrimeFlex:** Librería de utilidades CSS (flex, grid, espaciado) complementaria a PrimeReact.
- **Otros:**
  - `react-router-dom` para enrutamiento.
  - `useApiFetch` (hook personalizado) para llamadas a la API.
  - `sonner` para notificaciones.
  - Contextos (AuthContext, ClientContext, ConfigContext) para gestionar autenticación, configuración y cliente seleccionado.

## Diseño y Estilo

- **Tema de PrimeReact:**  
  El HTML principal carga un `<link id="theme-link" ...>` que apunta al archivo de tema de PrimeReact, controlando el aspecto global (colores, botones, inputs, diálogos, etc.).
- **TailwindCSS:**  
  Se utiliza en conjunto con PrimeReact para definir la maquetación mediante clases utilitarias (flex, grid, p-4, etc.), manteniendo PrimeReact como proveedor de los componentes UI principales.

- **Modo Claro/Oscuro:**  
  Soporta la alternancia entre temas claros y oscuros (por ejemplo, `lara-light-indigo/theme.css` y `lara-dark-indigo/theme.css`) mediante el intercambio dinámico del `<link>` en el HTML.

- **Diálogos (Dialog):**  
  La aplicación utiliza diálogos superpuestos para flujos como la selección de cliente, direcciones, creación de clientes, etc.

- **Steps (Paso a Paso):**  
  Se utiliza el componente `Steps` de PrimeReact para crear wizards (o steppers), por ejemplo, en el flujo de selección y creación de clientes y direcciones.

## Estructura de Componentes Relevantes

A continuación se listan los componentes principales relacionados con la gestión de clientes y direcciones:

1. **CustomerStepperModal.jsx**

   - **Propósito:**  
     Proporciona un flujo tipo wizard en dos pasos para:
     1. Seleccionar o crear un cliente.
     2. Seleccionar o crear una dirección.
   - **Uso de PrimeReact:**
     - `<Dialog>` para mostrar el modal principal.
     - `<Steps>` para indicar y navegar entre los pasos.
     - `<Toolbar>` para los botones de acciones (crear, editar, eliminar).
     - `<DataTable>` y `<Column>` para listar los clientes.
   - **Flujo de trabajo:**  
     El usuario busca o crea un cliente, luego selecciona o crea una dirección. Al confirmar, se ejecuta un callback que notifica al componente padre la combinación de cliente y dirección elegida.

2. **CreateCustomerModal.jsx y CreateAddressModal.jsx**

   - **Propósito:**  
     Permiten la creación de nuevos clientes y direcciones, integrándose en el flujo del CustomerStepperModal.
   - **CreateCustomerModal.jsx:**
     - Se abre un diálogo en dos pasos:
       - Paso 1: Recoger los datos básicos del cliente (nombre, apellidos, email, contraseña, etc.).
       - Paso 2: Recoger los datos de la dirección (calle, ciudad, teléfono, etc.).
     - Utiliza componentes como:
       - `<Dialog>` para el modal.
       - `<InputText>` para la entrada de datos.
       - `<Button>` para la navegación interna (Atrás, Crear Cliente, Crear Dirección).
     - Emplea el callback `onComplete(newClient, newAddress)` para devolver el cliente (y la dirección, si procede).
   - **CreateAddressModal.jsx:**
     - Ofrece un diálogo sencillo para crear una dirección asociada a un cliente (se recibe `clientId` como parámetro).
     - Utiliza:
       - `<Dialog>` para el modal.
       - `<InputText>` para los campos necesarios.
       - `<Button>` para confirmar o cancelar la acción.
     - Notifica al componente padre mediante `onAddressCreated(newAddress)` sobre la nueva dirección creada.

3. **AddressModal.jsx**

   - **Propósito:**  
     Muestra un diálogo con todas las direcciones asociadas a un cliente específico, permitiendo al usuario seleccionar una de ellas.
   - **Uso:**
     - `<Dialog>` se usa para el modal.
     - `<Card>` presenta cada dirección de forma ordenada.
     - Incluye un botón “Crear dirección” que abre el CreateAddressModal en caso de que se requiera agregar una nueva.

4. **ClientInfoDialog.jsx**

   - **Propósito:**  
     Muestra un diálogo con la información detallada de un cliente, permitiendo al usuario ver datos adicionales al hacer clic en cualquiera de ellos.
   - **Uso:**
     - Se utiliza `<Dialog>` para mostrar la información en un modal.

5. **CustomerModal.jsx (Antiguo / Reemplazado)**

   - **Propósito:**  
     Representaba una versión previa para la selección de cliente y dirección sin usar el paso a paso (wizard).
   - **Notas:**  
     Actualmente, en la mayoría de casos se ha sustituido por el CustomerStepperModal, pero puede mantenerse para flujos más simples si es necesario.

6. **SalesCard.jsx (Ejemplo de uso)**
   - **Propósito:**  
     Forma parte de la pantalla principal del TPV, donde se muestran los productos agregados al carrito, descuentos, totales, entre otros.
   - **Relevancia:**
     - Gestiona la selección de clientes y direcciones a través de la apertura de CustomerStepperModal o AddressModal.
     - Integra componentes como `<SplitButton>` para acciones adicionales y `<Dialog>` para la gestión de tickets aparcados (guardar, cargar, borrar).

Este README resume la arquitectura y el diseño general del proyecto TPV, destacando la integración de PrimeReact y TailwindCSS para lograr una interfaz de usuario moderna y responsive.
