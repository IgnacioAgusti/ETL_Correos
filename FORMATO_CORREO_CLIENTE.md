# Formato Base Del Correo Cliente

Plantilla derivada de `original_msg.eml`, pero reducida a estructura reutilizable para que un agente la rellene.

## Decisiones Acordadas

- La plantilla debe cubrir todo el correo cliente, aunque por ahora solo haya datos estructurados de `BACKEND: OPERACIONES ECONOMICAS`.
- La salida esperada del agente es HTML listo para `GmailApp.sendEmail`.
- La firma no forma parte del formato que debe generar el agente.
- Los errores parecidos deben consolidarse bajo una misma clave canonica.
- El correo cliente debe agrupar por tipo de error, no por `CT` ni por lote.
- Si aparece un error no catalogado, debe quedar visible en el correo para revision manual antes del envio.
- No se incluye un resumen inicial de CAS antes del bloque `TRAMES comunicaciones`.
- En CAS no se habla de `tramas`; se habla de recepciones en estado `P` cuando aplique.
- En TRAMES no se incluyen frases del tipo `No hay detalles individuales...` ni observaciones extra.
- Los errores repetidos del monitor se agrupan en una sola frase corta, sin lotes, registros ni trazas.
- El bloque `Cadenas KO` se omite por completo por ahora, porque aun no hay informacion suficiente para rellenarlo con fiabilidad.
- Las reglas que se envian al agente viven en `DIRECTRICES_AGENTE_CORREO_CLIENTE.html`.
- Las banderas de comportamiento del runtime viven en `10_Directrices_Correo_Cliente.js`.

## Plantilla

```text
Asunto: Status Operativa Diaria - {{fecha_reporte}}

Buenos dias,

A continuacion, os enviamos la informacion correspondiente al estado de la operativa diaria tanto de *TRAMES* como de *BACKEND*.

TRAMES comunicaciones

- *Convenio CAS*
  - *RECEPCION*
    - {{trames_cas_recepcion}}
  - *ENVIO*
    - {{trames_cas_envio}}

------------------------------

- *Convenio CICOS*
  - *RECEPCION*
    - {{trames_cicos_recepcion}}
  - *ENVIO*
    - {{trames_cicos_envio}}

------------------------------

- *Convenio SDM*
  - *RECEPCION*
    - {{trames_sdm_recepcion}}
  - *ENVIO*
    - {{trames_sdm_envio}}

------------------------------

- *Comunicaciones SDP-LEX*
  - {{trames_sdplex_resumen}}

------------------------------

BACKEND: Cadena OPERACIONES ECONOMICAS (R01T0270):

{{backend_operaciones_economicas_items}}

Si no hay incidencias en este bloque:
- Limpio

------------------------------

Cadenas KO
{{cadenas_ko_resumen}}

Si no hay incidencias en este bloque:
Sin cadenas KO identificadas.

Quedo a vuestra disposicion para cualquier otra cuestion relacionada con el Status con la que os pueda ayudar.

Muchas gracias.

Buen dia.
```

## Reglas Minimas De Relleno

- Mantener saludo, orden de secciones y cierre.
- No inventar datos que no existan en la entrada.
- Si una seccion no tiene incidencias, usar la frase de limpio acordada.
- En CAS, si el monitor marca pendientes, usar `N recepciones en estado P`.
- No incluir lotes, registros, trazas ni observaciones en el correo cliente.
- Si hay errores repetidos del monitor, resumirlos como `N errores de ...`.
- `{{backend_operaciones_economicas_items}}` debe ser una lista de lineas, una por incidencia agrupada por tipo de error canonico.
- El estado final de cada incidencia debe venir parametrizado, no improvisado por el agente.
- Si aparece un error no catalogado, usar un fallback visible: `PENDIENTE_PARAMETRIZAR`.

## Campos Que Hoy Ya Existen En El Proyecto

- `fecha_reporte`
- `backend_operaciones_economicas_items`

## Campos Que Aun No Veo Estructurados En El Codigo Actual

- `trames_cas_recepcion`
- `trames_cas_envio`
- `trames_cicos_recepcion`
- `trames_cicos_envio`
- `trames_sdm_recepcion`
- `trames_sdm_envio`
- `trames_sdplex_resumen`
- `cadenas_ko_resumen`

## Formato Recomendado Para Cada Item De Backend

```text
- {{frase_narrativa}}. *{{estado_operativo}}*
```

Ejemplos de `frase_narrativa`:

- `Se ha identificado un error {{error_normalizado}}`
- `Se han identificado {{cantidad}} errores por {{error_normalizado}}`
- `Se han identificado {{cantidad}} operaciones duplicadas enviadas a TRON`

## Nota De Diseno

- El bloque cliente de Economica debe agruparse por error canonico.
- El reporte tecnico puede seguir usando el detalle actual por `CT + lote + error`.
