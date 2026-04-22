/**
 * ============================================================================
 * DIRECTRICES DEL CORREO CLIENTE
 * ============================================================================
 * Banderas de comportamiento del correo cliente.
 *
 * Las reglas textuales que se envian al agente viven en el documento
 * separado DIRECTRICES_AGENTE_CORREO_CLIENTE.html para poder editarlas
 * sin tocar codigo.
 */

var DIRECTRICES_CORREO_CLIENTE = {
  habilitarCorreoTareasTron: false,
  incluirPendientesCasEnCadenasKo: false
};

function obtenerDirectricesCorreoCliente_() {
  return DIRECTRICES_CORREO_CLIENTE;
}

function debeEnviarCorreoTareasTron_() {
  return !!obtenerDirectricesCorreoCliente_().habilitarCorreoTareasTron;
}

function debeIncluirPendientesCasEnCadenasKo_() {
  return !!obtenerDirectricesCorreoCliente_().incluirPendientesCasEnCadenasKo;
}

function obtenerTextoDirectricesAgenteCorreoCliente_() {
  try {
    return cargarPlantillaHtml_("DIRECTRICES_AGENTE_CORREO_CLIENTE");
  } catch (e) {
    Logger.log("No se pudo cargar DIRECTRICES_AGENTE_CORREO_CLIENTE.html: " + e);
    return "";
  }
}

function obtenerReglasAgenteCorreoCliente_() {
  return obtenerTextoDirectricesAgenteCorreoCliente_()
    .split(/\r?\n/)
    .map(function(linea) { return (linea || "").trim(); })
    .filter(function(linea) {
      return !!linea && linea.indexOf("#") !== 0;
    });
}
