# TPV App – Resumen y Guía de Diseño

Este proyecto es una aplicación de TPV (Terminal Punto de Venta) desarrollada en React que integra PrimeReact para componentes de interfaz y Tailwind CSS para estilos. Se ha diseñado de forma modular, utilizando Context API y hooks personalizados para gestionar la lógica de negocio, lo que facilita la escalabilidad y el mantenimiento. La aplicación abarca funcionalidades de ventas, devoluciones, descuentos, gestión de stock y configuración, adaptándose tanto a dispositivos de escritorio como móviles.

---

## Tecnologías Utilizadas

- **React**: Biblioteca para construir interfaces de usuario.
- **PrimeReact**: Conjunto de componentes UI ricos, personalizables y adaptados al diseño.
- **Tailwind CSS**: Framework utilitario para un estilo consistente y flexible.
- **React Router**: Gestión de la navegación entre páginas.
- **Context API & Hooks Personalizados**: Para gestionar estados globales (Autenticación, Configuración, Clientes, PIN) y lógica de negocio (carrito, descuentos, finalización de ventas, etc.).
- **Otras bibliotecas**: Sonner (notificaciones), entre otras.

---

## Estructura del Proyecto

El proyecto se organiza de la siguiente manera:

- **`src/`**  
  - **`components/`**: Contiene componentes reutilizables, modales, páginas (Login, NotFound, Pin, etc.) y reportes.
  - **`contexts/`**: Define los contextos para la autenticación, configuración, clientes y PIN.
  - **`hooks/`**: Hooks personalizados como `useCart`, `useDiscounts`, `useFinalizeSale`, `useApiFetch`, etc.
  - **`data/`**: Archivos estáticos con datos de empleados, tiendas y configuraciones (ej. ticket).
- **`public/`**  
  - Archivos estáticos, assets y hojas de estilos de temas (por ejemplo, para modo claro y oscuro).

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
  