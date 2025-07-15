# Búsqueda de productos

Este documento explica el uso del hook `useProductSearchOptimized` y los modos disponibles para localizar productos o aplicar vales descuento.

## Descripción general

`useProductSearchOptimized` centraliza la lógica de búsqueda de productos. Realiza dos peticiones a la API:

1. `/product_search` para obtener la información básica del producto.
2. `/get_controll_stock_filtered` para recuperar, de forma asíncrona, los controles de stock asociados a los EAN13 devueltos.

Los datos se agrupan por combinaciones y se enriquecen con los controles de stock una vez que la primera llamada finaliza.

El hook expone los manejadores necesarios para añadir productos al ticket, confirmar cantidades y gestionar diálogos de confirmación. Es una versión optimizada que sustituye al antiguo `useProductSearch`.

## Modos de búsqueda

El comportamiento del hook varía según el formato del término de búsqueda:

### Referencia o nombre

- **Entrada:** cualquier cadena que no sea un EAN13 válido.
- **Función:** se consultan los productos que coinciden con la referencia introducida.
- **Resultado:** se muestran todas las coincidencias agrupadas por combinación.

### Código EAN13

- **Entrada:** cadena de 13 dígitos (por ejemplo `1234567890123`).
- **Función:** se busca el producto por su EAN13 y, tras cargar la información base, se solicita al endpoint `/get_controll_stock_filtered` los controles de stock de todos los EAN encontrados.
- **Resultado:** si existe una sola coincidencia se puede añadir al ticket directamente; de lo contrario se listan las combinaciones disponibles.

### EAN13 con seguimiento

- **Entrada:** `EAN13` seguido de un identificador de control de stock (por ejemplo `1234567890123`**`45`** donde `45` es el `id_control_stock`).
- **Función:** se recuperan los controles de stock del EAN13 y se filtra por el identificador indicado. Si el control está activo puede añadirse automáticamente al ticket.
- **Resultado:** si el control no existe o el producto pertenece a otra tienda se muestran diálogos de confirmación.

### Vale descuento

- **Entrada:** cadena que comienza por `#` (por ejemplo `#DESCUENTO10`).
- **Función:** se consulta el endpoint de vales descuento y, si es válido, se añade automáticamente al ticket mediante `onAddDiscount`.
- **Resultado:** el hook no devuelve productos, pero aplica el descuento al carrito activo.
- **Nota:** si la respuesta incluye `restrictions.shop` con identificadores de tienda, el vale solo se aplicará cuando la tienda actual forme parte de dicha lista.

## Uso en componentes

Importa el hook desde `src/hooks` y pásale las funciones necesarias:

```javascript
const {
  groupedProducts,
  isLoading,
  handleSearch,
  addProductToCart
} = useProductSearchOptimized({
  apiFetch,
  shopId,
  allowOutOfStockSales,
  onAddProduct,
  onAddDiscount,
  idProfile,
  selectedClient
});
```

`handleSearch` acepta el término introducido y puede recibir dos argumentos opcionales para búsquedas específicas de stock o para omitir el filtrado por tienda.

Consulta los componentes `ProductSearchCard.jsx` u otros modales para ver ejemplos de integración.

