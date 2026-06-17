# Requisitos del Proyecto: Calculadora de Costos de Impresión 3D

Este documento detalla las especificaciones y características para el desarrollo de la Calculadora de Costos para un taller de impresión 3D.

---

## 1. Arquitectura y Plataforma
- **Plataforma:** Aplicación web de una sola página (SPA - Single Page Application) interactiva y responsiva.
- **Tecnologías Core:** HTML5, CSS3 moderno (Vanilla CSS) y JavaScript (ES6+).
- **Dependencias:** Integración de la biblioteca `html2pdf.js` vía CDN para exportar la cotización en formato PDF.
- **Persistencia de Datos:** Uso de `localStorage` del navegador para almacenar de manera local:
  - Perfiles de impresoras.
  - Perfiles de filamentos.
  - Ajustes de tarifas por defecto (electricidad, mano de obra, márgenes).

---

## 2. Componentes del Costo y Fórmulas

La aplicación calculará el costo de fabricación de un lote de producción con base en los siguientes componentes y variables de lote:

### Parámetros de Lote (Producción en Masa)
- **Cantidad Total de Piezas ($N$):** Cantidad de piezas a fabricar.
- **Piezas por Cama ($P_c$):** Número de piezas que caben simultáneamente en la plataforma de impresión.
- **Camas Requeridas ($C_r$):** Número de lotes/camas a imprimir. Fórmula: $C_r = \lceil N / P_c \rceil$ (redondeado hacia arriba).
- **Desperdicio por Cama ($D_c$):** Filamento de descarte (purgas, faldas, soportes por cama) en gramos.
- **Modo de Ingreso de Tiempo:** Selección de si el tiempo estimado ingresado corresponde a **una pieza** individual o a **una cama/lote** completo.

### A. Material (Filamento)
- **Peso Total de Filamento:** $\text{Peso Total (g)} = (N \times \text{Peso de la Pieza}) + (C_r \times D_c)$
- **Fórmula Costo Material:** $\text{Costo Material} = \left( \frac{\text{Peso Total (g)}}{\text{Peso del Rollo (g)}} \right) \times \text{Precio del Rollo (\$)}$

### B. Depreciación de Máquina y Consumo Eléctrico (Tiempo de Impresión)
- **Tiempo de Impresión Total ($T_t$ en horas):**
  - Si el ingreso es *Por Pieza*: $T_t = \text{Tiempo Ingresado} \times N$
  - Si el ingreso es *Por Cama*: $T_t = \text{Tiempo Ingresado} \times C_r$
- **Depreciación por Hora:** $\text{Depreciación por Hora} = \frac{\text{Costo de Impresora (\$)}}{\text{Vida Útil (horas)}}$
- **Costo Desgaste Total:** $\text{Costo Desgaste} = \text{Depreciación por Hora (u Override)} \times T_t$
- **Consumo Eléctrico Total:** $\text{Costo Eléctrico} = \left( \frac{\text{Consumo Impresora (W)}}{1000} \right) \times T_t \times \text{Precio de Electricidad por kWh (\$)}$

### C. Mano de Obra (Preparación y Diseño)
- **Fórmula:** $\text{Costo Mano de Obra} = \text{Tiempo de Preparación (horas)} \times \text{Tarifa General por Hora (\$)}$
- *Nota: Se considera un costo fijo único por proyecto para diseño y laminación.*

### D. Post-procesado (Acabado)
- **Fórmula:** $\text{Costo Post-procesado} = \text{Costo Fijo por Proyecto (\$)} + \left( \text{Tiempo de Post-procesado (horas)} \times \text{Tarifa de Post-procesado por Hora (\$)} \right)$
- *Nota: Se ingresa el tiempo y costo fijo total estimado para el lote completo.*

### E. Precio de Venta Final y Unitario (Márgenes)
- **Costo de Producción (Subtotal):** $\text{Subtotal} = \text{Costo Material} + \text{Costo Desgaste} + \text{Costo Eléctrico} + \text{Costo Mano de Obra} + \text{Costo Post-procesado}$
- **Margen de Error/Falla:** $\text{Costo de Falla} = \text{Subtotal} \times \text{Porcentaje de Falla (\%)} / 100$
- **Margen de Ganancia:** $\text{Ganancia} = (\text{Subtotal} + \text{Costo de Falla}) \times \text{Porcentaje de Ganancia (\%)} / 100$
- **Precio Sugerido Total:** $\text{Precio Total} = \text{Subtotal} + \text{Costo de Falla} + \text{Ganancia}$ (redondeado a enteros)
- **Precio Sugerido Unitario:** $\text{Precio Unitario} = \text{Precio Total} / N$

---

## 3. Interfaz de Usuario y Estilo Visual
- **Tema Dual:** Soporte para modo claro (Light Mode) y modo oscuro (Dark Mode), con botón de alternancia.
- **Estilo:** Diseño premium, moderno y limpio con:
  - Estructura responsiva (móvil y escritorio).
  - Bordes redondeados y sombreados suaves.
  - Transiciones y micro-animaciones en botones e inputs.
  - Efectos de desenfoque tipo cristal (glassmorphism) sutiles.
  - Tipografía moderna (ej. Inter o Outfit de Google Fonts).
- **Organización por Pestañas:**
  1. **Calculadora:** Entrada de parámetros de la pieza, selección de perfiles, gráfico de distribución del costo (HTML/CSS progress bars o gráficos circulares SVG dinámicos), y botón para descargar cotización en PDF.
  2. **Materiales:** Tabla con los filamentos guardados, botones para añadir, editar y eliminar.
  3. **Impresoras:** Tabla con las impresoras guardadas, botones para añadir, editar y eliminar.
  4. **Ajustes:** Configuración global de tarifas por hora, costo de kWh, márgenes por defecto y reinicio de la base de datos local.

---

## 4. Datos Iniciales (Seed)
Para facilitar el primer uso, la aplicación contará con los siguientes datos por defecto cargados en `localStorage` si están vacíos:
- **Impresoras:**
  - *Creality Ender 3:* 350W, Costo $250, Vida útil 2000 horas.
  - *Bambu Lab P1S:* 350W, Costo $700, Vida útil 4000 horas.
- **Filamentos:**
  - *PLA Genérico:* 1000g, Costo $20.
  - *PETG Genérico:* 1000g, Costo $25.
- **Ajustes Globales:**
  - Electricidad: $0.15 / kWh.
  - Mano de Obra General: $10.00 / hora.
  - Mano de Obra Post-procesado: $12.00 / hora.
  - Margen de error/falla: 10%.
  - Margen de ganancia: 50%.
