# Plan de Implementación: Calculadora de Costos de Impresión 3D

Desarrollar una aplicación web de una sola página (SPA) interactiva, responsiva y con una estética premium para calcular costos de impresión 3D. La aplicación permitirá gestionar perfiles de filamentos e impresoras utilizando el almacenamiento local (`localStorage`) y descargar cotizaciones formales en formato PDF.

## User Review Required

> [!IMPORTANT]
> **Persistencia en LocalStorage:** Toda la información de impresoras, filamentos y ajustes generales se guardará directamente en el navegador del usuario. Si se borran los datos de navegación o se usa el modo incógnito, se restablecerán los valores por defecto. Se ha incluido en los ajustes un botón para restablecer la base de datos por defecto.

> [!NOTE]
> **Generación de PDF:** Usaremos la librería `html2pdf.js` desde CDN. Esto nos permite diseñar un contenedor HTML oculto (o con estilos específicos) estructurado como un comprobante/cotización profesional y transformarlo en PDF de forma exacta a cómo se ve visualmente.

## Open Questions

*No hay preguntas abiertas pendientes*, ya que hemos definido todos los detalles clave a través de la entrevista interactiva:
1. **Tipo de app:** Web interactiva (HTML/CSS/JS cliente) corriendo en navegador.
2. **Componentes de costo:** Filamento, depreciación de impresora (basada en horas de vida útil y costo, con override), electricidad (Watts y precio kWh), mano de obra de preparación, y post-procesado (costo fijo por proyecto + tarifa horaria).
3. **Márgenes:** Margen de falla y margen de ganancia.
4. **Persistencia:** Perfiles de filamentos e impresoras en `localStorage`.
5. **Moneda:** Símbolo de pesos/dólares (`$`) por defecto.
6. **Exportación:** Generador de PDF integrado vía JS (`html2pdf.js`).
7. **Diseño:** Tema dual (Dark/Light mode) con estética premium, bordes redondeados y micro-interacciones suaves.

---

## Proposed Changes

### Interfaz y Lógica del Frontend (HTML / CSS / JavaScript)

Crearemos los archivos fundamentales de la aplicación en la raíz del proyecto.

#### [NEW] [index.html](file:///d:/Proyectos/Calculadora%20costo%203D/index.html)
- Estructura base HTML5 con carga de tipografías desde Google Fonts (Outfit).
- Inclusión de la hoja de estilos y el script principal.
- Importación de `html2pdf.js` vía CDN.
- Layout principal con barra lateral o superior de navegación (Pestañas: Calculadora, Materiales, Impresoras, Ajustes) y un botón de toggle para el tema (Dark/Light).
- Diseño de la pestaña **Calculadora**:
  - Panel izquierdo: Formulario con selectores de impresoras y filamentos guardados, campos para peso de la pieza (g), tiempo de impresión (horas/minutos), mano de obra (horas) y post-procesamiento (horas y costo fijo), y campos de entrada rápida para sobreescribir los márgenes si se desea.
  - Panel derecho: Tarjeta de resultados en tiempo real que muestre el desglose detallado de costos (Material, Depreciación, Electricidad, Mano de Obra, Post-procesado, Margen de Falla, Margen de Ganancia) mediante barras de progreso estilizadas o gráfico dinámico SVG.
  - Botón de descarga para generar la cotización formal en PDF.
- Diseño de las pestañas **Materiales** e **Impresoras**:
  - Listado en formato tarjeta o tabla moderna de los perfiles guardados.
  - Formularios modales o paneles integrados para añadir y editar perfiles con validación de datos.
- Diseño de la pestaña **Ajustes**:
  - Formulario para guardar valores globales por defecto (tarifa de mano de obra, tarifa de post-procesado, costo de kWh, márgenes por defecto).
  - Botón para restaurar datos iniciales de prueba (Seed).
- Estructura oculta o plantilla especial que se usará para renderizar y descargar el PDF de la cotización formal.

#### [NEW] [style.css](file:///d:/Proyectos/Calculadora%20costo%203D/style.css)
- Configuración de variables CSS (`--primary`, `--background`, `--card-bg`, `--text-main`, etc.) con valores diferenciados para el tema oscuro (por defecto) y el tema claro.
- Reglas generales de tipografía (Outfit), reseteo de márgenes y centrado de la aplicación.
- Estilos responsivos usando CSS Grid y Flexbox.
- Estilos premium:
  - Efectos de vidrio templado (glassmorphism) en tarjetas con `backdrop-filter: blur()`.
  - Bordes redondeados modernos, sombras suaves y degradados atractivos en los botones de acción principal.
  - Animaciones de hover y foco con transiciones suaves (`transition: all 0.3s ease`).
  - Animación sutil de entrada para los elementos de resultados.
- Estilos especiales `@media print` y reglas CSS específicas para el contenedor del PDF para asegurar que el documento exportado tenga una calidad editorial (hoja membretada, colores contrastantes, distribución limpia).

#### [NEW] [app.js](file:///d:/Proyectos/Calculadora%20costo%203D/app.js)
- Inicialización y carga de datos desde `localStorage`. Carga de datos iniciales (Seed) en caso de que sea la primera ejecución.
- Lógica de navegación por pestañas (cambiar la clase activa y mostrar/ocultar secciones).
- Lógica de alternancia del tema (guardando la preferencia del usuario en `localStorage`).
- Controladores para añadir, editar y eliminar perfiles de impresoras y filamentos.
- Cálculos dinámicos (reactivos a cualquier cambio en los campos de entrada de la Calculadora):
  - Cálculo de filamento, depreciación de impresora (con override si se activa), consumo eléctrico, mano de obra general, post-procesado y suma de márgenes.
  - Actualización dinámica del DOM con los resultados detallados y los porcentajes de cada componente de costo sobre el total.
- Función para exportar a PDF:
  - Recopilación de los datos de la cotización actual.
  - Rellenado dinámico de la plantilla de cotización en el DOM.
  - Ejecución de `html2pdf()` con configuraciones de calidad y descarga inmediata del archivo PDF con un nombre descriptivo (ej. `cotizacion_impresion_3d_<fecha>.pdf`).

---

## Verification Plan

### Manual Verification
1. **Verificación de Carga y Semilla:** Al abrir por primera vez la aplicación en el navegador, comprobar que se precarguen las impresoras y filamentos por defecto y que las tarifas iniciales se visualicen correctamente en la pestaña de Ajustes.
2. **Verificación de Reactividad de Cálculos:** Introducir diferentes pesos de filamento y tiempos de impresión para verificar que los costos se actualicen en tiempo real sin necesidad de recargar la página.
3. **Validación de Persistencia:**
   - Añadir una nueva impresora y un nuevo filamento.
   - Recargar la página y verificar que sigan apareciendo en los selectores de la Calculadora.
   - Editar una impresora y ver si el costo por hora se recalcula en las estimaciones.
4. **Verificación de Temas (Claro/Oscuro):** Alternar el tema y corroborar la legibilidad de todos los textos, inputs y tarjetas.
5. **Exportación a PDF:** Generar una cotización, presionar el botón de exportación, abrir el PDF descargado y comprobar que tenga un aspecto limpio, profesional y bien estructurado (sin elementos de navegación web ni botones).
