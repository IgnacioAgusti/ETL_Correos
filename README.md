# 📧 ETL_Correos - Sistema Automatizado de Monitorización de Incidencias

> **Solución inteligente para automatizar la extracción, análisis y reporteo de incidencias operativas en Google Apps Script**

## 🎯 ¿Qué es este proyecto?

**ETL_Correos** es un motor de automatización basado en **Google Apps Script** que monitoriza diariamente los correos de incidencias operativas de MAPFRE. El sistema:

✅ **Lee correos en Gmail** buscando automáticamente errores (KO, NOTOK, ERROR, etc.)  
✅ **Registra en tiempo real** en una hoja de cálculo un log histórico completo  
✅ **Analiza y extrae detalles** de errores específicos (e.g., Operaciones Económicas TRON)  
✅ **Genera reportes estructurados** en Excel con datos consolidados  
✅ **Envía correos automáticos** narrativos al cliente y técnicos al equipo (configurable)

---

## 📊 Arquitectura & Stack Tecnológico

```
┌─────────────────────────────────────────────────────────────┐
│                    Google Apps Script (V8)                   │
├─────────────────────────────────────────────────────────────┤
│  • Gmail API (lectura de correos + etiquetas)               │
│  • Spreadsheet API (escritura de logs y reportes)           │
│  • Execution Triggers (ejecución programada)                │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│              GitHub Repository + Clasp CLI                   │
│  (Sincronización bidireccional código ↔ Google)             │
└─────────────────────────────────────────────────────────────┘
```

**Componentes clave:**
- **Runtime**: Google Apps Script (V8)
- **APIs utilizadas**: Gmail API, Spreadsheet API
- **Despliegue**: `clasp` (CLI oficial de Google para Apps Script)
- **Repositorio**: GitHub + `.clasp.json` para sincronización
- **Zona horaria**: Europe/Madrid (configurado globalmente)

---

## 📁 Estructura de Archivos

```
ETL_Correos/
├── 01_ImportadorCorreos.js          ┐
├── 02_Analisis.js                    │
├── 03_Modulo_Economica.js            ├─ Módulos principales
├── 04_Reportes.js                    │
├── 05_Utilidades.js                  │
├── 06_Mantenimiento.js               ├─ Funciones de soporte
├── 08_Monitor_Sistemas.js            │
├── 09_Agente_Correo_Cliente.js       │
├── 10_Directrices_Correo_Cliente.js  ┘
│
├── DIRECTRICES_AGENTE_CORREO_CLIENTE.html  ── Reglas textuales del agente
├── DISENO_TABLA_PARAMETRICA_ECONOMICA.md   ── Especificación técnica
├── FORMATO_CORREO_CLIENTE.md               ── Guía de formato HTML
├── PLANTILLA_CORREO_CLIENTE.html           ── Template base
│
├── appsscript.json                   ── Manifiesto de Apps Script
├── .clasp.json                       ── Configuración de clasp
├── .clasp.json                       ── Control de versiones
│
└── Tabla_Operaciones_Economicas/     ── Referencia local (no se sube)
```

> **Nota importante**: Los prefijos numéricos (01_, 02_, etc.) indican el orden **lógico** del flujo, no el orden de ejecución. En Apps Script todos los archivos comparten el mismo scope global.

---

## 🔄 Flujo de Ejecución

### Visión General del Pipeline

```
┌──────────────────────────┐
│  importadordeCorreos()   │  ← PUNTO DE ENTRADA
└────────┬─────────────────┘
         │
         ├─→ 1️⃣ Busca correos en Gmail (query inteligente)
         ├─→ 2️⃣ Filtra por fecha hoy + ID únicos
         ├─→ 3️⃣ Clasifica usando regex + tabla de traducción
         └─→ 4️⃣ Guarda en "Log errores" (deduplicación por ID)
                  ↓
         ┌──────────────────────────────────┐
         │ ejecutarAnalisisDiario()         │
         │ (siempre se ejecuta)             │
         └────────┬─────────────────────────┘
                  │
                  ├─→ 5️⃣ Lee "Tabla de traducción" columna D = "SI"
                  ├─→ 6️⃣ Busca correos recientes en el log de HOY
                  └─→ 7️⃣ Enruta según patrón → lanza módulo específico
                           │
                           └─→ Modulo_Economica(idCorreo)
                               • Parsea cuerpo línea por línea
                               • Extrae CT, Lote, Numeración, Error
                               • Agrupa por CT + Lote + Error
                               • Devuelve array 7 columnas
                  │
                  ├─→ 8️⃣ Guarda en "Reporte Economica"
                  ├─→ 9️⃣ Envía correo narrativo al cliente (HTML)
                  └─→ 🔟 Envía correo técnico al equipo (si habilitado)
```

