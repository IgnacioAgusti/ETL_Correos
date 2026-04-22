/**
 * ============================================================================
 * IMPORTADOR DE CORREOS
 * ============================================================================
 * Punto de entrada principal. Busca correos en Gmail con estados de error
 * (KO, NOTOK, ERROR, etc.) y correos de etiquetas especificas, los registra
 * en la hoja "Log errores" y lanza el analisis diario.
 *
 * Dependencias:
 *   - procesarThreads()      -> este mismo archivo
 *   - getLastDataRow()       -> 05_Utilidades.js
 *   - ejecutarAnalisisDiario() -> 02_Analisis.js
 */

function importadordeCorreos() {
  // ---------- Parametros ----------
  var MODO = 1; // 0 = TODOS, 1 = SOLO NOTOK/KO/ERROR, 2 = SOLO OK
  var USAR_TRAD = true; // true = usar "Tabla de traduccion", false = ignorarla
  var HOJA_LOG = "Log errores";
  var HOJA_TRAD = "Tabla de traduccion";
  var TIMEZONE = "Europe/Madrid";

  // Etiquetas que queremos procesar (sin filtrar por estado)
  var ETIQUETAS_EXTRA = [
    "MAPFRE/PROCESOS Semanales/CAS",
    "MAPFRE/Excesiva duración Cadenas",
    "MAPFRE/Apertura"
  ];
  // --------------------------------

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(HOJA_LOG) || ss.insertSheet(HOJA_LOG);

  // Encabezados (asegurar que existan)
  var lastDataRow = getLastDataRow(hoja, 1);
  if (lastDataRow === 0) {
    hoja.appendRow(["Fecha/Hora", "Cadena", "Estado", "Asunto", "ID Correo", "Fuente"]);
    lastDataRow = 1;
  }

  // Cargar IDs ya existentes (columna E = 5)
  var existingIDs = [];
  if (lastDataRow >= 2) {
    existingIDs = hoja.getRange(2, 5, lastDataRow - 1, 1).getValues().flat().filter(function(x){ return x; });
  }
  var existingSet = {};
  existingIDs.forEach(function(id){ existingSet[id] = true; });

  // Cargar tabla de traduccion (si procede)
  var tabla = [];
  if (USAR_TRAD) {
    var hojaTrad = ss.getSheetByName(HOJA_TRAD);
    if (hojaTrad) {
      var lr = hojaTrad.getLastRow();
      if (lr >= 2) {
        var rows = hojaTrad.getRange(2, 1, lr - 1, 3).getValues();
        for (var t = 0; t < rows.length; t++) {
          var pat = rows[t][0];
          if (pat && pat.toString().trim() !== "") {
            tabla.push({
              pattern: pat.toString().toLowerCase(),
              cadena: rows[t][1] || "",
              estado: (rows[t][2] || "").toString().toUpperCase()
            });
          }
        }
      }
    }
  }

  // Fecha para el filtro de Gmail (formato yyyy/MM/dd para evitar fallos de madrugada)
  var hoy = new Date();
  hoy.setHours(0,0,0,0);
  var afterStr = Utilities.formatDate(hoy, TIMEZONE, "yyyy/MM/dd");

  var filasAAgregar = [];

  // BLOQUE 1: Correos con KO/NOTOK/ERROR (o todos si MODO=0)
  var query = 'after:' + afterStr;
  if (MODO === 1) {
    query += ' (KO OR NOTOK OR "NOT-OK" OR ERROR OR URGENTE OR CRITICA OR "Incidencias de envio")';
  } else if (MODO === 2) {
    query += ' (OK)';
  }
  
  var threadsErrores = GmailApp.search(query, 0, 100);
  procesarThreads(threadsErrores, filasAAgregar, existingSet, tabla, MODO, hoy, false);

  // BLOQUE 2: Correos de las etiquetas extra
  ETIQUETAS_EXTRA.forEach(function(etiqueta){
    var threadsEtiqueta = GmailApp.search('label:"' + etiqueta + '" after:' + afterStr, 0, 50);
    procesarThreads(threadsEtiqueta, filasAAgregar, existingSet, tabla, MODO, hoy, true);
  });

  // Guardar en el Log si hay nuevos
  if (filasAAgregar.length > 0) {
    hoja.getRange(hoja.getLastRow() + 1, 1, filasAAgregar.length, 6).setValues(filasAAgregar);
    SpreadsheetApp.flush(); // Forzar guardado en Excel antes de seguir
    Logger.log("Nuevas filas añadidas al log: " + filasAAgregar.length);
  } else {
    Logger.log("No hay correos nuevos para añadir al log en este momento.");
  }

  // ============================================================
  // ORQUESTADOR: Se ejecuta SIEMPRE para revisar los datos de hoy
  // ============================================================
  Logger.log("Iniciando análisis diario de incidencias...");
  ejecutarAnalisisDiario();

  return "Proceso finalizado. Filas añadidas al log: " + filasAAgregar.length;
}

/**
 * Procesa un array de threads de Gmail y extrae las filas para el log.
 * Se usa tanto para los correos encontrados por query como por etiqueta.
 */
function procesarThreads(threads, filasAAgregar, existingSet, tabla, MODO, hoy, forzarHoyEtiqueta) {
  for (var i = 0; i < threads.length; i++) {
    var mensajes = threads[i].getMessages();
    for (var j = 0; j < mensajes.length; j++) {
      var mensaje = mensajes[j];
      var msgDate = mensaje.getDate();
      if (msgDate < hoy) continue;
      
      var id = mensaje.getId();
      if (existingSet[id]) continue; 

      var asunto = (mensaje.getSubject() || "").toString().trim();
      var asuntoLower = asunto.toLowerCase();
      var cadena = "DESCONOCIDO", estado = "DESCONOCIDO", fuente = "Auto";

      var endMatch = asunto.match(/(?:-|_|\s)?(KO|NOTOK|NOT-OK|OK|CRITICA)\s*$/i);
      if (endMatch) {
        estado = endMatch[1].toString().toUpperCase().replace(/-/g,"");
        var mC = asunto.match(/U\d{7}/i);
        if (mC) cadena = mC[0].toUpperCase();
      } else if (/ERROR/i.test(asunto)) {
        estado = "NOTOK";
        var mE = asunto.match(/U\d{7}/i);
        if (mE) cadena = mE[0].toUpperCase();
      }

      if (tabla.length > 0) {
        for (var k = 0; k < tabla.length; k++) {
          if (asuntoLower.indexOf(tabla[k].pattern) !== -1) {
            if (tabla[k].cadena) cadena = tabla[k].cadena;
            if (tabla[k].estado) estado = tabla[k].estado.toString().toUpperCase();
            fuente = "Traduccion";
            break;
          }
        }
      }

      var incluir = false;
      if (!forzarHoyEtiqueta) {
        if (MODO === 0) incluir = true;
        else if (MODO === 1) {
          if (estado === "NOTOK" || estado === "KO" || /ERROR/i.test(asunto) || asuntoLower.indexOf("incidencias de envio") !== -1) incluir = true;
        }
      } else { 
        incluir = true; 
        fuente = "Etiqueta"; 
      }

      if (incluir) {
        filasAAgregar.push([msgDate, cadena, estado, asunto, id, fuente]);
        existingSet[id] = true;
      }
    }
  }
}
