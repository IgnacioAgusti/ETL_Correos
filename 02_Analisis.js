/**
 * ============================================================================
 * ORQUESTADOR DE ANALISIS DIARIO
 * ============================================================================
 * Revisa el log de hoy, busca patrones que tengan activado el analisis
 * en la "Tabla de traduccion" (columna D = "SI"), y lanza el modulo
 * correspondiente. Despues guarda resultados y envia reportes.
 *
 * Dependencias:
 *   - Modulo_Economica()          -> 03_Modulo_Economica.js
 *   - guardarEnTablaEspecifica()  -> 05_Utilidades.js
 *   - enviarReporteCliente()      -> 04_Reportes.js
 *   - enviarReporteTrabajadores() -> 04_Reportes.js
 */

function ejecutarAnalisisDiario() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaLog = ss.getSheetByName("Log errores");
  var hojaTrad = ss.getSheetByName("Tabla de traduccion");
  var TIMEZONE = "Europe/Madrid";
  
  if (!hojaTrad || !hojaLog) {
    Logger.log("Faltan las pestanas 'Log errores' o 'Tabla de traduccion'.");
    return;
  }
  
  var reglas = hojaTrad.getRange(2, 1, Math.max(hojaTrad.getLastRow()-1, 1), 4).getValues();
  var lrLog = hojaLog.getLastRow();
  if (lrLog < 2) {
    Logger.log("El log esta vacio.");
    return;
  }
  
  var datosLog = hojaLog.getRange(2, 1, lrLog - 1, 6).getValues();
  
  // Filtramos el log para trabajar SOLO con los registros de la fecha de HOY
  var hoyStr = Utilities.formatDate(new Date(), TIMEZONE, "dd/MM/yyyy");
  var logDeHoy = datosLog.filter(function(f) {
    return Utilities.formatDate(new Date(f[0]), TIMEZONE, "dd/MM/yyyy") === hoyStr;
  }).reverse(); // Invertimos para encontrar siempre el mas reciente primero

  if (logDeHoy.length === 0) {
    Logger.log("No hay incidencias registradas de hoy en el log.");
    return;
  }

  var resumenGlobal = { economica: [] };

  reglas.forEach(function(regla) {
    var patron = regla[0].toString().toLowerCase();
    var activarAnalisis = (regla[3] && regla[3].toString().toUpperCase().trim() === "SI");

    if (activarAnalisis) {
      // Buscar el correo mas reciente en el log de hoy que cumpla el patron
      var reg = logDeHoy.find(function(f) { 
        return f[3].toLowerCase().indexOf(patron) !== -1; 
      });

      if (reg) {
        var idCorreo = reg[4];
        if (patron.indexOf("operaciones economicas a tron") !== -1) {
          Logger.log("Procesando Modulo Economica...");
          resumenGlobal.economica = Modulo_Economica(idCorreo);
        }
      }
    }
  });

  // Si hay datos procesados en Economica, guardamos en Excel y enviamos correos
  if (resumenGlobal.economica.length > 0) {
    guardarEnTablaEspecifica("Reporte Economica", ["Fecha", "CT", "Lote", "Numeracion", "Error"], resumenGlobal.economica);
    enviarReporteCliente(resumenGlobal);
    var correoTecnicoEnviado = enviarReporteTrabajadores(resumenGlobal.economica);
    Logger.log("Reporte cliente enviado. Correo tecnico TRON " + (correoTecnicoEnviado ? "enviado." : "omitido por directriz."));
  } else {
    Logger.log("No se ha encontrado ninguna incidencia de Economica que requiera reporte hoy.");
  }
}