### Parámetros Configurables

En `01_ImportadorCorreos.js`, líneas 17-28:

```javascript
var MODO = 1;           // 0 = TODOS, 1 = SOLO NOTOK/KO/ERROR, 2 = SOLO OK
var USAR_TRAD = true;   // true = usa "Tabla de traducción", false = ignora
var HOJA_LOG = "Log errores";
var HOJA_TRAD = "Tabla de traduccion";
var TIMEZONE = "Europe/Madrid";

var ETIQUETAS_EXTRA = [
  "MAPFRE/PROCESOS Semanales/CAS",
  "MAPFRE/Excesiva duración Cadenas",
  "MAPFRE/Apertura"
];
```

---

## 📋 Mapa de Funciones

| Archivo | Función | Tipo | Descripción |
|---|---|---|---|
| `01_ImportadorCorreos.js` | `importadordeCorreos()` | **ENTRADA** | Función principal. Busca correos, registra y lanza análisis |
| `01_ImportadorCorreos.js` | `procesarThreads()` | Interna | Procesa threads de Gmail y extrae filas para el log |
| `02_Analisis.js` | `ejecutarAnalisisDiario()` | Orquestador | Revisa log de hoy, lanza módulos y reportes |
| `03_Modulo_Economica.js` | `Modulo_Economica()` | Módulo | Extrae y agrupa errores TRON de Operaciones Económicas |
| `04_Reportes.js` | `enviarReporteCliente()` | Reporte | Email narrativo tipo "Status Operativa Diaria" (HTML) |
| `04_Reportes.js` | `enviarReporteTrabajadores()` | Reporte | Email técnico con tabla de errores |
| `05_Utilidades.js` | `guardarEnTablaEspecifica()` | Utilidad | Escribe datos en una hoja con formato |
| `05_Utilidades.js` | `getLastDataRow()` | Utilidad | Obtiene última fila con datos reales |
| `06_Mantenimiento.js` | `limpiarLogErrores()` | Mantenimiento | Borra datos del log (conserva encabezados) |
| `08_Monitor_Sistemas.js` | `analizarMonitorDiario()` | Módulo | Parser del monitor diario + resumen TRAMES |
| `09_Agente_Correo_Cliente.js` | `construirCorreoCliente()` | Reportería | Orquesta la construcción del correo narrativo |

---

## 📊 Hojas de la Spreadsheet

| Hoja | Propósito | Gestionada por | Frecuencia |
|---|---|---|---|
| **Log errores** | Registro histórico de todos los correos procesados. Columnas: Fecha/Hora, Cadena, Estado, Asunto, ID Correo, Fuente | `importadordeCorreos()` | Diaria |
| **Tabla de traducción** | Reglas manuales. Col A: patrón, Col B: nombre cadena, Col C: estado, Col D: activar análisis ("SI"/"NO") | Manual (usuario) | Según necesidad |
| **Reporte Economica** | Detalle de errores TRON del día. Se sobreescribe cada ejecución | `guardarEnTablaEspecifica()` | Diaria |
| **Tabla parametrica economica** | Normalización de errores TRON en claves canónicas (propuesto) | Manual (usuario) | Según necesidad |

---

## 🔧 Cómo Hacer Cambios

### ⚠️ Regla de Oro

**NUNCA dupliques nombres de función entre archivos.** En Apps Script todos los `.js` comparten scope global. Si dos archivos definen `function foo()`, el comportamiento es impredecible.

### Ejemplo: Añadir un nuevo módulo de análisis

Supongamos que quieres crear un módulo "Modulo_Siniestros":

