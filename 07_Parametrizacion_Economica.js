/**
 * ============================================================================
 * PARAMETRIZACION DE OPERACIONES ECONOMICAS
 * ============================================================================
 * Carga una tabla parametrica desde Spreadsheet para normalizar errores,
 * agruparlos por clave canonica y convertirlos en texto cliente estandar.
 */

var NOMBRE_HOJA_PARAMETRICA_ECONOMICA = "Tabla parametrica economica";
var HEADERS_TABLA_PARAMETRICA_ECONOMICA = [
  "activo",
  "orden_cliente",
  "tipo_match",
  "patron_entrada",
  "clave_error",
  "error_canonico",
  "frase_cliente_singular",
  "frase_cliente_plural",
  "estado_operativo",
  "activo_cliente",
  "observaciones"
];

var FILAS_SEMILLA_TABLA_PARAMETRICA_ECONOMICA = [
  ["SI", 10, "CONTIENE", "-20 Ya existe la OP contabilizada en Tron", "OPERACION_DUPLICADA_TRON", "Operacion duplicada enviada a TRON", "Se ha identificado una operacion duplicada enviada a TRON", "Se han identificado {{cantidad}} operaciones duplicadas enviadas a TRON", "Detectado hoy, se resolvera a lo largo del dia.", "SI", "Variante contabilizada en TRON"],
  ["SI", 10, "CONTIENE", "-20 Ya existe la OP", "OPERACION_DUPLICADA_TRON", "Operacion duplicada enviada a TRON", "Se ha identificado una operacion duplicada enviada a TRON", "Se han identificado {{cantidad}} operaciones duplicadas enviadas a TRON", "Detectado hoy, se resolvera a lo largo del dia.", "SI", "Variante corta"],
  ["SI", 10, "CONTIENE", "DUPLICAD", "OPERACION_DUPLICADA_TRON", "Operacion duplicada enviada a TRON", "Se ha identificado una operacion duplicada enviada a TRON", "Se han identificado {{cantidad}} operaciones duplicadas enviadas a TRON", "Detectado hoy, se resolvera a lo largo del dia.", "SI", "Fallback generico para duplicadas"],

  ["SI", 20, "CONTIENE", "34 Error al obtener NUM_CRUCE (Cod_docum erroneo)", "ERROR_NUM_CRUCE", "Error al obtener NUM_CRUCE", "Se ha identificado un error al obtener NUM_CRUCE", "Se han identificado {{cantidad}} errores al obtener NUM_CRUCE", "En analisis.", "SI", "Variante extendida"],
  ["SI", 20, "CONTIENE", "34 Error al obtener NUM_CRUCE", "ERROR_NUM_CRUCE", "Error al obtener NUM_CRUCE", "Se ha identificado un error al obtener NUM_CRUCE", "Se han identificado {{cantidad}} errores al obtener NUM_CRUCE", "En analisis.", "SI", "Variante corta"],

  ["SI", 30, "REGEX", "OPERACION NO EXISTE( EN TR\\d+)?", "OPERACION_NO_EXISTE_TRON", "Operacion no existe en TRON", "Se ha identificado un error por operacion no existente en TRON", "Se han identificado {{cantidad}} errores por operacion no existente en TRON", "En analisis.", "SI", "Agrupa variantes con TR"],

  ["SI", 40, "CONTIENE", "-10 Perceptor inhabilitado o con fechas de validez erroenas", "PERCEPTOR_INHABILITADO", "Perceptor inhabilitado o con fechas de validez erroneas", "Se ha identificado un error por perceptor inhabilitado o con fechas de validez erroneas", "Se han identificado {{cantidad}} errores por perceptor inhabilitado o con fechas de validez erroneas", "En analisis.", "SI", "Variante completa"],
  ["SI", 40, "CONTIENE", "-10 Perceptor inhabilitado o", "PERCEPTOR_INHABILITADO", "Perceptor inhabilitado o con fechas de validez erroneas", "Se ha identificado un error por perceptor inhabilitado o con fechas de validez erroneas", "Se han identificado {{cantidad}} errores por perceptor inhabilitado o con fechas de validez erroneas", "En analisis.", "SI", "Variante truncada"],

  ["SI", 50, "CONTIENE", "-18 Concepto Economico no dado de alta en CONVA o Impuesto con codigo a Nulo", "CONCEPTO_ECONOMICO_NO_DISPONIBLE", "Concepto economico no dado de alta o impuesto con codigo nulo", "Se ha identificado un error por concepto economico no disponible", "Se han identificado {{cantidad}} errores por concepto economico no disponible", "En analisis.", "SI", ""],

  ["SI", 60, "EXACTO", "-2 No se ha podido recuperar la descripcion", "DESCRIPCION_NO_RECUPERADA", "No se ha podido recuperar la descripcion", "Se ha identificado un error al recuperar la descripcion", "Se han identificado {{cantidad}} errores al recuperar la descripcion", "En analisis.", "SI", "Codigo -2"],
  ["SI", 60, "EXACTO", "-8 No se ha podido recuperar la descripcion", "DESCRIPCION_NO_RECUPERADA", "No se ha podido recuperar la descripcion", "Se ha identificado un error al recuperar la descripcion", "Se han identificado {{cantidad}} errores al recuperar la descripcion", "En analisis.", "SI", "Codigo -8"],
  ["SI", 60, "EXACTO", "1 No se ha podido recuperar la descripcion", "DESCRIPCION_NO_RECUPERADA", "No se ha podido recuperar la descripcion", "Se ha identificado un error al recuperar la descripcion", "Se han identificado {{cantidad}} errores al recuperar la descripcion", "En analisis.", "SI", "Codigo 1"],
  ["SI", 60, "EXACTO", "25 No se ha podido recuperar la descripcion", "DESCRIPCION_NO_RECUPERADA", "No se ha podido recuperar la descripcion", "Se ha identificado un error al recuperar la descripcion", "Se han identificado {{cantidad}} errores al recuperar la descripcion", "En analisis.", "SI", "Codigo 25"],
  ["SI", 60, "EXACTO", "33 No se ha podido recuperar la descripcion", "DESCRIPCION_NO_RECUPERADA", "No se ha podido recuperar la descripcion", "Se ha identificado un error al recuperar la descripcion", "Se han identificado {{cantidad}} errores al recuperar la descripcion", "En analisis.", "SI", "Codigo 33"],
  ["SI", 60, "EXACTO", "101 No se ha podido recuperar la descripcion", "DESCRIPCION_NO_RECUPERADA", "No se ha podido recuperar la descripcion", "Se ha identificado un error al recuperar la descripcion", "Se han identificado {{cantidad}} errores al recuperar la descripcion", "En analisis.", "SI", "Codigo 101"],

  ["SI", 70, "CONTIENE", "-9 Errores en datos personales, postales o bancarios", "DATOS_PERSONALES_POSTALES_BANCARIOS", "Errores en datos personales, postales o bancarios", "Se ha identificado un error en datos personales, postales o bancarios", "Se han identificado {{cantidad}} errores en datos personales, postales o bancarios", "En analisis.", "SI", ""],

  ["SI", 80, "CONTIENE", "-23 El perceptor al que se realiza el pago es un taller Inhabilitado", "TALLER_INHABILITADO", "Perceptor de tipo taller inhabilitado", "Se ha identificado un error por taller inhabilitado", "Se han identificado {{cantidad}} errores por taller inhabilitado", "En analisis.", "SI", ""],
  ["SI", 90, "CONTIENE", "-31 El perceptor al que se realiza el pago es un Abogado colaborador Inhabilitado", "ABOGADO_INHABILITADO", "Abogado colaborador inhabilitado", "Se ha identificado un error por abogado colaborador inhabilitado", "Se han identificado {{cantidad}} errores por abogado colaborador inhabilitado", "En analisis.", "SI", ""],
  ["SI", 100, "CONTIENE", "-32 El perceptor al que se realiza el pago es un Procurador colaborador Inhabilitado", "PROCURADOR_INHABILITADO", "Procurador colaborador inhabilitado", "Se ha identificado un error por procurador colaborador inhabilitado", "Se han identificado {{cantidad}} errores por procurador colaborador inhabilitado", "En analisis.", "SI", ""],

  ["SI", 110, "CONTIENE", "30 Consignacion judicial enviada, no se puede ANULAR", "CONSIGNACION_NO_ANULABLE", "Consignacion judicial no anulable", "Se ha identificado una consignacion judicial que no se puede anular", "Se han identificado {{cantidad}} consignaciones judiciales que no se pueden anular", "En analisis.", "SI", ""],
  ["SI", 120, "CONTIENE", "8 La operacion ya se encuentra anulada", "OPERACION_YA_ANULADA", "Operacion ya anulada", "Se ha identificado una operacion ya anulada", "Se han identificado {{cantidad}} operaciones ya anuladas", "En analisis.", "SI", ""]
];

