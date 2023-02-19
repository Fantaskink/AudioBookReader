const { app, BrowserWindow, ipcMain, dialog} = require('electron')
const fs = require('fs');
const path = require('path')

const createWindow = () => {
  const win = new BrowserWindow({

    width: 1920,
    height: 1080,
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        preload: path.join(__dirname, 'preload.js'),
      },
  })
  ipcMain.handle('ping', () => 'pong')
  win.loadFile('src/index.html')

  ipcMain.on('load-book', function(event) {
    dialog.showOpenDialog({
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
        properties: ['openFile']
    }).then(result => {
        if (!result.canceled && result.filePaths.length > 0) {
            const filePath = result.filePaths[0];
            fs.readFile(result.filePaths[0], (err, data) => {
                if (err) throw err;
                // Store the file contents in a variable
                const fileContents = data;
                const stringList = splitString(data);
                //const stringList = data.split('\n').filter((str) => str.trim() !== '');

                win.webContents.send('add-text', stringList);
                
                //console.log(fileContents);
            });
        }
    }).catch(err => {
        console.log(err);
    });


})

}

app.whenReady().then(() => {
    createWindow()
  
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

function splitString(str) {
    // Split the string by newlines and store the strings in a list
    let lines = str.split("\n");
    let result = [];

    // Iterate through the list and split the strings by "."
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.length > 3500) {
        let parts = line.match(/.{1,3500}/g);
        result = result.concat(parts);
        } else {
        result.push(line);
        }
    }

    return result;
}
  
