# Calculadora de oferta solar

Aplicación estática en español para comparar una oferta de una planta solar de **12 MWp** con un presupuesto base de **8.400.000 € sin IVA** y con los costes ingresados por partida.

## Uso

Abran `index.html` en un navegador. No requiere instalación ni servidor.

Ingresen los importes de módulos, inversores, estructura, obra civil y otros. El precio de oferta se escribe por separado. Todos los campos empiezan vacíos. Usen coma o punto decimal, hasta dos decimales y sin separadores de miles. Escriban cero si una partida no aplica. Los datos permanecen en memoria y no se guardan al recargar.

Un vacío significa pendiente: con algunas partidas se muestra una suma parcial; el coste total y su comparación requieren las cinco partidas. Una entrada inválida bloquea los resultados que dependen de ella. La oferta puede compararse con el presupuesto aunque los costes estén incompletos. «Limpiar» vacía las seis entradas y sus resultados, conservando las referencias fijas.

## Fórmulas

- Potencia: 12 × 1.000.000 = 12.000.000 Wp.
- Presupuesto por Wp: 8.400.000 / 12.000.000 = 0,70 €/Wp.
- Coste total: suma de las cinco partidas, calculada en centavos enteros.
- Coste por Wp: coste total / 12.000.000.
- Oferta por Wp: precio de oferta / 12.000.000.
- Comparación: (oferta − referencia) / 12.000.000; la referencia es el coste total o el presupuesto base. Se muestra el sentido de la diferencia y su magnitud, sin sugerir precios ni calcular márgenes.

Los importes son sin IVA. Se muestran hasta seis decimales en €/Wp; las comparaciones usan centavos sin redondear previamente. Una diferencia menor que la precisión de pantalla se identifica expresamente. Para mantener una suma exacta, cada entrada debe ser como máximo `floor(Number.MAX_SAFE_INTEGER / 5)` centavos.

## Comprobación

Verificar conversión a Wp, referencia de 0,70 €/Wp, suma exacta de centavos, ceros explícitos, estados vacíos y parciales, oferta menor/igual/mayor que cada referencia, rechazo de negativos y formatos inválidos, actualización al borrar y limpieza completa. Revisar también uso con teclado, pantalla móvil y consola sin errores. Los importes temporales de prueba no se incluyen como datos iniciales.

## Origen

Adaptación de [Basic Calculator de Mayn18](https://github.com/Mayn18/Basic-Calculator), creado como parte de [The Odin Project](https://www.theodinproject.com/lessons/foundations-calculator). Se conserva la carpeta `Media` del proyecto original. Esta versión usa HTML, CSS y JavaScript sin dependencias.

## Resumen para el comité

El botón «Copiar resumen para el comité» copia potencia, presupuesto, cinco partidas, coste total (o suma parcial), precio de oferta y comparaciones en €/Wp. Cada vacío aparece como «pendiente»; los importes inválidos se identifican como pendientes de corrección. No incluye recomendaciones de precio ni de margen.

Si el navegador no permite usar el portapapeles, se muestra el texto seleccionado para copiar manualmente. Al editar o limpiar, se oculta el resumen manual anterior. Una copia en curso avisa si los datos cambiaron antes de terminar.

## Pruebas reproducibles

Con Node.js instalado, ejecuten `node calculator.test.cjs` para las pruebas de cálculo, generación del resumen y conservación de fórmulas. Ejecuten `node browser.test.cjs` para probar el formulario y el botón en Chrome sin interfaz, con tamaños de escritorio y móvil. En Windows se detecta Chrome automáticamente; pueden indicar su ejecutable mediante `CHROME_PATH`. No requiere paquetes adicionales. Los datos de prueba son temporales y no se precargan en la calculadora.

## Gráfico de comparación en €/Wp

Debajo de las comparaciones, tres barras verticales representan el coste total, la oferta y el presupuesto base. Usan el mismo gris neutro y una escala común desde cero hasta el mayor valor disponible. El valor numérico aparece sobre cada barra.

El coste permanece «pendiente» hasta completar las cinco partidas válidas; la oferta permanece «pendiente» mientras esté vacía o sea inválida. Las barras pendientes están vacías y muestran esa palabra. Un cero explícito muestra 0,00 €/Wp, con altura cero. El presupuesto base siempre conserva 0,70 €/Wp. Las barras se actualizan al editar o limpiar.

Pruebas adicionales: `node chart.test.cjs` (Chrome, escritorio y móvil). Las suites anteriores se conservan sin modificaciones: `node calculator.test.cjs` y `node browser.test.cjs`.
