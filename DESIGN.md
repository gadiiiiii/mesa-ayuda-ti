# DESIGN.md — Mesa de ayuda TI

Sistema de diseño de la app. Las pantallas usan estos tokens por nombre (variables CSS y clases de Tailwind), nunca valores sueltos.

## Dirección

Una herramienta de trabajo de una oficina pública: sobria, densa sin apretarse y legible en un monitor de oficina o en el celular del técnico en terreno. El vocabulario sale del soporte municipal: **folios**, **plazos** y **etiquetas de inventario**.

**Lo memorable es una sola cosa: la barra de plazo.** Cada ticket pendiente muestra cuánto de su plazo ya se consumió. Es gris mientras hay tiempo, ámbar en el último cuarto y roja cuando se venció, siempre acompañada del texto («Vence en 3 h», «Vencido hace 2 h»). Todo lo demás es tranquilo: los estados se distinguen por su ícono y su nombre, y el color fuerte se reserva para lo urgente.

## Color

| Token | Claro | Oscuro | Rol |
|---|---|---|---|
| `background` | `#e9edf0` | `#101418` | Fondo de la página (gris institucional frío) |
| `card` | `#ffffff` | `#181d22` | Paneles, tablas, formularios |
| `foreground` | `#17212b` | `#e3e8ec` | Texto principal |
| `muted-foreground` | `#56636f` | `#98a4ae` | Texto secundario, etiquetas |
| `border` | `#d2d9df` | `#2c343c` | Bordes y divisores |
| `muted` | `#e3e8ec` | `#222930` | Fondos sutiles, pista vacía de la barra de plazo |
| `primary` | `#0d6577` | `#5cc3d6` | **Acciones**: botones, enlaces, foco (azul petróleo) |
| `primary-foreground` | `#ffffff` | `#0b1418` | Texto sobre `primary` |
| `primary-soft` | `#dcedf1` | `#14323a` | Fondo del estado «En curso» y de la fila activa |
| `success` | `#1c6b3e` | `#71d19b` | Resuelto, plazo cumplido |
| `success-soft` | `#ddf0e4` | `#14301f` | Fondo del estado «Resuelto» |
| `warning` | `#8a5100` | `#f2b35a` | Plazo por vencer, prioridad alta |
| `warning-soft` | `#fbecd6` | `#3a2810` | Fondo de avisos de plazo |
| `destructive` | `#b3261e` | `#ff9087` | Vencido, prioridad urgente, errores |
| `destructive-soft` | `#fbe2df` | `#3c1a17` | Fondo de errores y de vencidos |

El texto cumple contraste 4,5:1 sobre su fondo en ambos modos. El modo oscuro sigue la preferencia del sistema.

## Tipografía

- **Public Sans**: toda la interfaz. Es la tipografía de los servicios públicos del gobierno de EE. UU., pensada para trámites y formularios.
- **IBM Plex Mono**: solo para datos que se copian o se comparan carácter a carácter: folios (`#1042`), códigos de inventario (`IMP-0007`), IP, MAC y números de serie.
- Las dos se sirven desde la propia app con Fontsource (sin pedir nada a Google Fonts).

| Nombre | Tamaño / interlineado | Uso |
|---|---|---|
| `xs` | 12 / 16 | Leyendas de gráficos |
| `sm` | 14 / 20 | Etiquetas de campos, celdas secundarias, plazos |
| `base` | 16 / 24 | Texto y celdas principales |
| `lg` | 18 / 28 | Títulos de panel |
| `2xl` | 24 / 32 | Título de ficha (ticket o equipo) |
| `3xl` | 30 / 36 | Título de página |

Pesos: 400, 500, 600 y 700. Títulos en 700 con interletrado −0,01 em. Sin mayúsculas sostenidas.

## Espaciado y medidas

- Escala de 4 px de Tailwind. Ancho máximo del contenido: 76 rem; los formularios, 44 rem.
- Margen lateral de 16 px en el celular y 24 px desde `sm`.
- Radios: 6 px en campos y botones, 10 px en paneles. Las etiquetas de inventario usan 3 px.
- Objetivos táctiles de 44 px como mínimo en el celular (botones `h-11`).

## Componentes

- **Barra de plazo:** 6 px de alto, pista `muted`. Mide tiempo hábil. Relleno `muted-foreground` a tiempo, `warning` en el último cuarto, `destructive` vencido (llena) y `muted-foreground` al 40 % en pausa. El texto del plazo va encima, con ícono de reloj, alerta o pausa («Quedan 3 h hábiles», «Vencido hace 2 h hábiles», «En pausa, quedan 6 h hábiles»).
- **Estado del ticket:** ícono + nombre. Abierto (círculo vacío), En curso (círculo a medias, `primary`), En espera (pausa), Resuelto (check, `success`), Cerrado (archivo, apagado).
- **Prioridad:** barras de señal de 1 a 4 + nombre. Urgente en `destructive`, Alta en `warning`, Media y Baja en tinta normal.
- **Etiqueta de inventario:** el código en mono, borde fino y una franja a la izquierda, como la etiqueta pegada en el equipo.
- **Folio:** `#` + número en mono, apagado junto al título.
- **Tablas:** encabezado en `sm` 600 color secundario, filas de al menos 56 px y toda la fila es un enlace. En el celular se apilan como tarjetas.
- **Formularios:** etiqueta encima, ayuda debajo en `muted-foreground`, error en `destructive` con ícono. Los selects son nativos para que funcionen bien en el celular.
- **Portal:** la misma identidad con una cabecera simple (sin la navegación de los técnicos) y un ancho de 60 rem. El lenguaje es para quien pide ayuda: segunda persona («Enviaste la solicitud», «Te respondió»), estados explicados en una frase y nada de jerga (impacto en vez de prioridad).
- **Notas internas:** caja con borde punteado y fondo `muted`, con la etiqueta «No la ve el solicitante». Las respuestas públicas usan la caja normal.
- **Gráficos del panel:** barras horizontales de un solo tono (`primary`) con el número escrito al lado; nunca solo color.
