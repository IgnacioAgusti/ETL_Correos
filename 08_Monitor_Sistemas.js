/**
 * ============================================================================
 * MONITOR DIARIO SISTEMAS
 * ============================================================================
 * Extrae informacion del correo "Monitor diario sistemas" para alimentar
 * el correo cliente con datos de CAS, CICOS y SDM.
 */

var ASUNTO_OBJETIVO_MONITOR_DIARIO = "REAL: Monitor diario sistemas";

/**
 * Busca el correo mas reciente de "Monitor diario sistemas" y
 * devuelve un resumen estructurado.
 *
 * @returns {Object|null}
 */
function obtenerResumenMonitorDiarioSistemasHoy_() {
  return obtenerResumenMonitorDiarioSistemas_();
}

/**
 * Busca el correo mas reciente del monitor diario y devuelve un resumen
 * estructurado.
 *
 * @returns {Object|null}
 */
function obtenerResumenMonitorDiarioSistemas_() {
  var idCorreo = obtenerUltimoIdCorreoMonitorDiario_();
  return idCorreo ? extraerMonitorDiarioSistemas_(idCorreo) : null;
}

/**
 * Localiza el ultimo mensaje del monitor diario de sistemas.
 *
 * @returns {string}
 */
function obtenerUltimoIdCorreoMonitorDiarioHoy_() {
  return obtenerUltimoIdCorreoMonitorDiario_();
}

function obtenerUltimoIdCorreoMonitorDiario_() {
  return obtenerUltimoIdCorreoPorAsuntoExacto_(ASUNTO_OBJETIVO_MONITOR_DIARIO);
}

