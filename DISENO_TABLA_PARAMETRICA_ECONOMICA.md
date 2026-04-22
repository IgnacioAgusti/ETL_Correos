# Diseno De La Tabla Parametrica De Economica

## Objetivo

Definir una tabla parametrica para que el agente no improvise la narrativa del correo cliente y pueda convertir errores repetitivos de Operaciones Economicas en frases estandar.

## Decisiones Ya Tomadas

- El correo final debe cubrir todo el correo cliente.
- Por ahora solo hay datos estructurados de `BACKEND: OPERACIONES ECONOMICAS`.
- La salida deseada es HTML listo para enviar.
- La consolidacion del correo cliente debe ser por tipo de error.
- Los errores parecidos deben caer en una misma clave canonica.
- El `estado_operativo` debe salir siempre de la tabla parametrica.
- Si aparece un error no parametrizado, debe quedar visible en el correo para revision manual.
- La firma queda fuera del formato.

## Recomendacion De Estructura

Usar una sola hoja llamada `Tabla parametrica economica` con una fila por patron reconocible.

Varias filas pueden apuntar a la misma `clave_error`, y eso es justamente lo que permite consolidar variantes parecidas.

## Columnas Propuestas

| Columna | Nombre | Uso |
|---|---|---|
| A | `activo` | `SI` o `NO` para habilitar la regla |
| B | `orden_cliente` | Orden en que aparece el error en el correo |
| C | `tipo_match` | `EXACTO`, `CONTIENE` o `REGEX` |
| D | `patron_entrada` | Texto o patron que debe detectar el sistema |
| E | `clave_error` | Clave canonica para consolidar variantes |
| F | `error_canonico` | Nombre normalizado y entendible del error |
| G | `frase_cliente_singular` | Frase base si la cantidad es 1 |
| H | `frase_cliente_plural` | Frase base si la cantidad es mayor de 1 |
| I | `estado_operativo` | Estado que debe mostrarse al cliente. Siempre sale de la tabla parametrica |
| J | `activo_cliente` | `SI` o `NO` por si un error se usa solo de forma interna |
| K | `observaciones` | Campo manual para notas |

## Regla De Oro

El agente no debe redactar libremente el bloque de Economica.

Debe:

1. Detectar el error original.
2. Buscarlo en la tabla parametrica.
3. Convertirlo a `clave_error`.
4. Agrupar por `clave_error`.
5. Renderizar la frase cliente usando la columna singular o plural.
6. Anadir el `estado_operativo`.

## Flujo Recomendado

### 1. Extraccion Tecnica

Se mantiene el parseo actual del correo para obtener detalle tecnico.

Salida parecida a la actual:

```javascript
{
  ct: "T1234",
  lote: "5678",
  num: "999999",
  errOriginal: "-10 Perceptor inhabilitado o con fechas de validez erroenas"
}
```

### 2. Normalizacion

Cada `errOriginal` se compara contra la tabla parametrica y se transforma en algo asi:

```javascript
{
  claveError: "PERCEPTOR_INHABILITADO",
  errorCanonico: "Perceptor inhabilitado o con fechas de validez erroneas",
  fraseClienteSingular: "Se ha identificado un error por perceptor inhabilitado o con fechas de validez erroneas",
  fraseClientePlural: "Se han identificado {{cantidad}} errores por perceptor inhabilitado o con fechas de validez erroneas",
  estadoOperativo: "En analisis."
}
```

### 3. Agrupacion Cliente

Para el correo cliente, agrupar por `claveError`.

Ejemplo:

```javascript
{
  claveError: "PERCEPTOR_INHABILITADO",
  cantidad: 2,
  erroresOriginales: [
    "-10 Perceptor inhabilitado o",
    "-10 Perceptor inhabilitado o con fechas de validez erroenas"
  ]
}
```

### 4. Render HTML

Si `cantidad === 1`, usar `frase_cliente_singular`.

Si `cantidad > 1`, usar `frase_cliente_plural` reemplazando `{{cantidad}}`.

Despues anadir el estado:

```html
<li>Se han identificado 2 errores por perceptor inhabilitado o con fechas de validez erroneas. <strong>En analisis.</strong></li>
```

