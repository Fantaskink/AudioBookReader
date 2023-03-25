const { contextBridge, ipcRenderer } = require('electron');
const pdfjsLib = require('pdfjs-dist');
pdfjsLib.GlobalWorkerOptions.workerSrc = './public/pdfjs/build/pdf.worker.js';

const fs = require('fs');

// Expose ipcRenderer to the renderer process
contextBridge.exposeInMainWorld('ipcRenderer', {
    send: (channel, data) => {
        ipcRenderer.send(channel, data);
    },
    on: (channel, callback) => {
        ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
});

// Expose pdfjsLib to the renderer process
contextBridge.exposeInMainWorld('pdfjsLib', pdfjsLib);

// Expose loadPDF to the renderer process
contextBridge.exposeInMainWorld('loadPDF', (filePath) => {
    
    const pdfData = new Uint8Array(fs.readFileSync(filePath));

    
    // Set the canvas dimensions to match the PDF page
    var canvas = document.getElementById('pdf-container');
    var context = canvas.getContext('2d');


    // Load the PDF file from the typed array
    pdfjsLib.getDocument(pdfData.buffer).promise.then(pdf => {

        pdf.getPage(1).then(function (page) {
          var scale = 1.5;
          var viewport = page.getViewport({ scale: scale, });

          
          canvas.height = viewport.height;
          canvas.width = viewport.width;


      
          // Render the PDF page on the canvas
         let rendertask = page.render({
            canvasContext: context,
            viewport: viewport
          });
          
        });
    });
});
