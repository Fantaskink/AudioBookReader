const { contextBridge, ipcRenderer } = require('electron');
const pdfjsLib = require('pdfjs-dist');
pdfjsLib.GlobalWorkerOptions.workerSrc = './public/pdfjs/build/pdf.worker.js';

const fs = require('fs');
let currentPage = 1;
let path = "";

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

    // Check if a canvas with id "pdf-container" exists and delete it
    var existingCanvas = document.getElementById('pdf-container');
    if (existingCanvas) {
        existingCanvas.remove();
    }

    // Set the canvas dimensions to match the PDF page
    var canvas = document.createElement('canvas');
    canvas.id = 'pdf-container';
    document.body.appendChild(canvas);

    path = filePath;
    loadPage(path, currentPage);
});

contextBridge.exposeInMainWorld('loadPage', (increment) => {
    if ((currentPage + increment) < 1) {
        return;
    }

    loadPage(path, currentPage + increment);

    currentPage = currentPage + increment;
});

contextBridge.exposeInMainWorld('gotoPage', (pageNum) => {
    console.log("Page number", pageNum);
    loadPage(path, parseInt(pageNum));
});


function loadPage(filePath, pageNum) {

    const pdfData = new Uint8Array(fs.readFileSync(filePath));

    var canvas = document.getElementById("pdf-container");
    var context = canvas.getContext('2d');

    // Load the PDF file from the typed array
    pdfjsLib.getDocument(pdfData.buffer).promise.then(pdf => {

        pdf.getPage(pageNum).then(function (page) {
          var scale = 1.5;
          var viewport = page.getViewport({ scale: scale, textRenderingMode: 'smooth' });
          
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          scaleCanvas(canvas, context, canvas.width, canvas.height);

          // Render the PDF page on the canvas
         page.render({
            canvasContext: context,
            viewport: viewport,
            imageLayer: true,
          })
          
        });
    });
}


function scaleCanvas(canvas, context, width, height) {
    // assume the device pixel ratio is 1 if the browser doesn't specify it
    const devicePixelRatio = window.devicePixelRatio || 1;
    // determine the 'backing store ratio' of the canvas context
    const backingStoreRatio = (
    context.webkitBackingStorePixelRatio ||
    context.mozBackingStorePixelRatio ||
    context.msBackingStorePixelRatio ||
    context.oBackingStorePixelRatio ||
    context.backingStorePixelRatio || 1
    );
    // determine the actual ratio we want to draw at
    const ratio = devicePixelRatio / backingStoreRatio;
    if (devicePixelRatio !== backingStoreRatio) {
    // set the 'real' canvas size to the higher width/height
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    // ...then scale it back down with CSS
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    }
    else {
    // this is a normal 1:1 device; just scale it simply
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = '';
    canvas.style.height = '';
    }
    // scale the drawing context so everything will work at the higher ratio
    context.scale(ratio, ratio);
    }
