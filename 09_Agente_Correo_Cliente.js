/**
 * ============================================================================
 * AGENTE DE REDACCION DEL CORREO CLIENTE
 * ============================================================================
 * Usa OpenAI desde Apps Script para rellenar el formato del correo cliente
 * a partir del contexto extraido de los correos operativos.
 */

var OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
var DEFAULT_OPENAI_CORREO_CLIENTE_MODEL = "gpt-5-mini";
var OPENAI_API_KEY_DIRECT = "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";
var OPENAI_EMAIL_AGENT_ENABLED_DIRECT = true;
var OPENAI_EMAIL_MODEL_DIRECT = "";

/**
 * Devuelve true si hay configuracion suficiente para usar el agente.
 *
 * @returns {boolean}
 */
function usarAgenteCorreoCliente_() {
  var apiKey = obtenerOpenAIApiKeyOpcional_();
  var enabled = obtenerOpenAIEmailAgentEnabled_();

  if (!apiKey) return false;
  if (!enabled) return false;
  return true;
}

/**
 * Genera el HTML final del correo cliente usando OpenAI y la plantilla local.
 *
 * @param {Object} resumen
 * @returns {string}
 */
function construirHtmlReporteClienteConIA_(resumen) {
  var template = cargarPlantillaHtml_("PLANTILLA_CORREO_CLIENTE");
  var placeholdersBase = obtenerPlaceholdersBaseCorreoCliente_();
  var placeholdersIA = generarPlaceholdersCorreoClienteConIA_(resumen || {});
  var placeholdersBloqueados = construirPlaceholdersBloqueadosCorreoCliente_(resumen || {});
  var placeholders = mezclarObjetos_(placeholdersBase, placeholdersIA, placeholdersBloqueados);
  return renderHtmlTemplate_(template, placeholders);
}

/**
 * Construye y envia un borrador con IA al usuario actual.
 */
function probarReporteClienteConIA() {
  if (!usarAgenteCorreoCliente_()) {
    throw new Error("La prueba con IA requiere OPENAI_API_KEY y que OPENAI_EMAIL_AGENT_ENABLED no sea NO.");
  }

  var resumen = construirResumenPruebaCompleto_();
  var destinatarioPrueba = obtenerDestinatarioPrueba_();
  var html = construirHtmlReporteClienteConIA_(resumen);

  var hoy = Utilities.formatDate(new Date(), "Europe/Madrid", "dd/MM/yyyy");
  GmailApp.sendEmail(destinatarioPrueba, "PRUEBA IA - Status Operativa Diaria - " + hoy, "", { htmlBody: html });
  Logger.log("Borrador IA enviado a: " + destinatarioPrueba);
}

/**
 * Devuelve el resumen combinado mas util para una prueba completa.
 *
 * @returns {Object}
 */
function construirResumenPruebaCompleto_() {
  return {
    economica: (function () {
      var idEconomica = obtenerUltimoIdCorreoEconomicaDelDia_();
      return idEconomica ? Modulo_Economica(idEconomica) : [];
    })(),
    monitorSistemas: obtenerResumenMonitorDiarioSistemasHoy_()
  };
}

function generarPlaceholdersCorreoClienteConIA_(resumen) {
  var contexto = construirContextoAgenteCorreoCliente_(resumen || {});
  var instrucciones = construirInstruccionesAgenteCorreoCliente_();
  var schema = crearSchemaPlaceholdersCorreoCliente_();
  var payload = {
    model: obtenerModeloOpenAICorreoCliente_(),
    text: {
      format: {
        type: "json_schema",
        name: "cliente_email_placeholders",
        strict: true,
        schema: schema
      }
    },
    input: [
      {
        role: "system",
        content: [
          { type: "input_text", text: instrucciones }
        ]
      },
      {
        role: "user",
        content: [
          { type: "input_text", text: JSON.stringify(contexto, null, 2) }
        ]
      }
    ]
  };

  var response = llamarOpenAIResponses_(payload);
  var texto = extraerTextoDeResponseOpenAI_(response);
  var data = JSON.parse(texto);

  return sanearPlaceholdersCorreoClienteIA_(data);
}

