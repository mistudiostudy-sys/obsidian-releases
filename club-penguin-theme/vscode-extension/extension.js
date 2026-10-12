const vscode = require('vscode');

const THEME_LABEL = 'Club Penguin Isla';

const OPTIONS = {
  color: ['azul', 'rojo', 'verde', 'rosa', 'negro', 'morado', 'naranja', 'amarillo', 'verde-oscuro', 'azul-claro', 'cafe', 'durazno', 'aqua', 'lima'],
  hat: ['ninguno', 'gorra-helice', 'fiesta', 'corona', 'vikingo', 'gorro-lana', 'bruja', 'copa'],
  accessory: ['ninguno', 'bufanda', 'corbatin', 'lentes', 'audifonos'],
  puffleColor: ['azul', 'rosa', 'negro', 'verde', 'morado', 'rojo', 'amarillo', 'blanco', 'naranja', 'cafe', 'dorado']
};

function readConfig() {
  const c = vscode.workspace.getConfiguration('clubPenguin');
  return {
    name: c.get('name'),
    color: c.get('color'),
    hat: c.get('hat'),
    accessory: c.get('accessory'),
    puffleColor: c.get('puffleColor'),
    showPuffle: c.get('showPuffle'),
    speed: c.get('speed'),
    messages: c.get('messages')
  };
}

async function saveConfig(values) {
  const c = vscode.workspace.getConfiguration('clubPenguin');
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== c.get(key)) {
      await c.update(key, value, vscode.ConfigurationTarget.Global);
    }
  }
}

async function applyTheme() {
  await vscode.workspace
    .getConfiguration('workbench')
    .update('colorTheme', THEME_LABEL, vscode.ConfigurationTarget.Global);
}

class PenguinViewProvider {
  constructor(context) {
    this.context = context;
    this.view = undefined;
  }

  resolveWebviewView(webviewView) {
    this.view = webviewView;
    const mediaUri = vscode.Uri.joinPath(this.context.extensionUri, 'media');
    webviewView.webview.options = { enableScripts: true, localResourceRoots: [mediaUri] };
    webviewView.webview.html = this.getHtml(webviewView.webview, mediaUri);

    webviewView.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === 'ready') {
        this.sendConfig();
      } else if (msg.type === 'save') {
        await saveConfig(msg.config);
        vscode.window.setStatusBarMessage(`🐧 ¡${msg.config.name || 'Tu pingüino'} se ve genial!`, 3000);
      }
    });
  }

  sendConfig() {
    if (this.view) {
      this.view.webview.postMessage({ type: 'config', config: readConfig() });
    }
  }

  openCustomizer() {
    if (this.view) {
      this.view.show?.(true);
      this.view.webview.postMessage({ type: 'openCustomizer' });
    }
  }

  getHtml(webview, mediaUri) {
    const nonce = Array.from({ length: 32 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
    const script = webview.asWebviewUri(vscode.Uri.joinPath(mediaUri, 'pet.js'));
    const style = webview.asWebviewUri(vscode.Uri.joinPath(mediaUri, 'pet.css'));
    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="${style}">
<title>Club Penguin</title>
</head>
<body>
  <div id="scene">
    <div id="snow"></div>
    <div id="ground"></div>
    <div id="puffle" class="actor" title="¡Tu puffle!"></div>
    <div id="penguin" class="actor" title="¡Hazme click!"></div>
    <div id="bubble" class="bubble hidden"></div>
    <button id="customizeBtn" title="Personalizar">🎨</button>
  </div>
  <div id="customizer" class="hidden"></div>
  <script nonce="${nonce}" src="${script}"></script>
</body>
</html>`;
  }
}

async function customizeWithQuickPick(provider) {
  const choice = await vscode.window.showQuickPick(
    [
      { label: '🎨 Abrir panel visual de personalización', key: 'panel' },
      { label: '🐧 Color del pingüino', key: 'color' },
      { label: '🎩 Sombrero', key: 'hat' },
      { label: '🧣 Accesorio', key: 'accessory' },
      { label: '🟣 Color del puffle', key: 'puffleColor' },
      { label: '✏️ Nombre', key: 'name' },
      { label: '💬 Agregar frase', key: 'message' }
    ],
    { placeHolder: '¿Qué quieres cambiar de tu pingüino?' }
  );
  if (!choice) return;

  const config = vscode.workspace.getConfiguration('clubPenguin');
  if (choice.key === 'panel') {
    await vscode.commands.executeCommand('clubPenguin.pet.focus');
    provider.openCustomizer();
  } else if (choice.key === 'name') {
    const name = await vscode.window.showInputBox({ prompt: 'Nombre de tu pingüino', value: config.get('name') });
    if (name) await saveConfig({ name });
  } else if (choice.key === 'message') {
    const text = await vscode.window.showInputBox({ prompt: 'Nueva frase para tu pingüino' });
    if (text) await saveConfig({ messages: [...config.get('messages'), text] });
  } else {
    const value = await vscode.window.showQuickPick(OPTIONS[choice.key], { placeHolder: choice.label });
    if (value) await saveConfig({ [choice.key]: value });
  }
}

function activate(context) {
  const provider = new PenguinViewProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('clubPenguin.pet', provider, {
      webviewOptions: { retainContextWhenHidden: true }
    }),
    vscode.commands.registerCommand('clubPenguin.show', () => vscode.commands.executeCommand('clubPenguin.pet.focus')),
    vscode.commands.registerCommand('clubPenguin.customize', () => customizeWithQuickPick(provider)),
    vscode.commands.registerCommand('clubPenguin.applyTheme', applyTheme),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('clubPenguin')) provider.sendConfig();
    })
  );

  // On first run, switch to the theme and show the penguin.
  if (!context.globalState.get('clubPenguin.welcomed')) {
    context.globalState.update('clubPenguin.welcomed', true);
    applyTheme().then(() => {
      vscode.commands.executeCommand('clubPenguin.pet.focus');
      vscode.window.showInformationMessage(
        '🐧 ¡Te damos la bienvenida a la Isla!Tu pingüino está en el Explorador. Hazle click para que hable o usa 🎨 para personalizarlo.'
      );
    });
  }
}

function deactivate() {}

module.exports = { activate, deactivate };