/**
 * Crea la hoja parametrica si no existe y la rellena con una primera semilla.
 * No sobreescribe filas existentes.
 *
 * @returns {string}
 */
function inicializarTablaParametricaEconomica() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaExistente = ss.getSheetByName(NOMBRE_HOJA_PARAMETRICA_ECONOMICA);
  var estabaVacia = !hojaExistente || getLastDataRow(hojaExistente, 1) < 2;
  var hoja = asegurarHojaParametricaEconomica_();

  if (estabaVacia) {
    return "Tabla parametrica economica creada con " + FILAS_SEMILLA_TABLA_PARAMETRICA_ECONOMICA.length + " reglas.";
  }

  return "La tabla parametrica economica ya existe y contiene datos. No se ha sobreescrito.";
}

/**
 * Devuelve las reglas activas de la tabla parametrica.
 *
 * @returns {Array<Object>}
 */
function obtenerReglasParametricasEconomica_() {
  var hoja = asegurarHojaParametricaEconomica_();
  var lastRow = getLastDataRow(hoja, 1);

  if (lastRow < 2) return [];

  var rows = hoja.getRange(2, 1, lastRow - 1, HEADERS_TABLA_PARAMETRICA_ECONOMICA.length).getValues();
  var reglas = [];

  rows.forEach(function(row, index) {
    if (!valorEsSi_(row[0])) return;
    if (!row[3] || !row[4]) return;

    reglas.push({
      fila: index + 2,
      ordenCliente: Number(row[1]) || 9999,
      tipoMatch: (row[2] || "CONTIENE").toString().trim().toUpperCase(),
      patronEntrada: row[3].toString().trim(),
      patronNormalizado: normalizarTextoBase_(row[3]),
      claveError: row[4].toString().trim(),
      errorCanonico: (row[5] || "").toString().trim(),
      fraseClienteSingular: (row[6] || "").toString().trim(),
      fraseClientePlural: (row[7] || "").toString().trim(),
      estadoOperativo: (row[8] || "").toString().trim(),
      activoCliente: valorEsSi_(row[9]),
      observaciones: (row[10] || "").toString().trim()
    });
  });

  reglas.sort(ordenarReglasParametricasParaMatch_);
  return reglas;
}

