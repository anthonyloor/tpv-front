# Proyecto TPV con PrimeReact y Tailwind CSS

Este proyecto es una aplicación de Punto de Venta (TPV) que utiliza PrimeReact para los componentes de la interfaz de usuario y Tailwind CSS para la gestión de estilos. El objetivo es proporcionar una solución eficiente y visualmente atractiva para la gestión de ventas y stock.

## Tecnologías Utilizadas

- **React:** Biblioteca de JavaScript para construir interfaces de usuario.
- **PrimeReact:** Conjunto de componentes de interfaz de usuario ricos y personalizables para React.
- **Tailwind CSS:** Framework de CSS utilitario para un diseño rápido y flexible.
- **PrimeFlex:** Sistema de diseño basado en Flexbox, complementario a PrimeReact.
- **react-router-dom:** Para la gestión de la navegación dentro de la aplicación.
- **useApiFetch:** Hook personalizado para simplificar las llamadas a la API.
- **sonner:** Biblioteca para mostrar notificaciones de forma elegante.
- **Contextos (AuthContext, ClientContext, ConfigContext):** Para la gestión del estado global de la aplicación, como la autenticación, la información del cliente y la configuración.

## Estructura del Proyecto

La estructura del proyecto está organizada en componentes reutilizables, cada uno con una responsabilidad específica. Algunos de los componentes clave incluyen:

- **Componentes de la Interfaz de Usuario:** Implementados con PrimeReact, ofrecen una amplia gama de funcionalidades, desde la visualización de datos hasta la interacción del usuario.
- **Componentes de Estilo:** Definen la apariencia visual de la aplicación, utilizando Tailwind CSS para una fácil personalización y mantenimiento.
- **Componentes de Lógica de Negocio:** Contienen la lógica específica de la aplicación, como la gestión de ventas, el control de stock y la interacción con la API.

## Configuración y Personalización

- **Temas de PrimeReact:** La aplicación permite cambiar entre diferentes temas de PrimeReact para adaptarse a las preferencias del usuario o a los requisitos de la marca.
- **Estilos de Tailwind CSS:** Tailwind CSS se utiliza para personalizar aún más la apariencia de la aplicación, permitiendo un control preciso sobre cada elemento visual.
- **Desactivación de Preflight:** En algunos casos, se ha desactivado la característica "preflight" de Tailwind CSS para evitar conflictos con los estilos predeterminados de PrimeReact.

## Componentes Destacados

- **CustomerStepperModal:** Proporciona un flujo paso a paso para la selección o creación de clientes y direcciones.
- **CreateCustomerModal y CreateAddressModal:** Permiten la creación de nuevos clientes y direcciones de forma modular.
- **SalesCardActions:** Ofrece acciones rápidas para la gestión de ventas, como la aplicación de descuentos y la finalización de la venta.
- **StoreStockPanel:** Muestra información detallada sobre el stock de un producto en diferentes tiendas.

## Integración de PrimeReact y Tailwind CSS

La combinación de PrimeReact y Tailwind CSS permite crear una interfaz de usuario rica y flexible. PrimeReact proporciona los componentes de interfaz de usuario, mientras que Tailwind CSS se encarga de los estilos y el diseño. La desactivación de "preflight" en Tailwind CSS asegura que los estilos de PrimeReact se mantengan intactos.

## Conclusión

Este proyecto TPV es un ejemplo de cómo combinar las fortalezas de PrimeReact y Tailwind CSS para crear una aplicación de gestión de ventas eficiente y visualmente atractiva. La estructura modular y la fácil personalización permiten adaptar la aplicación a diferentes necesidades y requisitos.
