// Receive the text content of the PDF file from the main process
ipcRenderer.on('load-pdf', (filePath) => {
    loadPDF(filePath);
});

const loadBookBtn = document.getElementById('open-book-link');
const loadAudioBtn = document.getElementById('open-audio-link');

const pageInput = document.getElementById('page-input');

loadBookBtn.addEventListener('click', function () {
  ipcRenderer.send('load-book');
});

loadAudioBtn.addEventListener('click', function () {
  ipcRenderer.send('load-audio');
});

pageInput.addEventListener('input', function (event) {
  const value = event.target.value;
  gotoPage(value);
});