/**
 * ============================================================================
 * ENVIO DE REPORTES POR CORREO
 * ============================================================================
 * Contiene las dos funciones de reporte:
 *   - enviarReporteCliente()      -> Email narrativo tipo "Status Operativa Diaria"
 *   - enviarReporteTrabajadores() -> Email tecnico con tabla de errores para correccion
 */

/**
 * Envia un correo al cliente con el status de la operativa diaria.
 * La version actual usa plantilla HTML + tabla parametrica para Economica.
 *
 * @param {Object} resumen - Objeto con propiedad 'economica' (array de filas de 7 columnas)
 * @param {Object=} opciones - Opciones de envio para pruebas
 * @returns {string} HTML generado
 */
function enviarReporteCliente(resumen, opciones) {
  var opts = opciones || {};
  var destinatario = opts.destinatario || "dayron.rodriguez@nfq.es"; // <--- CAMBIA EL CORREO AQUI
  var prefijoAsunto = opts.prefijoAsunto || "";
  var hoy = Utilities.formatDate(new Date(), "Europe/Madrid", "dd/MM/yyyy");
  var html = construirHtmlReporteClienteFinal_(resumen || {}, opts);

  GmailApp.sendEmail(destinatario, prefijoAsunto + "Status Operativa Diaria - " + hoy, "", { htmlBody: html });
  return html;
}

function construirHtmlReporteClienteFinal_(resumen, opciones) {
  var opts = opciones || {};
  var quiereIA = opts.usarIA !== false;

  if (quiereIA && usarAgenteCorreoCliente_()) {
    try {
      Logger.log("Iniciando generacion de reporte con IA...");
      return construirHtmlReporteClienteConIA_(resumen || {});
    } catch (e) {
      Logger.log("CRITICO: Fallo el agente de correo cliente. Se usa fallback determinista. Error: " + e.message);
    }
  } else {
    Logger.log("Agente IA omitido (no habilitado o falta configuracion). Usando motor estandar.");
  }

  return construirHtmlReporteCliente_(resumen || {});
}

/**
 * Construye el HTML final del correo cliente usando una plantilla del proyecto.
 *
 * @param {Object} resumen
 * @returns {string}
 */
function construirHtmlReporteCliente_(resumen) {
  var template = cargarPlantillaHtml_("PLANTILLA_CORREO_CLIENTE");
  var placeholders = construirPlaceholdersCorreoCliente_(resumen || {});
  return renderHtmlTemplate_(template, placeholders);
}

/**
 * Prepara los placeholders del correo cliente.
 * Los bloques aun no automatizados quedan visibles para revision manual.
 *
 * @param {Object} resumen
 * @returns {Object}
 */
function construirPlaceholdersCorreoCliente_(resumen) {
  var placeholders = obtenerPlaceholdersBaseCorreoCliente_();
  var personalizados = resumen.placeholdersCliente || {};
  var bloqueados = construirPlaceholdersBloqueadosCorreoCliente_(resumen || {});

  Object.keys(personalizados).forEach(function(key) {
    placeholders[key] = personalizados[key];
  });

  Object.keys(bloqueados).forEach(function(key) {
    placeholders[key] = bloqueados[key];
  });

  placeholders.backend_operaciones_economicas_items_html = construirItemsHtmlClienteEconomica_(resumen.economica || []);
  return placeholders;
}

function obtenerPlaceholdersBaseCorreoCliente_() {
  return {
    trames_cas_recepcion_html: "<strong>REVISION MANUAL:</strong> pendiente de automatizar.",
    trames_cas_envio_html: "<strong>REVISION MANUAL:</strong> pendiente de automatizar.",
    trames_cicos_recepcion_html: "<strong>REVISION MANUAL:</strong> pendiente de automatizar.",
    trames_cicos_envio_html: "<strong>REVISION MANUAL:</strong> pendiente de automatizar.",
    trames_sdm_recepcion_html: "<strong>REVISION MANUAL:</strong> pendiente de automatizar.",
    trames_sdm_envio_html: "<strong>REVISION MANUAL:</strong> pendiente de automatizar.",
    trames_sdplex_resumen_html: "<strong>REVISION MANUAL:</strong> pendiente de automatizar.",
    backend_operaciones_economicas_items_html: "<li>Limpio.</li>",
    cadenas_ko_html: ""
  };
}

