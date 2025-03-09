const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { exec } = require("child_process");

let mainWindow;

console.log("Aplicación Electron iniciando.......");
app.on("ready", () => {
  console.log(
    "Ruta del preload:",
    path.join(__dirname, "public", "preload.js")
  );

  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    webPreferences: {
      preload: path.join(__dirname, "public", "preload.js"),
      contextIsolation: true,
    },
  });

  mainWindow.loadURL("http://localhost:3000");

  mainWindow.on("closed", () => (mainWindow = null));
});

// Escuchar solicitudes de suma desde el frontend
ipcMain.handle("sum-numbers", (event, num1, num2) => {
  const pythonScriptPath = path.join(__dirname, "public", "suma.py");

  return new Promise((resolve, reject) => {
    exec(
      `python "${pythonScriptPath}" ${num1} ${num2}`,
      (error, stdout, stderr) => {
        if (error || stderr) {
          reject({ error: error?.message || stderr });
        } else {
          resolve({ result: stdout.trim() });
        }
      }
    );
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
