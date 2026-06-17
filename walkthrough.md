# Resumen de Implementación: Calculadora de Costos de Impresión 3D

Hemos desarrollado y verificado la calculadora interactiva de costos para tu taller de impresión 3D. A continuación se detallan los componentes construidos, el funcionamiento de las fórmulas de cálculo y la evidencia visual de las pruebas realizadas.

---

## 1. Archivos Creados
1. **[index.html](file:///d:/Proyectos/Calculadora%20costo%203D/index.html):** Contiene la estructura semántica de la aplicación, el sistema de pestañas (Calculadora, Materiales, Impresoras, Ajustes), los formularios modales para añadir/editar perfiles, la sección de desglose dinámico y la plantilla estructurada para la exportación de PDF.
2. **[style.css](file:///d:/Proyectos/Calculadora%20costo%203D/style.css):** Define un diseño premium y responsivo que soporta un tema dual (Claro/Oscuro) mediante variables CSS. Utiliza fuentes estilizadas (Outfit de Google Fonts), bordes redondeados modernos, efectos de vidrio templado (glassmorphism), y estilos personalizados para impresión (`@media print`) y PDF.
3. **[app.js](file:///d:/Proyectos/Calculadora%20costo%203D/app.js):** Contiene el motor de cálculo en tiempo real, la gestión de base de datos local a través de `localStorage` (con datos semilla para agilizar el inicio), el manejo de eventos para los perfiles, y la exportación de PDF vía `html2pdf.js` utilizando una plantilla en limpio.

---

## 2. Fórmulas de Lote y Costo Aplicadas

El motor matemático en [app.js](file:///d:/Proyectos/Calculadora%20costo%203D/app.js) realiza los cálculos dinámicos de lote en tiempo real:
- **Camas/Lotes Requeridos:** $C_r = \lceil N / P_c \rceil$  *(donde $N$ es la Cantidad de Piezas y $P_c$ son las Piezas por Cama)*.
- **Material (Filamento) Total:** $\text{Peso Total (g)} = (N \times \text{Peso de la Pieza}) + (C_r \times D_c)$  *(donde $D_c$ es el Desperdicio por Cama)*.
- **Costo Filamento:** $\text{Costo Material} = \left( \frac{\text{Peso Total}}{\text{Peso Spool}} \right) \times \text{Precio Spool}$
- **Tiempo de Impresión Total ($T_t$):**
  - Modo *Por Pieza*: $T_t = \text{Tiempo Ingresado} \times N$
  - Modo *Por Cama*: $T_t = \text{Tiempo Ingresado} \times C_r$
- **Depreciación de Máquina:** $\text{Desgaste} = \text{Tarifa Desgaste por Hora} \times T_t$
- **Consumo Eléctrico:** $\text{Costo Energía} = \left(\frac{\text{Watts}}{1000}\right) \times T_t \times \text{Costo kWh}$
- **Mano de Obra General (Prep. única):** $\text{Costo Prep} = \text{Horas Prep} \times \text{Tarifa Mano Obra}$
- **Post-procesado (Lote completo):** $\text{Costo Post} = \text{Costo Fijo} + (\text{Horas Post} \times \text{Tarifa Post por Hora})$
- **Subtotal (Costo Producción):** Suma de todos los costos anteriores del lote completo.
- **Precio Sugerido Final:** $(\text{Subtotal} + \text{Costo Falla}) \times (1 + \text{Margen Ganancia})$
- **Precio Sugerido Unitario:** $\text{Precio Sugerido Final} / N$

---

## 3. Demostración Visual e Interfaz de Usuario

### Comparación de Temas (Tema Dual Premium)
````carousel
![Vista Inicial del Tema Oscuro (Calculadora)](C:/Users/esteb/.gemini/antigravity-ide/brain/fc471436-cdfc-4025-adc0-10249b77b57a/dark_theme_initial_1781655390769.png)
<!-- slide -->
![Vista del Tema Claro Toggled (Calculadora)](C:/Users/esteb/.gemini/antigravity-ide/brain/fc471436-cdfc-4025-adc0-10249b77b57a/light_theme_toggled_1781655444732.png)
````

### Grabación de Pruebas de Funcionamiento
Aquí se puede apreciar la sesión de prueba interactiva ejecutada por el agente de pruebas, donde se rellenan los datos del formulario, se verifica la reactividad de los cálculos y se descarga el documento PDF:

![Sesión de pruebas interactivas](C:/Users/esteb/.gemini/antigravity-ide/brain/fc471436-cdfc-4025-adc0-10249b77b57a/verify_calculator_ui_1781655038782.webp)

---

## 4. Resultados de la Verificación

Durante las pruebas se introdujeron los siguientes parámetros adaptados al mercado argentino:
- **Material:** PLA Genérico ($ 22.000 / 1000g)
- **Impresora:** Creality Ender 3 V2 (350W, depreciación de $ 160 / hora)
- **Peso de la pieza:** 150 g
- **Tiempo de Impresión:** 12 horas, 0 minutos (12 horas)
- **Preparación:** 1 hora
- **Post-procesado:** 2 horas
- **Costo Fijo de Post-procesado:** $ 5.000
- **Margen de Falla:** 10%
- **Margen de Ganancia:** 50%

### Resultados Matemáticos Obtenidos:
- **Costo Material:** $ 3.300
- **Costo Depreciación Máquina:** $ 1.920
- **Costo Electricidad (Tarifa $ 80/kWh):** $ 336
- **Mano de Obra General ($ 4.500/h):** $ 4.500
- **Mano de Obra Post-procesado + Fijo ($ 5.000/h + $ 5.000 fijo):** $ 15.000 ($ 10.000 de tiempo + $ 5.000 fijo)
- **Costo de Producción (Subtotal):** **$ 25.056** (Suma de los anteriores)
- **Margen de Falla (10%):** $ 2.506
- **Margen de Ganancia (50%):** $ 13.781 (basado en $ 25.056 + $ 2.506)
- **Precio Sugerido Final:** **$ 41.343** (Subtotal + Falla + Ganancia con redondeos sumados)

> [!TIP]
> **Exportación de PDF:** El archivo PDF generado contiene una cabecera membretada muy limpia y formal que resume estos detalles, óptima para enviar a tus clientes directamente por WhatsApp o Correo electrónico.

---

## 5. Resumen de la Sesión y Notas para Próximas Sesiones

### Logros de esta Sesión:
1. **MVP Funcional Completado:** Se crearon los archivos base de la aplicación (`index.html`, `style.css` y `app.js`).
2. **Localización de Moneda (ARS):** Se modificó la app para operar con pesos argentinos (sin centavos, con separador de miles con punto) y se cargaron valores semilla realistas para el mercado de Argentina.
3. **Mejora en Transparencia de Costos:** Se agregó el desglose del valor de Ganancia a la tarjeta del total de la calculadora y se sincronizó el redondeo de forma matemática exacta para evitar desfases de $1.
4. **Corrección Visual de Estilos:** Se arregló el error de espaciado que hacía que el símbolo `$` colisionara con los valores numéricos ingresados en inputs con formato de moneda.
5. **Cotización de Producción en Lotes y Variables de Cama:** Se implementó soporte completo para cotizar múltiples piezas:
   - Cálculo automático de camas necesarias.
   - Cálculo de desperdicios de material fijos por cama.
   - Selector dinámico de entrada de tiempo (tiempo ingresado *Por Pieza* o *Por Cama/Lote*).
   - Cálculo del precio unitario y precio total sugerido.
   - Inclusión de las variables de lote en el PDF.

### Estado del Proyecto:
- **Estable y Listo:** La aplicación corre de forma 100% local abriendo `index.html` en el navegador. Todos los perfiles modificados se persisten localmente en el `localStorage` del navegador del usuario.

### Próximas Funcionalidades / Ideas para Continuar:
- **Historial de Cotizaciones:** Permitir guardar cotizaciones anteriores en una tabla con fecha e identificador de cliente, también almacenada en `localStorage`.
- **Base de Datos de Clientes:** Crear un panel sencillo para almacenar nombres de clientes recurrentes y seleccionarlos directamente al generar el PDF.
- **Exportación de Backup de Ajustes:** Permitir descargar un archivo JSON con todos los perfiles de filamentos, impresoras y configuraciones, para poder importarlo en otros navegadores o PC sin perder la información.
- **Gráfico de Torta Dinámico:** Sustituir las barras de progreso por un gráfico circular SVG interactivo que muestre el desglose porcentual de costos de forma más visual.