function obtenerUltimoIdCorreoPorAsuntoExacto_(asuntoObjetivo) {
  var objetivoNormalizado = normalizarAsuntoCorreo_(asuntoObjetivo);
  if (!objetivoNormalizado) return "";

  var asuntoEscapado = (asuntoObjetivo || "").replace(/"/g, '\\"');
  var query = 'subject:"' + asuntoEscapado + '" in:anywhere';
  var lote = 50;
  var maxThreads = 500;
  var offset = 0;
  var mejorMensaje = { id: "", fecha: null };

  while (offset < maxThreads) {
    var cantidad = Math.min(lote, maxThreads - offset);
    var threads = GmailApp.search(query, offset, cantidad);
    if (!threads || threads.length === 0) break;

    for (var i = 0; i < threads.length; i++) {
      var mensajes = threads[i].getMessages();

      for (var j = mensajes.length - 1; j >= 0; j--) {
        var mensaje = mensajes[j];
        if (normalizarAsuntoCorreo_(mensaje.getSubject()) !== objetivoNormalizado) continue;

        var fechaMensaje = mensaje.getDate();
        if (!mejorMensaje.fecha || fechaMensaje.getTime() > mejorMensaje.fecha.getTime()) {
          mejorMensaje = {
            id: mensaje.getId(),
            fecha: fechaMensaje
          };
        }
      }
    }

    if (threads.length < cantidad) break;
    offset += threads.length;
  }

  return mejorMensaje.id || "";
}

function normalizarAsuntoCorreo_(asunto) {
  return (asunto || "").toString().replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * Convierte un correo del monitor en un objeto estructurado.
 *
 * @param {string} idCorreo
 * @returns {Object|null}
 */
function extraerMonitorDiarioSistemas_(idCorreo) {
  try {
    var mensaje = GmailApp.getMessageById(idCorreo);
    var body = mensaje.getPlainBody();
    var lineas = body.split(/\r?\n/);
    var fecha = extraerFechaMonitor_(lineas);
    var secciones = dividirSeccionesMonitor_(lineas);

    return {
      idCorreo: idCorreo,
      fecha: fecha,
      cas: parsearSeccionMonitor_(secciones.CAS || []),
      cicos: parsearSeccionMonitor_(secciones.CICOS || []),
      sdm: parsearSeccionMonitor_(secciones.SDM || []),
      rawText: body
    };
  } catch (e) {
    Logger.log("Error al extraer Monitor diario sistemas: " + e);
    return null;
  }
}

/**
 * Funcion de apoyo para revisar el parseo en Apps Script.
 *
 * @returns {Object|null}
 */
function probarParserMonitorDiarioSistemas() {
  var resumen = obtenerResumenMonitorDiarioSistemasHoy_();
  Logger.log(JSON.stringify(resumen, null, 2));
  return resumen;
}

function extraerFechaMonitor_(lineas) {
  for (var i = 0; i < lineas.length; i++) {
    var match = lineas[i].match(/^\s*Fecha:\s*(.+)\s*$/i);
    if (match) return match[1].trim();
  }
  return "";
}

function dividirSeccionesMonitor_(lineas) {
  var secciones = { CAS: [], CICOS: [], SDM: [] };
  var actual = "";

  lineas.forEach(function(linea) {
    var limpia = (linea || "").replace(/\s+$/g, "");

    if (/^\s*CAS:\s*$/i.test(limpia)) {
      actual = "CAS";
      return;
    }
    if (/^\s*CICOS:\s*$/i.test(limpia)) {
      actual = "CICOS";
      return;
    }
    if (/^\s*SDM:\s*$/i.test(limpia)) {
      actual = "SDM";
      return;
    }

    if (actual) {
      secciones[actual].push(limpia);
    }
  });

  return secciones;
}

function parsearSeccionMonitor_(lineas) {
  var res = {
    recepcion: null,
    envio: null,
    estados: {},
    detalles: []
  };
  var detalleActual = null;
  var enDetalles = false;

  (lineas || []).forEach(function(linea) {
    var texto = (linea || "").trim();
    if (!texto) return;

    var mRecepcion = texto.match(/^Recepcion:\s*(\d+)/i);
    if (mRecepcion) {
      res.recepcion = Number(mRecepcion[1]);
      return;
    }

    var mEnvio = texto.match(/^Envio:\s*(\d+)/i);
    if (mEnvio) {
      res.envio = Number(mEnvio[1]);
      return;
    }

    var mEstado = texto.match(/^COD_ESTADO\s*(?:=\s*)?([A-Za-z]):\s*(\d*)\s*$/i);
    if (mEstado) {
      var clave = mEstado[1].toUpperCase();
      var valor = mEstado[2] === "" ? null : Number(mEstado[2]);
      res.estados[clave] = valor;
      return;
    }

    if (/^>>\s*Detalle errores/i.test(texto)) {
      enDetalles = true;
      return;
    }

    if (!enDetalles) return;

    var mDetalle = texto.match(/^Lote:\s*(\S+)\s*\|\s*Reg:\s*(\S+)/i);
    if (mDetalle) {
      detalleActual = {
        lote: mDetalle[1],
        reg: mDetalle[2],
        traza: "",
        error: ""
      };
      res.detalles.push(detalleActual);
      return;
    }

    if (/^\[Traza\]/i.test(texto) && detalleActual) {
      detalleActual.traza = texto;
      var mError = texto.match(/ERROR:\s*(.+)$/i);
      detalleActual.error = mError ? mError[1].trim() : texto;
    }
  });

  return res;
}

/**
 * Convierte el resumen tecnico del monitor en textos breves para cliente.
 *
 * @param {Object|null} monitor
 * @returns {Object}
 */
function construirResumenClienteMonitorSistemas_(monitor) {
  var cas = crearResumenClienteSeccionMonitor_("CAS", monitor && monitor.cas ? monitor.cas : {});
  var cicos = crearResumenClienteSeccionMonitor_("CICOS", monitor && monitor.cicos ? monitor.cicos : {});
  var sdm = crearResumenClienteSeccionMonitor_("SDM", monitor && monitor.sdm ? monitor.sdm : {});
  var cadenasKoMonitor = [cas.cadenaKoTexto, cicos.cadenaKoTexto, sdm.cadenaKoTexto].filter(Boolean);

  return {
    cas: cas,
    cicos: cicos,
    sdm: sdm,
    sdplexHtml: "<strong>REVISION MANUAL:</strong> pendiente de automatizar.",
    cadenasKoMonitor: cadenasKoMonitor
  };
}

function crearResumenClienteSeccionMonitor_(nombre, seccion) {
  var datos = seccion || {};
  var gruposErrores = agruparErroresMonitorCliente_(datos.detalles || []);
  var cadenaKoTexto = "";

  if (gruposErrores.length > 0) {
    cadenaKoTexto = nombre + ": " + construirTextoGruposErroresMonitorCliente_(gruposErrores);
  } else {
    var erroresF = obtenerCantidadEstadoMonitor_(datos, "F");
    var pendientesP = obtenerCantidadEstadoMonitor_(datos, "P");

    if (erroresF > 0) {
      cadenaKoTexto = nombre + ": " + construirTextoCantidadMonitor_(erroresF, "error", "errores") + " en recepcion.";
    } else if (nombre === "CAS" && debeIncluirPendientesCasEnCadenasKo_() && pendientesP > 0) {
      cadenaKoTexto = nombre + ": " + construirTextoEstadosMonitorCliente_(datos.estados || {}, "recepcion");
    }
  }

  return {
    recepcionHtml: construirHtmlRecepcionMonitorCliente_(datos, gruposErrores),
    envioHtml: construirHtmlEnvioMonitorCliente_(datos),
    cadenaKoTexto: cadenaKoTexto
  };
}

function construirHtmlRecepcionMonitorCliente_(seccion, gruposErrores) {
  var grupos = gruposErrores || [];
  if (grupos.length > 0) {
    return renderizarGruposErroresMonitorCliente_(grupos);
  }

  var textoEstados = construirTextoEstadosMonitorCliente_((seccion && seccion.estados) || {}, "recepcion");
  if (textoEstados) {
    return escapeHtml_(textoEstados);
  }

  var recepcion = Number(seccion && seccion.recepcion) || 0;
  if (recepcion > 0) {
    return escapeHtml_(construirTextoCantidadMonitor_(recepcion, "recepcion", "recepciones") + " registradas.");
  }

  return "Limpio";
}

function construirHtmlEnvioMonitorCliente_(seccion) {
  var envio = Number(seccion && seccion.envio) || 0;
  if (envio <= 0) return "Limpio";

  return escapeHtml_(construirTextoCantidadMonitor_(envio, "envio", "envios") + " registrados.");
}

function construirTextoEstadosMonitorCliente_(estados, unidad) {
  var singular = unidad || "registro";
  var plural = singular === "recepcion" ? "recepciones" : singular + "s";
  var ordenEstados = ["P", "F", "N", "L"];
  var partes = [];

  ordenEstados.forEach(function(codigo) {
    var cantidad = Number((estados || {})[codigo]) || 0;
    if (cantidad <= 0) return;

    partes.push(construirTextoCantidadMonitor_(cantidad, singular, plural) + " en estado " + codigo);
  });

  return partes.length ? unirPartesTexto_(partes) + "." : "";
}

function agruparErroresMonitorCliente_(detalles) {
  var grupos = {};

  (detalles || []).forEach(function(detalle) {
    var descripcion = extraerDescripcionErrorMonitorCliente_((detalle && detalle.error) || (detalle && detalle.traza) || "");
    var clave = normalizarTextoBase_(descripcion);

    if (!clave) return;

    if (!grupos[clave]) {
      grupos[clave] = { descripcion: descripcion, cantidad: 0 };
    }

    grupos[clave].cantidad += 1;
  });

  return Object.keys(grupos).map(function(clave) {
    return grupos[clave];
  }).sort(function(a, b) {
    if (a.cantidad !== b.cantidad) return b.cantidad - a.cantidad;
    return a.descripcion.localeCompare(b.descripcion);
  });
}

function renderizarGruposErroresMonitorCliente_(grupos) {
  if ((grupos || []).length === 1) {
    return escapeHtml_(construirTextoGrupoErrorMonitorCliente_(grupos[0]) + ".");
  }

  var items = (grupos || []).map(function(grupo) {
    return "<li>" + escapeHtml_(construirTextoGrupoErrorMonitorCliente_(grupo) + ".") + "</li>";
  });

  return "<ul style=\"margin: 6px 0 0 18px; padding: 0;\">" + items.join("") + "</ul>";
}

function construirTextoGruposErroresMonitorCliente_(grupos) {
  var partes = (grupos || []).map(function(grupo) {
    return construirTextoGrupoErrorMonitorCliente_(grupo);
  });

  return unirPartesTexto_(partes) + ".";
}

function construirTextoGrupoErrorMonitorCliente_(grupo) {
  var cantidad = Number(grupo && grupo.cantidad) || 0;
  var descripcion = (grupo && grupo.descripcion) || "error no clasificado";
  return construirTextoCantidadMonitor_(cantidad, "error", "errores") + " de " + descripcion;
}

function extraerDescripcionErrorMonitorCliente_(texto) {
  var bruto = (texto || "").toString().trim();
  if (!bruto) return "";

  var partes = bruto.split(".").map(function(parte) {
    return (parte || "").trim();
  }).filter(Boolean);
  var ultimaParte = partes.length ? partes[partes.length - 1] : bruto;

  return normalizarDescripcionErrorMonitorCliente_(ultimaParte);
}

function normalizarDescripcionErrorMonitorCliente_(texto) {
  var limpio = (texto || "").toString().trim().replace(/\s+/g, " ");
  var normalizado = normalizarTextoBase_(limpio);

  if (!normalizado) return "";
  if (normalizado.indexOf("no existen datos en la tabla de claves") !== -1) {
    return "no existen datos en tabla de claves";
  }

  return limpio.toLowerCase();
}

function obtenerCantidadEstadoMonitor_(seccion, estado) {
  return Number(seccion && seccion.estados ? seccion.estados[(estado || "").toUpperCase()] : 0) || 0;
}

function construirTextoCantidadMonitor_(cantidad, singular, plural) {
  var numero = Number(cantidad) || 0;
  return numero + " " + (numero === 1 ? singular : plural);
}