function construirPlaceholdersBloqueadosCorreoCliente_(resumen) {
  var monitor = resumen.monitorSistemas || obtenerResumenMonitorDiarioSistemasHoy_();
  var bloqueados = {};
  var resumenMonitorCliente = monitor ? construirResumenClienteMonitorSistemas_(monitor) : { cadenasKoMonitor: [] };

  if (monitor) {
    bloqueados.trames_cas_recepcion_html = resumenMonitorCliente.cas.recepcionHtml;
    bloqueados.trames_cas_envio_html = resumenMonitorCliente.cas.envioHtml;
    bloqueados.trames_cicos_recepcion_html = resumenMonitorCliente.cicos.recepcionHtml;
    bloqueados.trames_cicos_envio_html = resumenMonitorCliente.cicos.envioHtml;
    bloqueados.trames_sdm_recepcion_html = resumenMonitorCliente.sdm.recepcionHtml;
    bloqueados.trames_sdm_envio_html = resumenMonitorCliente.sdm.envioHtml;
    bloqueados.trames_sdplex_resumen_html = resumenMonitorCliente.sdplexHtml;
  }

  bloqueados.cadenas_ko_html = construirCadenasKoHtmlCliente_(resumen || {}, resumenMonitorCliente);
  return bloqueados;
}

function construirCadenasKoHtmlCliente_(resumen, resumenMonitorCliente) {
  // Por ahora no hay una fuente suficientemente fiable para rellenar este
  // bloque, asi que se oculta entero de forma explicita.
  return "";
}

/**
 * Funcion de prueba segura.
 * Busca el ultimo correo de Economica del dia y envia la version cliente
 * al usuario actual o, si no se puede resolver, a ignacio.agusti@nfq.es.
 */
function probarReporteClienteEconomica() {
  var resumen = construirResumenPruebaEconomica_();

  if (!resumen.economica || resumen.economica.length === 0) {
    Logger.log("No se ha encontrado un correo de Economica de hoy para la prueba.");
    return;
  }

  var destinatarioPrueba = obtenerDestinatarioPrueba_();
  enviarReporteCliente(resumen, {
    destinatario: destinatarioPrueba,
    prefijoAsunto: "PRUEBA - "
  });

  Logger.log("Correo de prueba enviado a: " + destinatarioPrueba);
}

function construirResumenPruebaEconomica_() {
  var idCorreo = obtenerUltimoIdCorreoEconomicaDelDia_();
  return { economica: idCorreo ? Modulo_Economica(idCorreo) : [] };
}

function obtenerUltimoIdCorreoEconomicaDelDia_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaLog = ss.getSheetByName("Log errores");
  var TIMEZONE = "Europe/Madrid";

  if (!hojaLog || hojaLog.getLastRow() < 2) return "";

  var filas = hojaLog.getRange(2, 1, hojaLog.getLastRow() - 1, 6).getValues();
  var hoyStr = Utilities.formatDate(new Date(), TIMEZONE, "dd/MM/yyyy");

  for (var i = filas.length - 1; i >= 0; i--) {
    var fila = filas[i];
    var fecha = fila[0];
    var asunto = (fila[3] || "").toString();

    if (Utilities.formatDate(new Date(fecha), TIMEZONE, "dd/MM/yyyy") !== hoyStr) continue;
    if (normalizarTextoBase_(asunto).indexOf("operaciones economicas") === -1) continue;

    return fila[4] || "";
  }

  return "";
}

function obtenerDestinatarioPrueba_() {
  try {
    var email = Session.getActiveUser().getEmail();
    if (email) return email;
  } catch (e) {
    Logger.log("No se pudo resolver el usuario activo: " + e);
  }

  return "ignacio.agusti@nfq.es";
}

/**
 * Envia un correo interno al equipo con el detalle tecnico de los errores
 * para su correccion manual.
 *
 * @param {Array} datos - Array de filas de 7 columnas desde Modulo_Economica
 */
function enviarReporteTrabajadores(datos) {
  if (!debeEnviarCorreoTareasTron_()) {
    Logger.log("Correo tecnico TRON omitido por directriz en 10_Directrices_Correo_Cliente.js.");
    return false;
  }

  var destinatario = "ignacio.agusti@nfq.es"; // <--- CAMBIA EL CORREO AQUI
  var hoy = Utilities.formatDate(new Date(), "Europe/Madrid", "dd/MM/yyyy");

  var html = "<div style='font-family:Arial;'><h3>Detalle tecnico para correccion - " + hoy + "</h3>";
  html += "<table border='1' cellpadding='8' style='border-collapse:collapse; width:100%;'>";
  html += "<tr style='background:#EA9999; color:white;'><th>CT</th><th>Lote</th><th>Numeraciones</th><th>Tipo de Error</th></tr>";

  (datos || []).forEach(function(f) {
    html += "<tr><td>" + escapeHtml_(f[1]) + "</td><td>" + escapeHtml_(f[2]) + "</td><td>" + escapeHtml_(f[3]) + "</td><td>" + escapeHtml_(f[4]) + "</td></tr>";
  });

  html += "</table></div>";
  GmailApp.sendEmail(destinatario, "TAREAS: Errores TRON detectados", "", { htmlBody: html });
  return true;
}