function construirContextoAgenteCorreoCliente_(resumen) {
  var monitor = resumen.monitorSistemas || obtenerResumenMonitorDiarioSistemasHoy_();
  var economica = resumen.economica || [];
  var resumenMonitorCliente = monitor ? construirResumenClienteMonitorSistemas_(monitor) : null;
  var reglasAgente = obtenerReglasAgenteCorreoCliente_();

  return {
    fecha_reporte: Utilities.formatDate(new Date(), "Europe/Madrid", "dd/MM/yyyy"),
    objetivo: "Redactar un correo cliente diario en HTML usando exclusivamente la informacion facilitada.",
    placeholders_objetivo: Object.keys(obtenerPlaceholdersBaseCorreoCliente_()),
    monitor_sistemas: monitor,
    monitor_sistemas_cliente: resumenMonitorCliente,
    economica_cliente: construirContextoEconomicaClienteParaIA_(economica),
    economica_tecnica: economica.map(function (fila) {
      return {
        fecha: fila[0] instanceof Date ? Utilities.formatDate(fila[0], "Europe/Madrid", "dd/MM/yyyy HH:mm:ss") : fila[0],
        ct: fila[1],
        lote: fila[2],
        numeraciones: fila[3],
        textoError: fila[4],
        cantidad: fila[5],
        errorOriginal: fila[6]
      };
    }),
    guia_parametrica_economica: obtenerGuiaParametricaEconomicaParaIA_(),
    directrices_correo_cliente: obtenerDirectricesCorreoCliente_(),
    reglas_agente_documentadas: reglasAgente,
    reglas_fijas: [
      "No inventes datos que no existan en el contexto.",
      "Usa HTML fragmentario, no documento completo.",
      "Manten un tono profesional, claro y apto para cliente.",
      "Si falta fuente para una seccion, deja una marca de revision manual.",
      "No incluyas firma ni cierre corporativo adicional al que ya existe en la plantilla.",
      "Para errores de Economica no parametrizados, deja visible una revision manual."
    ]
  };
}

function construirInstruccionesAgenteCorreoCliente_() {
  var instrucciones = [
    "Eres un asistente de redaccion de correo cliente para un status operativo diario.",
    "Debes rellenar UNICAMENTE placeholders HTML que despues seran inyectados en una plantilla fija.",
    "No devuelvas Markdown, ni bloques de codigo, ni HTML completo; devuelve solo JSON valido acorde al schema.",
    "Cada valor debe ser un fragmento HTML breve y limpio.",
    "Para CAS, CICOS y SDM redacta en espanol claro y orientado a cliente.",
    "Si una seccion monitorizada tiene valor 0 y no hay detalle de error, puedes usar 'Limpio'.",
    "Si una seccion no tiene fuente suficiente, marca revision manual con HTML visible.",
    "En Economica, usa la guia parametrica como referencia, pero el texto final debe sonar natural para cliente.",
    "En Economica, los errores ya agrupados vienen resumidos; no vuelvas a mencionar CT ni numeraciones salvo que sea imprescindible.",
    "Si hay errores no parametrizados, mantenlos visibles con una marca de revision manual.",
    "No afirmes que algo esta limpio si no existe dato que lo soporte."
  ];
  var reglasPersistentes = obtenerReglasAgenteCorreoCliente_();

  if (reglasPersistentes.length > 0) {
    instrucciones.push("Directrices persistentes del proyecto:");
    reglasPersistentes.forEach(function(regla, indice) {
      instrucciones.push((indice + 1) + ". " + regla);
    });
  }

  return instrucciones.join("\n");
}

function crearSchemaPlaceholdersCorreoCliente_() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      trames_cas_recepcion_html: { type: "string" },
      trames_cas_envio_html: { type: "string" },
      trames_cicos_recepcion_html: { type: "string" },
      trames_cicos_envio_html: { type: "string" },
      trames_sdm_recepcion_html: { type: "string" },
      trames_sdm_envio_html: { type: "string" },
      trames_sdplex_resumen_html: { type: "string" },
      backend_operaciones_economicas_items_html: { type: "string" },
      cadenas_ko_html: { type: "string" }
    },
    required: [
      "trames_cas_recepcion_html",
      "trames_cas_envio_html",
      "trames_cicos_recepcion_html",
      "trames_cicos_envio_html",
      "trames_sdm_recepcion_html",
      "trames_sdm_envio_html",
      "trames_sdplex_resumen_html",
      "backend_operaciones_economicas_items_html",
      "cadenas_ko_html"
    ]
  };
}

