# TPV App

Aplicación de Terminal Punto de Venta construida con **React**, **PrimeReact** y **Tailwind CSS**. El proyecto está organizado de forma modular mediante Context API y hooks personalizados para mantener una base de código escalable.

## Características principales

- Validación de licencias y autenticación de empleados.
- Gestión completa del flujo de caja (apertura, continuación y cierre).
- Módulos de ventas, devoluciones y descuentos integrados en el carrito.
- Movimientos de inventario (entradas, salidas y traspasos entre tiendas).
- Generación de etiquetas de precio y documentos en PDF.
- Soporte para modo claro/oscuro y detección de dispositivo móvil.

## Estructura del proyecto

```
public/       Archivos estáticos y temas
src/
  App.jsx     Enrutado y lógica principal
  DesktopTPV.jsx / MobileDashboard.jsx
               Interfaces para escritorio y móvil
  components/ Componentes y modales reutilizables
  contexts/   Proveedores de estado global
  hooks/      Lógica de negocio en hooks personalizados
  utils/      Funciones auxiliares y llamadas a API
```

Consulta [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para una descripción más detallada.

## Instalación y uso

```bash
npm install
npm start       # modo desarrollo
npm run build   # producción
```

## Estilo y temas

Los estilos se basan en PrimeReact y Tailwind. La aplicación utiliza variables CSS definidas en los temas de `public/themes` y puede alternar entre modo claro y oscuro mediante `ThemeSwitcher`.

## Contribuciones

1. Crea una rama desde `main`.
2. Realiza tus cambios siguiendo la estructura existente.
3. Abre un pull request describiendo el propósito de la modificación.

## Licencia

MIT