/**
 * Agrupa los errores de Economica por clave canonica y devuelve los <li> HTML.
 *
 * @param {Array<Array>} filas
 * @returns {string}
 */
function construirItemsHtmlClienteEconomica_(filas) {
  var reglas = obtenerReglasParametricasEconomica_();
  var grupos = {};
  var pendientes = {};

  (filas || []).forEach(function(fila) {
    var cantidad = Number(fila[5]) || 1;
    var errorOriginal = (fila[6] || "").toString().trim();

    if (!errorOriginal) return;

    var regla = resolverErrorParametricoEconomica_(errorOriginal, reglas);

    if (regla) {
      if (!regla.activoCliente) return;

      if (!grupos[regla.claveError]) {
        grupos[regla.claveError] = {
          claveError: regla.claveError,
          ordenCliente: regla.ordenCliente,
          errorCanonico: regla.errorCanonico,
          fraseClienteSingular: regla.fraseClienteSingular,
          fraseClientePlural: regla.fraseClientePlural,
          estadoOperativo: regla.estadoOperativo,
          cantidad: 0
        };
      }

      grupos[regla.claveError].cantidad += cantidad;
      return;
    }

    if (!pendientes[errorOriginal]) {
      pendientes[errorOriginal] = { errorOriginal: errorOriginal, cantidad: 0 };
    }

    pendientes[errorOriginal].cantidad += cantidad;
  });

  var items = Object.keys(grupos).map(function(key) {
    return grupos[key];
  });

  items.sort(function(a, b) {
    if (a.ordenCliente !== b.ordenCliente) return a.ordenCliente - b.ordenCliente;
    return a.claveError.localeCompare(b.claveError);
  });

  var html = items.map(function(item) {
    return renderizarItemClienteEconomica_(item);
  });

  Object.keys(pendientes).sort().forEach(function(key) {
    html.push(renderizarItemRevisionManualEconomica_(pendientes[key]));
  });

  if (html.length === 0) {
    html.push("<li>Limpio.</li>");
  }

  return html.join("\n");
}

/**
 * Intenta resolver un error original contra la tabla parametrica.
 *
 * @param {string} errorOriginal
 * @param {Array<Object>} reglas
 * @returns {Object|null}
 */
