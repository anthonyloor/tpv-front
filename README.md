# TPV App – Resumen y Guía de Diseño

Este proyecto es una aplicación de TPV (Terminal Punto de Venta) desarrollada en React que integra PrimeReact para componentes de interfaz y Tailwind CSS para estilos. Se ha diseñado de forma modular, utilizando Context API y hooks personalizados para gestionar la lógica de negocio, lo que facilita la escalabilidad y el mantenimiento. La aplicación abarca funcionalidades de ventas, devoluciones, descuentos, gestión de stock y configuración, adaptándose tanto a dispositivos de escritorio como móviles.

---

## TPV Frontend

Aplicación React para gestionar un TPV (Terminal Punto de Venta) multi-tienda:

### Características principales

- Gestión de licencias y autenticación de empleados.
- Flujo POS: apertura, continuación o cierre de caja.
- Movimientos de inventario: entrada, salida y traspasos entre tiendas.
- Impresión de etiquetas de precio con código de barras.
- Gestión de configuración (impresoras, permisos) vía modales.

### Tecnologías

- React, React Router, Context API.
- Tailwind CSS, PrimeReact, PrimeFlex, PrimeIcons.
- Hooks personalizados: `useApiFetch`, `useProductSearch`, `useTokenExpiryWarning`, etc.
- Librerías: `jsbarcode`, `react-device-detect`.

### Estructura del proyecto

src/
├─ components/
│  ├─ pages/            # LoginPage, PinPage, dashboards
│  ├─ base/             # PrivateRoute
│  ├─ modals/           # License, POS, session, transfers, configuración
│  └─ ThemeSwitcher.jsx
├─ contexts/            # Auth, Config, Client, Pin, Cart
├─ hooks/               # useApiFetch, useEmployeesDictionary, ...
├─ utils/               # getApiBaseUrl, generatePriceLabels, ...
├─ App.jsx, index.js
└─ index.css

### Flujo de uso

1. **Licencia**: validación en `LicenseModal`.
2. **Login**: selección de empleado y contraseña.
3. **POS**: comprobación de sesión (`check_pos_session`), apertura (`OpenPosModal`) o continuación (`PosSessionOpenModal`).
4. **Movimientos**: creación/edición/ejecución de entradas, salidas y traspasos en `TransferForm`.
5. **Etiquetas**: generación vía `/get_product_price_tag` y `generatePriceLabels`.
6. **Temas y sesión**: detección móvil, cambio de tema y aviso de expiración de token.

### Instalación y ejecución

```bash
npm install
npm start       # modo desarrollo
npm run build   # producción
```

---

## Tecnologías Utilizadas

- **React**: Biblioteca para construir interfaces de usuario.
- **PrimeReact**: Conjunto de componentes UI ricos, personalizables y adaptados al diseño.
- **Tailwind CSS**: Framework utilitario para un estilo consistente y flexible.
- **React Router**: Gestión de la navegación entre páginas.
- **Context API & Hooks Personalizados**: Para gestionar estados globales (Autenticación, Configuración, Clientes, PIN) y lógica de negocio (carrito, descuentos, finalización de ventas, etc.).
- **Otras bibliotecas**: Sonner (notificaciones), entre otras.

---

## Diseño y Estilo

El diseño de la aplicación se centra en la integración de PrimeReact y Tailwind CSS para lograr una interfaz coherente y adaptable. Algunos puntos clave son:

- **Variables y Temas CSS**  
  Se usan variables CSS (por ejemplo, `var(--surface-0)`, `var(--text-color)`, `var(--surface-border)`) para definir colores, fondos, bordes y tipografías. Esto permite mantener una identidad visual uniforme en toda la aplicación.

- **Modo Claro/Oscuro**  
  A través del componente `ThemeSwitcher` se pueden alternar entre temas (por ejemplo, `lara-light-indigo` y `lara-dark-indigo`). Las hojas de estilo de cada tema se encuentran en la carpeta `public/themes/`.

- **Consistencia en Componentes**  
  Todos los componentes (modales, formularios, tablas, botones, etc.) utilizan clases utilitarias de Tailwind CSS junto con los estilos propios de PrimeReact. Esto asegura:
  - **Colores y Tipografía:** Uso de las variables globales para mantener coherencia.
  - **Espaciados y Tamaños:** Uso de clases como `p-4`, `m-2`, etc., para definir márgenes, padding y tamaños de forma uniforme.
  - **Componentes Modales y Diálogos:** Se ha creado un componente base (`Modal.jsx`) que se extiende en todos los diálogos, garantizando transiciones, botones y cabeceras con el mismo estilo.
  
- **Guía para Crear Nuevos Componentes**  
  Para extender la aplicación o agregar nuevos elementos manteniendo la coherencia visual, se recomienda:
  1. **Utilizar las Variables CSS:** Emplear siempre las variables definidas para fondos, textos y bordes.
  2. **Seguir la Estructura Modular:** Ubicar nuevos componentes en la carpeta `components/` y, en caso de ser modales o diálogos, basarse en el componente `Modal.jsx`.
  3. **Aplicar Clases de Tailwind y PrimeReact:** Usar las clases ya establecidas en el proyecto (por ejemplo, `p-button`, `p-datatable`, etc.) para lograr el mismo tamaño, espaciado y estilo.
  4. **Pruebas de Responsividad:** Verificar que los nuevos componentes se comporten de manera consistente en dispositivos móviles y de escritorio.

---

Licencia MIT.