## Fallback Para Error No Catalogado

Si no hay match en la tabla parametrica, no bloquear el correo.

En su lugar, dejar una marca visible en el HTML:

```html
<li><strong>REVISION MANUAL:</strong> Error no parametrizado detectado: {{error_original}}.</li>
```

Esto permite que el responsable del envio lo vea, lo corrija y luego decida si anadirlo a la tabla parametrica.

## Criterio Operativo

El 99 por ciento de los casos deberia resolverse desde la tabla parametrica, porque los errores se repiten.

El 1 por ciento restante no debe inventarse ni bloquear el proceso:

1. Se deja el error visible tal cual en el correo.
2. El responsable del envio lo revisa antes de mandar el correo.
3. Si el error se repite, se incorpora despues a la parametrizacion.

## Ejemplos De Filas

| activo | orden_cliente | tipo_match | patron_entrada | clave_error | error_canonico | frase_cliente_singular | frase_cliente_plural | estado_operativo | activo_cliente | observaciones |
|---|---|---|---|---|---|---|---|---|---|---|
| SI | 10 | CONTIENE | `-10 Perceptor inhabilitado o` | `PERCEPTOR_INHABILITADO` | `Perceptor inhabilitado o con fechas de validez erroneas` | `Se ha identificado un error por perceptor inhabilitado o con fechas de validez erroneas` | `Se han identificado {{cantidad}} errores por perceptor inhabilitado o con fechas de validez erroneas` | `En analisis.` | SI | Variante corta |
| SI | 10 | CONTIENE | `-10 Perceptor inhabilitado o con fechas de validez erroenas` | `PERCEPTOR_INHABILITADO` | `Perceptor inhabilitado o con fechas de validez erroneas` | `Se ha identificado un error por perceptor inhabilitado o con fechas de validez erroneas` | `Se han identificado {{cantidad}} errores por perceptor inhabilitado o con fechas de validez erroneas` | `En analisis.` | SI | Variante completa |
| SI | 20 | CONTIENE | `34 Error al obtener NUM_CRUCE` | `ERROR_NUM_CRUCE` | `Error al obtener NUM_CRUCE` | `Se ha identificado un error por error al obtener NUM_CRUCE` | `Se han identificado {{cantidad}} errores por error al obtener NUM_CRUCE` | `En analisis.` | SI | Revisar si conviene refinar frase |
| SI | 20 | CONTIENE | `34 Error al obtener NUM_CRUCE (Cod_docum erroneo)` | `ERROR_NUM_CRUCE` | `Error al obtener NUM_CRUCE` | `Se ha identificado un error por error al obtener NUM_CRUCE` | `Se han identificado {{cantidad}} errores por error al obtener NUM_CRUCE` | `En analisis.` | SI | Variante extendida |

## Impacto En El Codigo Actual

Hoy `Modulo_Economica()` devuelve informacion pensada para detalle tecnico y el correo cliente construye la narrativa directamente desde el error crudo.

Para evolucionarlo sin romper nada:

1. Mantener la salida tecnica actual para el reporte interno.
2. Anadir una segunda salida normalizada para cliente.
3. Cambiar el bloque cliente para que agrupe por `clave_error` en lugar de `CT + lote + error`.
4. Renderizar el HTML del cliente desde plantilla + tabla parametrica.

## Siguiente Paso Recomendado

El siguiente paso mas rentable no es tocar aun el parser de TRAMES.

Es este:

1. Crear la hoja `Tabla parametrica economica` con estas columnas.
2. Cargar en ella los errores ya conocidos de `resultado_retornos_sin_duplicados.txt`.
3. Definir la primera version de claves canonicas y frases cliente.
4. Ajustar solo el bloque de `BACKEND: OPERACIONES ECONOMICAS` para usar esa tabla.
5. Dejar TRAMES, CAS y Cadenas KO como placeholders del HTML para futuras iteraciones.

## Pregunta Pequena Que Aun Merece Cierre

- ¿Quieres que el correo cliente respete un orden manual definido en `orden_cliente`, o prefieres ordenarlo por cantidad descendente?
