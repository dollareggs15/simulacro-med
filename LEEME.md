# Simulacro Med — cómo subirla a internet (gratis)

Al final tendrás un link tipo `simulacro-med.vercel.app` que tus compañeros abren en el celular y pueden instalar como app.

## 1. Saca tu clave de Gemini (gratis)
1. Entra a https://aistudio.google.com con tu cuenta de Google.
2. Busca **Get API key** → **Create API key**.
3. Cópiala y guárdala. No la compartas con nadie ni la pegues en el código.

> En el plan gratuito, Google puede usar lo que se envía para mejorar sus productos, y tiene límites de uso por minuto y por día. Para empezar alcanza; si la app crece, se pasa al plan de pago.

## 2. Sube el proyecto a GitHub
1. Crea una cuenta en https://github.com si no tienes.
2. Botón **New repository** → nombre `simulacro-med` → **Create**.
3. En la página del repo: **uploading an existing file** → arrastra TODO lo de esta carpeta (incluida la carpeta `api`) → **Commit changes**.

## 3. Publícala en Vercel
1. Entra a https://vercel.com y regístrate con tu cuenta de GitHub.
2. **Add New → Project** → elige `simulacro-med` → **Import**.
3. Antes de darle Deploy, abre **Environment Variables** y agrega:
   - `GEMINI_API_KEY` = tu clave del paso 1
   - (opcional) `ACCESS_CODES` = códigos que vas a vender, separados por comas. Ejemplo: `UNIVALLE-01,UNIVALLE-02`
4. **Deploy**. En un minuto te da tu link.

## 4. Pruébala
- Abre el link en tu celular, pega un tema y genera un simulacro.
- Android (Chrome): aparece el botón **Instalar app** o en el menú ⋮ → **Agregar a pantalla de inicio**.
- iPhone (Safari): botón Compartir → **Agregar a inicio**.

## Cómo cobrar
- Si dejas `ACCESS_CODES` vacío, la app es libre para todos (útil para que la prueben primero).
- Cuando quieras cobrar, pon códigos en `ACCESS_CODES`, vende cada código por QR y entrégalo por WhatsApp.
- Para cambiar los códigos: Vercel → tu proyecto → Settings → Environment Variables → edita → luego **Deployments → Redeploy**.

## Cambiar el modelo
Si Google cambia los nombres de modelos, agrega `GEMINI_MODEL` con el nombre nuevo (lo ves en AI Studio) y vuelve a desplegar.

## Archivos
- `index.html` — la app que ve el usuario
- `api/generar.js` — el servidor que habla con Gemini (aquí vive la clave, nunca en el celular)
- `manifest.webmanifest`, `sw.js`, íconos — lo que la hace instalable como app
