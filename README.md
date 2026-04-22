# ETL_Correos - Sistema Automatizado de Monitorizacion de Incidencias

## Que es este proyecto

Es un **Google Apps Script** que automatiza la monitorizacion diaria de incidencias operativas para MAPFRE. El sistema:

1. Lee correos de Gmail buscando errores (KO, NOTOK, ERROR, etc.)
2. Los registra en una hoja de calculo ("Log errores")
3. Analiza los correos de hoy y extrae detalles de errores especificos (ej: Operaciones Economicas TRON)
4. Guarda reportes estructurados en hojas de Excel
5. Envia correos automaticos: uno narrativo al cliente y, si la directriz lo permite, otro tecnico al equipo

## Stack Tecnologico

- **Runtime**: Google Apps Script (V8)
- **APIs**: Gmail API, Spreadsheet API (ambas nativas de Apps Script)
- **Despliegue**: `clasp` (CLI de Google para Apps Script)
- **Repositorio**: GitHub + `.clasp.json` para sincronizacion

## Estructura de Archivos

```
ETL_Correos/
  01_ImportadorCorreos.js   -- Punto de entrada principal
  02_Analisis.js            -- Orquestador de analisis diario
  03_Modulo_Economica.js    -- Modulo de extraccion de errores TRON
  04_Reportes.js            -- Envio de correos (cliente + equipo)
  05_Utilidades.js          -- Funciones auxiliares reutilizables
  06_Mantenimiento.js       -- Limpieza manual del log
  08_Monitor_Sistemas.js    -- Parser del monitor diario y resumen cliente de TRAMES
  09_Agente_Correo_Cliente.js -- Agente OpenAI para el correo cliente
  DIRECTRICES_AGENTE_CORREO_CLIENTE.html -- Documento fuente con las reglas textuales del agente
  10_Directrices_Correo_Cliente.js -- Banderas de comportamiento del correo cliente
  appsscript.json           -- Manifiesto de Apps Script
  .clasp.json               -- Configuracion de clasp (scriptId, etc.)
  Log Cadenas.xlsx          -- Referencia local (no se sube a Apps Script)
```

> Los prefijos numericos (01_, 02_...) indican el orden logico del flujo, NO el orden de ejecucion de Apps Script. En Apps Script todos los archivos comparten el mismo scope global.

## Mapa de Funciones

| Archivo | Funcion | Tipo | Descripcion |
|---|---|---|---|
| `01_ImportadorCorreos.js` | `importadordeCorreos()` | **ENTRADA** | Funcion principal. Se ejecuta desde un trigger o manualmente |
| `01_ImportadorCorreos.js` | `procesarThreads()` | Interna | Procesa threads de Gmail y extrae filas para el log |
| `02_Analisis.js` | `ejecutarAnalisisDiario()` | Orquestador | Revisa el log de hoy, lanza modulos y reportes |
| `03_Modulo_Economica.js` | `Modulo_Economica()` | Modulo | Extrae y agrupa errores de un correo de Operaciones Economicas |
| `04_Reportes.js` | `enviarReporteCliente()` | Reporte | Email narrativo tipo "Status Operativa Diaria" |
| `04_Reportes.js` | `enviarReporteTrabajadores()` | Reporte | Email tecnico con tabla de errores |
| `05_Utilidades.js` | `guardarEnTablaEspecifica()` | Utilidad | Escribe datos en una hoja con formato |
| `05_Utilidades.js` | `getLastDataRow()` | Utilidad | Obtiene la ultima fila con datos reales |
| `06_Mantenimiento.js` | `limpiarLogErrores()` | Mantenimiento | Borra datos del log (conserva encabezados) |

## Flujo de Ejecucion

```
importadordeCorreos()
  |
  |-- 1. Busca correos en Gmail (query con KO/NOTOK/ERROR + etiquetas)
  |-- 2. Filtra por fecha de hoy y por IDs ya procesados
  |-- 3. Clasifica cada correo (cadena, estado, fuente) usando:
  |       - Regex del asunto (patron U0000000, sufijos KO/OK/NOTOK)
  |       - Tabla de traduccion (hoja de Excel con patrones manuales)
  |-- 4. Guarda las filas nuevas en "Log errores"
  |
  +-- ejecutarAnalisisDiario()
        |
        |-- 5. Lee "Tabla de traduccion" columna D = "SI" (activar analisis)
        |-- 6. Busca en el log de HOY el correo mas reciente que matchee
        |-- 7. Router: segun el patron, lanza el modulo correspondiente
        |       |
        |       +-- Modulo_Economica(idCorreo)
        |             - Parsea el cuerpo del correo linea por linea
        |             - Extrae CT, Lote, Numeracion, Error
        |             - Agrupa por CT+Lote+Error
        |             - Devuelve array de 7 columnas
        |
        |-- 8. guardarEnTablaEspecifica() -> Escribe en "Reporte Economica"
        |-- 9. enviarReporteCliente()     -> Email narrativo al cliente
        +-- 10. enviarReporteTrabajadores() -> Email tecnico al equipo si esta habilitado
```