function resolverErrorParametricoEconomica_(errorOriginal, reglas) {
  var original = (errorOriginal || "").toString().trim();
  var normalizado = normalizarTextoBase_(original);

  for (var i = 0; i < reglas.length; i++) {
    if (cumpleReglaParametricaEconomica_(original, normalizado, reglas[i])) {
      return reglas[i];
    }
  }

  return null;
}

function asegurarHojaParametricaEconomica_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(NOMBRE_HOJA_PARAMETRICA_ECONOMICA) || ss.insertSheet(NOMBRE_HOJA_PARAMETRICA_ECONOMICA);

  prepararHeadersTablaParametricaEconomica_(hoja);

  if (getLastDataRow(hoja, 1) < 2) {
    sembrarTablaParametricaEconomica_(hoja);
  }

  return hoja;
}

function prepararHeadersTablaParametricaEconomica_(hoja) {
  var lastRow = getLastDataRow(hoja, 1);

  if (lastRow === 0) {
    hoja.appendRow(HEADERS_TABLA_PARAMETRICA_ECONOMICA);
    hoja.getRange(1, 1, 1, HEADERS_TABLA_PARAMETRICA_ECONOMICA.length)
      .setFontWeight("bold")
      .setBackground("#EA9999")
      .setFontColor("white");
    return;
  }

  var headerRange = hoja.getRange(1, 1, 1, HEADERS_TABLA_PARAMETRICA_ECONOMICA.length);
  var headerValues = headerRange.getValues()[0];
  var hayHeader = headerValues.some(function(cell) { return cell !== ""; });

  if (!hayHeader) {
    headerRange.setValues([HEADERS_TABLA_PARAMETRICA_ECONOMICA]);
    headerRange.setFontWeight("bold").setBackground("#EA9999").setFontColor("white");
  }
}

function sembrarTablaParametricaEconomica_(hoja) {
  var startRow = 2;
  hoja.getRange(startRow, 1, FILAS_SEMILLA_TABLA_PARAMETRICA_ECONOMICA.length, HEADERS_TABLA_PARAMETRICA_ECONOMICA.length)
    .setValues(FILAS_SEMILLA_TABLA_PARAMETRICA_ECONOMICA);
}

function ordenarReglasParametricasParaMatch_(a, b) {
  var prioridadTipo = { EXACTO: 1, REGEX: 2, CONTIENE: 3 };
  var prioA = prioridadTipo[a.tipoMatch] || 99;
  var prioB = prioridadTipo[b.tipoMatch] || 99;

  if (prioA !== prioB) return prioA - prioB;
  if (a.patronEntrada.length !== b.patronEntrada.length) return b.patronEntrada.length - a.patronEntrada.length;
  return a.fila - b.fila;
}

function cumpleReglaParametricaEconomica_(original, normalizado, regla) {
  if (!regla || !regla.patronEntrada) return false;

  if (regla.tipoMatch === "EXACTO") {
    return normalizado === regla.patronNormalizado;
  }

  if (regla.tipoMatch === "REGEX") {
    try {
      return new RegExp(regla.patronEntrada, "i").test(original);
    } catch (e) {
      Logger.log("Regex invalida en fila " + regla.fila + ": " + e);
      return false;
    }
  }

  return normalizado.indexOf(regla.patronNormalizado) !== -1;
}

function renderizarItemClienteEconomica_(item) {
  var plantilla = item.cantidad === 1 ? item.fraseClienteSingular : item.fraseClientePlural;
  var frase = plantilla || construirFraseFallbackCanonicaEconomica_(item);
  var estado = item.estadoOperativo || "REVISION MANUAL: completar estado operativo.";

  frase = frase.split("{{cantidad}}").join(String(item.cantidad));
  frase = frase.split("{{error_canonico}}").join(item.errorCanonico || "");

  return "<li>" + escapeHtml_(frase) + ". <strong>" + escapeHtml_(estado) + "</strong></li>";
}

function construirFraseFallbackCanonicaEconomica_(item) {
  if (item.cantidad === 1) {
    return "Se ha identificado un error por " + (item.errorCanonico || "incidencia parametrizada");
  }

  return "Se han identificado " + item.cantidad + " errores por " + (item.errorCanonico || "incidencia parametrizada");
}

function renderizarItemRevisionManualEconomica_(item) {
  var prefijo = item.cantidad === 1
    ? "Se ha detectado 1 caso con el error no parametrizado"
    : "Se han detectado " + item.cantidad + " casos con el error no parametrizado";

  return "<li><strong>REVISION MANUAL:</strong> " + escapeHtml_(prefijo) + ": " + escapeHtml_(item.errorOriginal) + ".</li>";
}
