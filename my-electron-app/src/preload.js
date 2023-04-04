const { contextBridge, ipcRenderer } = require('electron');
const pdfjsLib = require('pdfjs-dist');
pdfjsLib.GlobalWorkerOptions.workerSrc = './public/pdfjs/build/pdf.worker.js';

const CMAP_URL = '../node_modules/pdfjs-dist/cmaps/';
const CMAP_PACKED = true;

let PAGE_TO_VIEW = 1;

const ENABLE_XFA = true;

const fs = require('fs');

let path = '';

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
    const existingCanvas = document.getElementById('pdf-container');
    if (existingCanvas) {
        existingCanvas.remove();
    }

    const existingTextCanvas = document.getElementById('text-layer');
    if (existingTextCanvas) {
        existingTextCanvas.remove();
    }

    // Set the canvas dimensions to match the PDF page
    const canvas = document.createElement('canvas');
    canvas.id = 'pdf-container';
    document.body.appendChild(canvas);

    // Set the canvas dimensions to match the PDF page
    const textCanvas = document.createElement('div');
    textCanvas.id = 'text-layer';
    document.body.appendChild(textCanvas);

    path = filePath;
    loadPage(path, PAGE_TO_VIEW);
});

contextBridge.exposeInMainWorld('loadPage', (increment) => {
    if ((PAGE_TO_VIEW + increment) < 1) {
        return;
    }

    loadPage(path, PAGE_TO_VIEW + increment);

    PAGE_TO_VIEW = PAGE_TO_VIEW + increment;
});

contextBridge.exposeInMainWorld('gotoPage', (pageNum) => {
    loadPage(path, parseInt(pageNum));
    PAGE_TO_VIEW = pageNum;
});

function loadPage (filePath, pageNum) {
    const pdfData = new Uint8Array(fs.readFileSync(filePath));

    const canvas = document.getElementById('pdf-container');
    const context = canvas.getContext('2d');

    // Load the PDF file from the typed array
    pdfjsLib.getDocument(pdfData.buffer).promise.then(pdf => {
        pdf.getPage(pageNum).then(function (page) {
            const scale = 1.5;
            const viewport = page.getViewport({ scale, textRenderingMode: 'smooth' });

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            scaleCanvas(canvas, context, canvas.width, canvas.height);

            // Render the PDF page on the canvas
            page.render({
                canvasContext: context,
                viewport,
                imageLayer: true
            });



            // Create a text layer for the PDF
            const textLayerDiv = document.getElementById('text-layer');
            textLayerDiv.innerHTML = '';

            const textLayer = textLayerDiv.appendChild(document.createElement('div'));
            textLayer.setAttribute('class', "textLayer");
            textLayer.setAttribute('style', 'position: absolute; left: ' + viewport.width + 'px; top: 0; width: ' + viewport.width + 'px; height: ' + viewport.height + 'px; line-height: 1.5;');

            // Render the text layer onto the canvas
            const textContent = '';
            page.getTextContent().then(function (textContent) {

                pdfjsLib.renderTextLayer({
                    textContent,
                    container: textLayer,
                    viewport: viewport,
                    textDivs: []
                });
            });
        });
    });
}

function scaleCanvas (canvas, context, width, height) {
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
    } else {
        // this is a normal 1:1 device; just scale it simply
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = '';
        canvas.style.height = '';
    }
    // scale the drawing context so everything will work at the higher ratio
    context.scale(ratio, ratio);
}
