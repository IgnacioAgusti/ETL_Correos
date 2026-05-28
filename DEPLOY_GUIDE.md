# 🚀 Guía de Despliegue a Google Apps Script

## Requisitos Previos

✅ Node.js instalado  
✅ npm disponible en PATH  
✅ Acceso a tu cuenta Google  
✅ Acceso al script de Google Apps Script (scriptId en `.clasp.json`)

## Paso 1: Autenticarse con Google (Primera vez)

```bash
clasp login
```

Esto abrirá una ventana del navegador donde:
1. Selecciona tu cuenta Google
2. Permite los permisos solicitados
3. Se guardará el token automáticamente

**Nota**: La autenticación se almacena en `~/.clasprc.json` (usuario). No necesitas hacer esto de nuevo en la misma máquina.

## Paso 2: Verificar la Configuración

Asegúrate de estar en el directorio del proyecto y que `.clasp.json` sea válido:

```bash
cd c:/Users/EM2026009073/Documents/GitHub/ETL_Correos
cat .clasp.json
```

Debería mostrar algo como:

```json
{
  "scriptId": "1R7JnCMNF21Uu8BiQ425s9dZ-O478PXLfWb_jQWa3MhBfuypGWRYTRI2n",
  "rootDir": "",
  "scriptExtensions": [".js", ".gs"],
  "htmlExtensions": [".html"],
  "jsonExtensions": [".json"]
}
```

## Paso 3: Subir Cambios a Google Apps Script

### Opción A: Push simple (sobrescribe)

```bash
clasp push
```

### Opción B: Push con confirmación (recomendado)

```bash
clasp push --watch
```

Esto observará cambios locales y subirá automáticamente.

### Opción C: Push forzado (cuidado)

```bash
clasp push -f
```

Solo usa esto si sabes que quieres sobrescribir todo.

## Paso 4: Abrir el Editor en el Navegador

```bash
clasp open
```

Se abrirá automáticamente el editor de Google Apps Script en tu navegador.

## Paso 5: Acceder a los Documentos

### README.md (Documentación Principal)
**Ubicación**: GitHub → Rama `main` → `README.md`

Visualizar directamente en GitHub:
```
https://github.com/[tu-usuario]/ETL_Correos/blob/main/README.md
```

### README.html (Versión Bonita)
**Ubicación**: Local → `README.html` (después de `clasp push`)

Opciones para verlo:
1. **En VS Code**: Click derecho → "Open with Live Server"
2. **En el navegador**: Arrastra `README.html` a una pestaña
3. **En Google Drive**: Sube manualmente y abre con Google Docs

### Hojas de Cálculo
**Ubicación**: Google Drive → Busca "ETL_Correos" o el scriptId:

```
Script ID: 1R7JnCMNF21Uu8BiQ425s9dZ-O478PXLfWb_jQWa3MhBfuypGWRYTRI2n
```

Abre el script en Apps Script → Proyecto → Ver hojas asociadas

## Troubleshooting

### Error: "No credentials found"

**Solución**: Ejecuta `clasp login` nuevamente y completa el flujo de autenticación.

### Error: "Unauthorized"

**Solución**: 
1. Comprueba que el scriptId en `.clasp.json` es correcto
2. Verifica que tienes acceso al proyecto en Google
3. Intenta `clasp pull` para sincronizar

### Error: "The Apps Script project 'xxx' could not be found"

**Solución**: 
1. El scriptId no existe o fue eliminado
2. Crea un nuevo script en Google (apps.script.google.com)
3. Copia el nuevo scriptId a `.clasp.json`

### Los cambios no se reflejan en Apps Script

**Solución**:
1. Asegúrate de hacer `clasp push`
2. Recarga la pestaña del navegador (Ctrl+Shift+R)
3. Verifica que no haya errores de sintaxis en los logs

## Comandos Útiles

```bash
# Ver historial de ejecuciones
clasp logs

# Descargar cambios desde Apps Script (overwrite local)
clasp pull

# Ver archivos remotos
clasp files

# Ver estado del script
clasp status

# Listar todos tus scripts
clasp list
```

## Flujo de Trabajo Recomendado

1. **Desarrollo Local**:
   ```bash
   clasp pull              # Traer cambios remotos
   # Edita archivos locales
   clasp push --watch      # Observar y subir automáticamente
   ```

2. **Testing**:
   ```bash
   clasp open              # Abre el editor
   # Prueba manualmente desde el editor
   ```

3. **Commit a GitHub**:
   ```bash
   git add .
   git commit -m "descripción del cambio"
   git push origin main
   ```

## Después del Despliegue

✅ El README.md estará disponible en GitHub  
✅ El código estará sincronizado en Google Apps Script  
✅ Los cambios serán visibles en la próxima ejecución del script  

Para ver los logs de la última ejecución:
```bash
clasp logs
```

---

**Última actualización**: 28 de mayo de 2026  
**Versión**: 1.0