**Paso 1**: Crear `03b_Modulo_Siniestros.js`
```javascript
function Modulo_Siniestros(idCorreo) {
  // Tu lógica de extracción
  // Devuelve array de filas con 7 columnas
  return filasExtraidas;
}
```

**Paso 2**: En `02_Analisis.js`, dentro del bloque `reglas.forEach`:
```javascript
else if (patron.indexOf("tu_patron_siniestros") !== -1) {
  resumenGlobal.siniestros = Modulo_Siniestros(idCorreo);
}
```

**Paso 3**: Añadir lógica de guardado/reporte:
```javascript
if (resumenGlobal.siniestros && resumenGlobal.siniestros.length > 0) {
  guardarEnTablaEspecifica(ss, "Reporte Siniestros", resumenGlobal.siniestros);
  // Añadir a correo si procede
}
```

**Paso 4**: En "Tabla de traducción", añadir fila con patrón y "SI" en columna D

### Modificar formatos de reportes

Los reportes están en `04_Reportes.js`. Cada función construye HTML puro:
- `enviarReporteCliente()` recibe el objeto `resumenGlobal` completo (acceso a todos los módulos)
- `enviarReporteTrabajadores()` recibe solo el array de datos de Economica

**Reglas textuales del agente**: `DIRECTRICES_AGENTE_CORREO_CLIENTE.html`  
**Banderas de runtime**: `10_Directrices_Correo_Cliente.js` (activa/desactiva reportes)

### Cambiar destinatarios de correo

Busca en `04_Reportes.js`:
- `"dayron.rodriguez@nfq.es"` (principal)
- `"ignacio.agusti@nfq.es"` (copia)

Reemplaza por los emails deseados.

### Añadir nuevas etiquetas de Gmail

En `01_ImportadorCorreos.js`, modifica el array `ETIQUETAS_EXTRA` (línea 24):
```javascript
var ETIQUETAS_EXTRA = [
  "MAPFRE/PROCESOS Semanales/CAS",
  "MAPFRE/Mi_Nueva_Etiqueta",  // ← Añade aquí
  "MAPFRE/Apertura"
];
```

---

## 🚀 Despliegue

### Requisitos Previos
- Node.js instalado
- `npm install -g @google/clasp`
- Autenticación de Google configurada (`clasp login`)

### Comandos Básicos

```bash
# Subir cambios locales a Google Apps Script
clasp push

# Abrir el editor de Apps Script en el navegador
clasp open

# Descargar cambios desde Apps Script al repo local
clasp pull

# Listar scripts (para verificar scriptId)
clasp list
```

### CI/CD (Opcional)
Si deseas automatizar el despliegue, considera:
- GitHub Actions + `clasp push`
- Pre-commit hooks para validación de sintaxis
- Logs en Stackdriver (ya configurado en `appsscript.json`)

---

## 📦 Formato de Datos: Modulo_Economica

La función devuelve **filas de 7 columnas**:

```javascript
[
  fecha,           // [0] Fecha del correo (usado en Excel)
  ct,              // [1] Código Tramitador (Excel + Reportes)
  lote,            // [2] Lote (Excel + Reportes)
  numeraciones,    // [3] Numeraciones sep. por coma (Excel + Reportes)
  textoError,      // [4] Texto formateado "N errores por X" (Excel + Reportes)
  cantidad,        // [5] Cantidad numérica (solo reportes)
  errorPuro        // [6] Mensaje error sin formatear (solo reportes)
]
```

**Solo** las primeras 5 columnas se escriben en Excel. Las columnas 6 y 7 se usan internamente para generar frases narrativas del email al cliente.

---

## ⚙️ Consideraciones Importantes

### Timezone
Todo usa `"Europe/Madrid"`. Configurado tanto en `appsscript.json` como en funciones. Cambiar si operas en otra zona horaria.

### Filtro de Fecha
El importador usa formato `yyyy/MM/dd` para el query de Gmail. Esto **evita fallos de madrugada** cuando cambia el día entre UTC y hora local.

### Deduplicación
Los correos se deduplan por su **ID de Gmail** (columna E del log). Un correo procesado nunca se vuelve a insertar automáticamente.

