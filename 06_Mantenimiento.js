/**
 * ============================================================================
 * MANTENIMIENTO: Limpieza del Log de Errores
 * ============================================================================
 * Funcion independiente para limpiar todos los datos del log,
 * conservando solo la fila de encabezados.
 */

function limpiarLogErrores() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName("Log errores");
  if (!hoja) {
    Logger.log("No existe la hoja 'Log errores'");
    return;
  }

  var ultimaFila = hoja.getLastRow();
  if (ultimaFila > 1) {
    // Limpiar solo A:F (columnas 1 a 6), desde la fila 2 hasta la ultima
    hoja.getRange(2, 1, ultimaFila - 1, 6).clearContent();
    Logger.log("Se limpiaron columnas A:F desde la fila 2 hasta la " + ultimaFila);
  } else {
    Logger.log("Nada que borrar, solo encabezados.");
  }
}
