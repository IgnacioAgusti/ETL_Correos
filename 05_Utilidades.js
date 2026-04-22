/**
 * ============================================================================
 * FUNCIONES AUXILIARES / UTILIDADES
 * ============================================================================
 */

/**
 * Guarda un conjunto de filas en una hoja especifica de la spreadsheet.
 * Si la hoja no existe, la crea. Si existe, la limpia antes de escribir.
 *
 * @param {string} nombre   - Nombre de la hoja destino
 * @param {Array}  headers  - Array de strings con los encabezados
 * @param {Array}  filas    - Array de arrays con los datos (se usan solo las N primeras columnas segun headers)
 */
function guardarEnTablaEspecifica(nombre, headers, filas) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(nombre) || ss.insertSheet(nombre);
  
  hoja.clear(); 
  hoja.appendRow(headers);
  hoja.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#EA9999").setFontColor("white");
  
  if (filas.length > 0) {
    // Filtramos para meter en Excel solo las columnas que corresponden a los headers
    var filasParaExcel = filas.map(function(f) { return [f[0], f[1], f[2], f[3], f[4]]; });
    hoja.getRange(2, 1, filasParaExcel.length, 5).setValues(filasParaExcel);
  }
  SpreadsheetApp.flush();
}

/**
 * Devuelve la ultima fila con datos en una columna concreta.
 * Util para evitar depender de getLastRow() que cuenta filas con formato.
 *
 * @param {Sheet}  sheet - Objeto hoja de calculo
 * @param {number} col   - Numero de columna (1-indexed)
 * @returns {number} Numero de la ultima fila con datos, o 0 si esta vacia
 */
function getLastDataRow(sheet, col) {
  var maxRows = sheet.getMaxRows();
  if (maxRows === 0) return 0;
  var column = sheet.getRange(1, col, maxRows).getValues();
  for (var i = column.length - 1; i >= 0; i--) {
    if (column[i][0] !== "" && column[i][0] !== null) return i + 1;
  }
  return 0;
}

/**
 * Escapa HTML basico para poder imprimir valores seguros en el correo.
 *
 * @param {*} value
 * @returns {string}
 */
function escapeHtml_(value) {
  if (value === null || value === undefined) return "";

  return value.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Carga el contenido de una plantilla HTML del proyecto de Apps Script.
 *
 * @param {string} nombreArchivo
 * @returns {string}
 */
function cargarPlantillaHtml_(nombreArchivo) {
  return HtmlService.createHtmlOutputFromFile(nombreArchivo).getContent();
}

/**
 * Reemplaza placeholders tipo {{clave}} en una plantilla HTML.
 *
 * @param {string} template
 * @param {Object} data
 * @returns {string}
 */
function renderHtmlTemplate_(template, data) {
  var html = template || "";
  var payload = data || {};

  Object.keys(payload).forEach(function(key) {
    var token = "{{" + key + "}}";
    var value = payload[key];
    html = html.split(token).join(value === null || value === undefined ? "" : String(value));
  });

  return html;
}

/**
 * Normaliza un texto para comparaciones robustas.
 *
 * @param {*} value
 * @returns {string}
 */
function normalizarTextoBase_(value) {
  var texto = (value || "").toString().toLowerCase().trim().replace(/\s+/g, " ");

  if (texto && texto.normalize) {
    texto = texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  return texto;
}

/**
 * Devuelve true cuando el valor representa un "SI" en la hoja.
 *
 * @param {*} value
 * @returns {boolean}
 */
function valorEsSi_(value) {
  return (value || "").toString().trim().toUpperCase() === "SI";
}

/**
 * Mezcla objetos en un nuevo objeto destino.
 *
 * @returns {Object}
 */
function mezclarObjetos_() {
  var out = {};

  for (var i = 0; i < arguments.length; i++) {
    var source = arguments[i] || {};
    Object.keys(source).forEach(function(key) {
      out[key] = source[key];
    });
  }

  return out;
}

/**
 * Une fragmentos de texto en formato natural: "a", "a y b", "a, b y c".
 *
 * @param {Array<string>} partes
 * @returns {string}
 */
function unirPartesTexto_(partes) {
  var limpias = (partes || []).filter(function(parte) {
    return !!(parte || "").toString().trim();
  });

  if (limpias.length === 0) return "";
  if (limpias.length === 1) return limpias[0];
  if (limpias.length === 2) return limpias[0] + " y " + limpias[1];

  return limpias.slice(0, -1).join(", ") + " y " + limpias[limpias.length - 1];
}
