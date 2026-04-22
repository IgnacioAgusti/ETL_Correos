/**
 * ============================================================================
 * MODULO ECONOMICA: Extraccion y Agrupacion de errores TRON
 * ============================================================================
 * Recibe el ID de un correo de Gmail, extrae las lineas con errores
 * (ERRONEA, COD_CT, RETORNO) y las agrupa por CT + Lote + Error.
 *
 * Devuelve un array de filas con 7 columnas:
 *   [fecha, ct, lote, numeraciones, textoError, cantidad, errorPuro]
 *
 * Las 5 primeras se usan para guardar en Excel.
 * Las columnas 6 y 7 se usan internamente para generar los reportes por correo.
 */

function Modulo_Economica(idCorreo) {
  try {
    var mensaje = GmailApp.getMessageById(idCorreo);
    var msDate = mensaje.getDate();
    var lineas = mensaje.getPlainBody().split("\n");
    var extraccionesRaw = [];

    lineas.forEach(function(l) {
      l = l.trim();
      if (!l || (!l.includes("ERRONEA") && !l.includes("COD_CT") && !l.includes("RETORNO"))) return;

      var ct = "---", lote = "---", num = "---", err = "Incidencia no identificada";
      var m1 = l.match(/LOTE:\s*T?(\d+)\s+(\d+)\s+(\d+)/i);
      
      if (m1) { 
        ct = "T" + m1[1]; 
        lote = m1[2]; 
        num = m1[3]; 
      } else if (l.includes("COD_CT:")) {
        var mCT = l.match(/COD_CT:\s*T?(\d+)/i);
        if (mCT) ct = "T" + mCT[1];
        if (l.includes("NUMERACION:")) {
          var mN = l.match(/NUMERACION:\s*(\d+)/i);
          if (mN) num = mN[1];
        } else if (l.includes("NUM_LOTE:")) {
          var mL = l.match(/NUM_LOTE:\s*(\d+)/i);
          if (mL) lote = mL[1];
        }
      } else if (l.match(/SIMPLE:\s*T\s+(\d+)/i)) {
        var mS = l.match(/SIMPLE:\s*T\s+(\d+)/i);
        num = mS[1];
      }

      if (l.includes("RETORNO:")) {
        err = l.split(/RETORNO:\s*/i)[1].trim();
      } else if (l.includes("OPERACION NO EXISTE")) {
        var tr = l.match(/TR\d+/i);
        err = "OPERACION NO EXISTE" + (tr ? " EN " + tr[0] : "");
      }
      
      extraccionesRaw.push({ct: ct, lote: lote, num: num, err: err});
    });

    // Agrupacion por CT + Lote + Error
    var ag = {};
    extraccionesRaw.forEach(function(it) {
      var k = it.ct + "|" + it.lote + "|" + it.err;
      if (!ag[k]) ag[k] = { ct: it.ct, lote: it.lote, nums: [], err: it.err, cant: 0 };
      ag[k].cant++;
      if (it.num !== "---" && ag[k].nums.indexOf(it.num) === -1) ag[k].nums.push(it.num);
    });

    // Formateo de salida
    var resFinal = [];
    for (var k in ag) {
      var o = ag[k];
      var txtN = o.nums.length > 0 ? o.nums.join(", ") : "---";
      var palabraErr = (o.cant === 1) ? "error" : "errores";
      var txtE = o.cant + " " + palabraErr + (o.lote !== "---" ? " para lote " + o.lote : "") + " por " + o.err;
      
      // 7 columnas: las 5 primeras van a Excel, las 2 ultimas son para los reportes
      resFinal.push([msDate, o.ct, o.lote, txtN, txtE, o.cant, o.err]); 
    }
    return resFinal;
  } catch (e) { 
    Logger.log("Error en Módulo Económica: " + e);
    return []; 
  }
}