## Hojas de la Spreadsheet

| Hoja | Proposito | Gestionada por |
|---|---|---|
| **Log errores** | Registro historico de todos los correos procesados. Columnas: Fecha/Hora, Cadena, Estado, Asunto, ID Correo, Fuente | `importadordeCorreos()` |
| **Tabla de traduccion** | Reglas manuales. Col A: patron, Col B: nombre cadena, Col C: estado, Col D: activar analisis ("SI"/"NO") | Manual (el usuario la mantiene) |
| **Reporte Economica** | Detalle de errores TRON del dia. Se sobreescribe cada ejecucion | `guardarEnTablaEspecifica()` |

## Guia para Hacer Cambios

### Regla de oro

**NUNCA dupliques nombres de funcion entre archivos.** En Apps Script todos los `.js` comparten scope global. Si dos archivos definen `function foo()`, el comportamiento es impredecible.

### Anadir un nuevo modulo de analisis (ej: "Modulo Siniestros")

1. Crear `03b_Modulo_Siniestros.js` con una funcion `Modulo_Siniestros(idCorreo)` que devuelva un array de filas
2. En `02_Analisis.js`, dentro del `reglas.forEach`, anadir un nuevo `else if`:
   ```javascript
   else if (patron.indexOf("tu_patron_aqui") !== -1) {
     resumenGlobal.siniestros = Modulo_Siniestros(idCorreo);
   }
   ```
3. Anadir la logica de guardado/reporte despues del bloque de Economica
4. En la "Tabla de traduccion", anadir una fila con el patron y "SI" en columna D

### Modificar el formato de un reporte

Los reportes estan en `04_Reportes.js`. Cada funcion construye HTML puro. `enviarReporteCliente()` recibe el objeto `resumenGlobal` completo (para acceder a datos de cualquier modulo). `enviarReporteTrabajadores()` recibe solo el array de datos de Economica.

Las reglas textuales del agente estan en `DIRECTRICES_AGENTE_CORREO_CLIENTE.html`.

Las banderas de comportamiento del runtime, como activar o no el correo tecnico de TRON, estan en `10_Directrices_Correo_Cliente.js`.

### Cambiar destinatarios de correo

Busca los strings `"dayron.rodriguez@nfq.es"` y `"ignacio.agusti@nfq.es"` en `04_Reportes.js`.

### Anadir nuevas etiquetas de Gmail

En `01_ImportadorCorreos.js`, modifica el array `ETIQUETAS_EXTRA` al inicio de la funcion.

## Despliegue

```bash
# Subir cambios a Google Apps Script
clasp push

# Abrir el editor de Apps Script en el navegador
clasp open

# Descargar cambios desde Apps Script al repo local
clasp pull
```

## Formato de Datos de Modulo_Economica

La funcion devuelve filas de **7 columnas**:

| Indice | Contenido | Uso |
|---|---|---|
| `[0]` | Fecha del correo | Excel |
| `[1]` | Codigo Tramitador (CT) | Excel + Reportes |
| `[2]` | Lote | Excel + Reportes |
| `[3]` | Numeraciones (separadas por coma) | Excel + Reportes |
| `[4]` | Texto de error formateado ("N errores por X") | Excel + Reportes |
| `[5]` | Cantidad numerica de errores | Solo reportes |
| `[6]` | Mensaje de error puro (sin formatear) | Solo reportes |

Solo las primeras 5 columnas se escriben en la hoja de Excel. Las columnas 6 y 7 se usan internamente para generar las frases narrativas del email al cliente.

## Consideraciones Importantes

- **Timezone**: Todo usa `"Europe/Madrid"`. Esta configurado tanto en `appsscript.json` como en las funciones
- **Filtro de fecha**: El importador usa formato `yyyy/MM/dd` para el query de Gmail (evita fallos de madrugada con cambio de dia UTC vs local)
- **Deduplicacion**: Los correos se deduplan por su ID de Gmail (columna E del log). Un correo procesado nunca se vuelve a insertar
- **Ejecucion**: `ejecutarAnalisisDiario()` se ejecuta SIEMPRE que corre el importador, haya o no correos nuevos, para reanalizar el log de hoy
