# Arquitectura del proyecto

Este documento complementa el README con una visión de alto nivel de la estructura de código de *TPV App*.

## Estructura general

```
public/       Recursos estáticos como `index.html`, sonidos y temas
src/
  App.jsx     Componente principal y enrutado de la aplicación
  DesktopTPV.jsx / MobileDashboard.jsx
               Interfaces para escritorio y móvil
  components/ Componentes reutilizables y modales
  contexts/   Proveedores de contexto (auth, configuración, carrito, etc.)
  hooks/      Hooks personalizados para la lógica de negocio
  utils/      Funciones auxiliares (API, PDFs, etiquetas)
```

### Componentes
- **Navbar, Sales, ProductSearch, Stock**: tarjetas que componen la vista principal del TPV.
- **modals/**: diálogos para operaciones como licencias, transferencias, descuentos o control de stock.
- **pages/**: páginas de alto nivel (`LoginPage`, `PinPage`).

### Contextos y Hooks
- `AuthContext` gestiona la autenticación, datos de tienda y empleado.
- `CartContext` almacena el estado del carrito y métodos de pago.
- Otros contextos gestionan configuración, clientes y PIN.
- Hooks como `useCart`, `useDiscounts` o `useFinalizeSale` encapsulan la lógica de ventas.

### Utilidades
- `useApiFetch` centraliza llamadas a la API con manejo de expiración de sesión.
- `generatePriceLabels` y `generateSalesPdf` generan etiquetas y documentos en PDF.
- `getApiBaseUrl` determina la URL base de la API según el hostname.

## Flujo de inicio
1. `LoginPage` valida la licencia y permite seleccionar empleado.
2. Tras iniciar sesión se comprueba la sesión de caja y se abre `DesktopTPV` o `MobileDashboard` según el dispositivo.
3. `App.jsx` mantiene la comprobación de versión y avisa de expiración del token.

## Temas y estilos
Se utilizan **PrimeReact** y **Tailwind CSS**. Los temas se aplican mediante `ThemeSwitcher` y se cargan desde `public/themes`.

---
Este archivo sirve como guía rápida de la organización del proyecto para nuevos desarrolladores o para la IA encargada de analizar el código.