### Ejecución Continuada
`ejecutarAnalisisDiario()` se ejecuta **SIEMPRE** que corre el importador, haya o no correos nuevos. Esto garantiza reanalizar el log de hoy con reglas actualizadas.

### Query de Gmail Inteligente
```
after:2026/05/28 (KO OR NOTOK OR "NOT-OK" OR ERROR OR URGENTE OR CRITICA)
```
Busca solo correos de hoy con estados de error. Modifica en `01_ImportadorCorreos.js` si necesitas otros criterios.

---

## 📝 Logging & Debugging

### Acceder a Logs
```
Apps Script Editor → Ejecuciones → Seleccionar la ejecución → Ver logs
```

### Logs Producidos
- `Logger.log()` → Apps Script Execution Logs
- Stack traces → Stackdriver (si ocurren excepciones)

### Modo Debug Común
```javascript
// En 01_ImportadorCorreos.js, línea 17
var MODO = 0;  // Procesa TODOS los correos (no solo errores)
```

---

## 🔐 Seguridad & Permisos

El script requiere:
- **Gmail API**: Lectura de correos y metadatos
- **Spreadsheet API**: Lectura/escritura en hojas
- **Correo (GmailApp)**: Envío de correos automáticos

Todos son permisos estándar de Apps Script solicitados al instalar triggers.

---

## 📚 Documentación Adicional

Dentro del repo encontrarás:

- **`DISENO_TABLA_PARAMETRICA_ECONOMICA.md`**: Especificación técnica de la tabla paramétrica para normalizar errores TRON
- **`FORMATO_CORREO_CLIENTE.md`**: Guía de estructura HTML para correos al cliente
- **`DIRECTRICES_AGENTE_CORREO_CLIENTE.html`**: Reglas textuales del agente para redactar narrativas

---

## 🎓 Flujo de Aprendizaje Recomendado

1. Lee este `README.md` completo
2. Explora `01_ImportadorCorreos.js` (punto de entrada)
3. Sigue la cadena de llamadas en `02_Analisis.js`
4. Estudia `03_Modulo_Economica.js` (lógica de parseo)
5. Revisal `04_Reportes.js` (construcción de correos)
6. Consulta `DISENO_TABLA_PARAMETRICA_ECONOMICA.md` para la normalizacion

---

## ❓ Preguntas Frecuentes

### ¿Cómo ejecuto el script manualmente?
En el editor de Apps Script (`clasp open`), selecciona `importadordeCorreos` y haz clic en ▶️ Ejecutar.

### ¿Cómo configuro un trigger automático diario?
En el editor → Triggers (reloj) → "Añadir disparador" → Selecciona `importadordeCorreos` → Tiempo: "Diario" → Hora: la que prefieras

### ¿Qué pasa si falla un correo?
El script continúa procesando. Los errores se registran en Stackdriver. Revisa la ejecución en el panel de Apps Script.

### ¿Puedo usar esto con otra herramienta de hojas (no Google Sheets)?
No. Las APIs utilizadas son específicas de Google Workspace. Para Excel Online, habría que refactorizar.

### ¿Cómo añado un nuevo estado de error personalizado?
Modifica la columna C ("Estado") en la "Tabla de traducción". El sistema ya lo reconocerá en la siguiente ejecución.

---

## 📞 Soporte & Contribuciones

- **Bugs**: Abre un issue en GitHub
- **Mejoras**: Submit pull request con descripción clara
- **Preguntas**: Contacta al dueño del proyecto

---

## 📄 Licencia

Uso interno MAPFRE. Todos los derechos reservados.

---

**Última actualización**: 28 de mayo de 2026  
**Versión**: 2.0 (Estable)  
**Rama principal**: `main`

---

## 🚀 Roadmap

- [ ] Implementar tabla paramétrica economica completa (ya diseñada, pendiente de ejecución)
- [ ] Parser mejorado para errores TRAMES
- [ ] Dashboard de métricas en Data Studio
- [ ] Webhook para notificaciones en Slack
- [ ] API REST wrapper para integración externa
- [ ] Tests unitarios (Apps Script está limitado aquí)

---