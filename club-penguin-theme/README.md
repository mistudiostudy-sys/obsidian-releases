# 🐧 Club Penguin Isla: tema para tu PC

Proyecto de fans inspirado en Club Penguin. Incluye:

1. **Extensión para Visual Studio Code**
   - Tema de colores **"Club Penguin Isla"**: azul océano, nieve, monedas doradas y colores de puffles.
   - Un **pingüino y un puffle en pixel art** al estilo Club Penguin que **caminan** (animación cuadro por cuadro: pasos, parpadeo, saludo) por el panel *🐧 Club Penguin* del Explorador mientras programas, con nieve cayendo.
   - **Click al pingüino** → saluda con la aleta y te dice una frase (¡puedes poner las tuyas!). **Click al puffle** → da un salto.
   - **Personalización** (botón 🎨): 14 colores de pingüino, sombreros (gorra con hélice, fiesta, corona, bruja, calabaza, copa, gorro de lana), ropa (bufanda, corbatín, lentes, audífonos, delantal de café, **disfraz de fantasma** con cubeta de calabaza), color del puffle, **gorro de calabaza para el puffle** y escenario (nieve de día o noche de Halloween).
2. **Tema de Google Chrome versión Halloween 🎃** en pixel art: casa embrujada, calabazas, tumbas, luna llena y murciélagos en la página de nueva pestaña.

![Pingüino hablando](docs/pinguino-hablando.png) ![Personalizar](docs/personalizar.png)

![Disfraces y animaciones](docs/disfraces.png)

![Fondo de Chrome Halloween](chrome-theme-halloween/images/ntp_background.png)

## Instalación

Descarga esta carpeta (`club-penguin-theme`) en tu PC y luego:

| Sistema | Cómo instalar |
|---|---|
| **Windows** | Doble clic en **`instalar.bat`** |
| macOS / Linux | `bash install.sh` |

El instalador:
- Instala la extensión en VS Code (`club-penguin-isla-1.1.0.vsix`). Al reiniciar VS Code, el tema se activa solo y tu pingüino aparece en el Explorador.
- Copia el tema de Chrome a una carpeta fija y abre `chrome://extensions`. Chrome no deja instalar temas automáticamente, así que hay que hacer este paso **una sola vez**:
  1. Activa **Modo de desarrollador** (arriba a la derecha).
  2. Clic en **Cargar extensión sin empaquetar**.
  3. Elige la carpeta (en Windows la ruta queda copiada en el portapapeles, solo pega con Ctrl+V).

> Para quitar el tema de Chrome: Configuración → Apariencia → Tema → *Restablecer a predeterminado*.

## Personalizar el pingüino

- Botón **🎨** en el panel del pingüino, o el ícono de bote de pintura en la barra del panel.
- Paleta de comandos (`Ctrl+Shift+P`) → **Club Penguin: Personalizar pingüino**.
- O directamente en `settings.json`:

```jsonc
"clubPenguin.name": "Pingüi",
"clubPenguin.color": "rosa",            // o un hex: "#ff00aa"
"clubPenguin.hat": "bruja",
"clubPenguin.accessory": "fantasma",
"clubPenguin.puffleColor": "blanco",
"clubPenguin.puffleHat": "calabaza",
"clubPenguin.scene": "halloween",       // o "nieve"
"clubPenguin.size": 3,                  // tamaño del pixel art (2-5)
"clubPenguin.speed": 1.5,
"clubPenguin.messages": ["¡Tú puedes!", "¿Ya hiciste commit?"]
```

> Tip: puedes arrastrar el panel *🐧 Club Penguin* al panel inferior (junto a la terminal) para que tenga más espacio para caminar.

## Para desarrolladores

```bash
node scripts/generate_images.js                         # regenera fondos e ícono en pixel art
cd vscode-extension && npx @vscode/vsce package --out ../club-penguin-isla-1.1.0.vsix
```

---
Proyecto hecho por fans, sin afiliación con Disney ni Club Penguin. Todo el arte es pixel art original dibujado desde cero.
