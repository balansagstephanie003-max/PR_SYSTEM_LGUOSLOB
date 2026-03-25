const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

const START_URL = process.env.APP_START_URL || "http://localhost:4000";

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    backgroundColor: "#202020",
    autoHideMenuBar: true,
    title: "LGU Oslob PR System",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.loadURL(START_URL);

  win.webContents.setWindowOpenHandler(({ url }) => {
    const allowedPrefix = START_URL.replace(/\/$/, "");
    if (url.startsWith(allowedPrefix)) {
      return { action: "allow" };
    }
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
