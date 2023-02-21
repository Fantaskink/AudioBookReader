const { contextBridge, ipcRenderer } = require('electron');
const pdfjsLib = require('pdfjs-dist');
pdfjsLib.GlobalWorkerOptions.workerSrc = './public/pdfjs/build/pdf.worker.js';


const fs = require('fs')

// Expose ipcRenderer to the renderer process
contextBridge.exposeInMainWorld("ipcRenderer", {
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  on: (channel, callback) => {
    ipcRenderer.on(channel, (event, ...args) => callback(...args));
  },
});

// Expose pdfjsLib to the renderer process
contextBridge.exposeInMainWorld('pdfjsLib', pdfjsLib);

//contextBridge.exposeInMainWorld('fs', fs);

// Expose loadPDF to the renderer process
contextBridge.exposeInMainWorld('loadPDF', (filePath) => {
  

  const pdfData = new Uint8Array(fs.readFileSync(filePath));

  // Load the PDF file from the typed array
  pdfjsLib.getDocument(pdfData.buffer).promise.then(pdf => {

    // Loop through each page of the PDF
    for (let i = 1; i <= pdf.numPages; i++) {
      // Get the page object
      pdf.getPage(i).then(page => {
        // Get the text content of the page

        const newPage = document.createElement('div');
        newPage.setAttribute('id','page ' + i);
        newPage.classList.add('page');

        page.getTextContent().then(textContent => {
          // Extract the text from the content items
          for (let i = 0; i < textContent.items.length; i++) {
            const textItem = textContent.items[i];
            const fontName = textItem.fontName;
            const fontSize = textItem.height * textItem.transform[3];
            const text = textItem.str;
            const spacing = textItem.width / text.length;

            const paragraph = document.createElement('p');

            paragraph.setAttribute('id','line ' + i);

            const pText = document.createTextNode(text);

            paragraph.appendChild(pText);

            newPage.appendChild(paragraph);

            //pText.style.fontFamily = "Times New Roman, serif";
            //pText.style.fontSize = "16px";
            //pText.style.fontSize = fontSize + "px";
            
          }


          
        })

        document.body.appendChild(newPage);

      })
    }
  })

});