function construirContextoEconomicaClienteParaIA_(filas) {
  var reglas = obtenerReglasParametricasEconomica_();
  var grupos = {};
  var noParametrizados = [];

  (filas || []).forEach(function (fila) {
    var cantidad = Number(fila[5]) || 1;
    var errorOriginal = (fila[6] || "").toString().trim();
    var regla = resolverErrorParametricoEconomica_(errorOriginal, reglas);

    if (!regla) {
      noParametrizados.push({
        errorOriginal: errorOriginal,
        cantidad: cantidad
      });
      return;
    }

    if (!grupos[regla.claveError]) {
      grupos[regla.claveError] = {
        claveError: regla.claveError,
        errorCanonico: regla.errorCanonico,
        estadoOperativo: regla.estadoOperativo,
        fraseSingular: regla.fraseClienteSingular,
        frasePlural: regla.fraseClientePlural,
        ordenCliente: regla.ordenCliente,
        cantidad: 0,
        variantesDetectadas: []
      };
    }

    grupos[regla.claveError].cantidad += cantidad;
    if (grupos[regla.claveError].variantesDetectadas.indexOf(errorOriginal) === -1) {
      grupos[regla.claveError].variantesDetectadas.push(errorOriginal);
    }
  });

  var agrupados = Object.keys(grupos).map(function (key) { return grupos[key]; });
  agrupados.sort(function (a, b) {
    if (a.ordenCliente !== b.ordenCliente) return a.ordenCliente - b.ordenCliente;
    return a.claveError.localeCompare(b.claveError);
  });

  return {
    incidenciasAgrupadas: agrupados,
    noParametrizados: noParametrizados
  };
}

function obtenerGuiaParametricaEconomicaParaIA_() {
  var reglas = obtenerReglasParametricasEconomica_();
  var vista = {};

  reglas.forEach(function (regla) {
    if (!regla.activoCliente) return;

    if (!vista[regla.claveError]) {
      vista[regla.claveError] = {
        claveError: regla.claveError,
        errorCanonico: regla.errorCanonico,
        fraseSingular: regla.fraseClienteSingular,
        frasePlural: regla.fraseClientePlural,
        estadoOperativo: regla.estadoOperativo,
        patrones: []
      };
    }

    vista[regla.claveError].patrones.push({
      tipoMatch: regla.tipoMatch,
      patronEntrada: regla.patronEntrada
    });
  });

  return Object.keys(vista).sort().map(function (key) { return vista[key]; });
}

function sanearPlaceholdersCorreoClienteIA_(data) {
  var base = obtenerPlaceholdersBaseCorreoCliente_();
  var out = {};

  Object.keys(base).forEach(function (key) {
    out[key] = (data && data[key] !== undefined && data[key] !== null) ? String(data[key]) : base[key];
  });

  return out;
}

function llamarOpenAIResponses_(payload) {
  var apiKey = obtenerOpenAIApiKey_();
  var options = {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    headers: {
      Authorization: "Bearer " + apiKey
    },
    payload: JSON.stringify(payload)
  };
  var response = UrlFetchApp.fetch(OPENAI_RESPONSES_URL, options);
  var status = response.getResponseCode();
  var body = response.getContentText();

  if (status < 200 || status >= 300) {
    throw new Error("Error OpenAI " + status + ": " + body);
  }

  return JSON.parse(body);
}

function extraerTextoDeResponseOpenAI_(response) {
  if (response && typeof response.output_text === "string" && response.output_text) {
    return response.output_text;
  }

  var output = (response && response.output) || [];

  for (var i = 0; i < output.length; i++) {
    var item = output[i];
    var content = item && item.content ? item.content : [];

    for (var j = 0; j < content.length; j++) {
      if (content[j].type === "output_text" && content[j].text) {
        if (typeof content[j].text === "string") return content[j].text;
        if (content[j].text.value) return content[j].text.value;
      }
    }
  }

  throw new Error("No se pudo extraer texto de la respuesta OpenAI.");
}

function obtenerOpenAIApiKey_() {
  var apiKey = obtenerOpenAIApiKeyOpcional_();
  if (!apiKey) {
    throw new Error("Falta OPENAI_API_KEY. Puedes ponerla en OPENAI_API_KEY_DIRECT o en Script Properties.");
  }
  return apiKey;
}

function obtenerModeloOpenAICorreoCliente_() {
  return OPENAI_EMAIL_MODEL_DIRECT || PropertiesService.getScriptProperties().getProperty("OPENAI_EMAIL_MODEL") || DEFAULT_OPENAI_CORREO_CLIENTE_MODEL;
}

function obtenerOpenAIApiKeyOpcional_() {
  return OPENAI_API_KEY_DIRECT || PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY") || "";
}

function obtenerOpenAIEmailAgentEnabled_() {
  if (typeof OPENAI_EMAIL_AGENT_ENABLED_DIRECT === "boolean") {
    return OPENAI_EMAIL_AGENT_ENABLED_DIRECT;
  }

  return (PropertiesService.getScriptProperties().getProperty("OPENAI_EMAIL_AGENT_ENABLED") || "").toString().trim().toUpperCase() !== "NO";
}
