const { app, BrowserWindow, ipcMain, dialog, webContents } = require('electron')
const path = require('path');

const createWindow = () => {
    const win = new BrowserWindow({

        width: 1920,
        height: 1080,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    win.loadFile('src/index.html');

    ipcMain.on('load-book', function (event) {
        dialog.showOpenDialog({
            filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
            properties: ['openFile']
        }).then(result => {
            if (!result.canceled && result.filePaths.length > 0) {
                const filePath = result.filePaths[0];
                win.webContents.send('load-pdf', filePath);
            }
        }).catch(err => {
            console.log(err);
        });
    });
};

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
