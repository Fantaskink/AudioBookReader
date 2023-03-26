// Receive the text content of the PDF file from the main process
ipcRenderer.on('load-pdf', (filePath) => {
    loadPDF(filePath);
});

const loadBookBtn = document.getElementById('open-book-link');
const loadAudioBtn = document.getElementById('open-audio-link');

const prevPageBtn = document.getElementById('previous-page');
const nextPageBtn = document.getElementById('next-page');

loadBookBtn.addEventListener('click', function () {
  ipcRenderer.send('load-book');
});

loadAudioBtn.addEventListener('click', function () {
  ipcRenderer.send('load-audio');
});

prevPageBtn.addEventListener('click', function () {
  loadPage(-1);
});

nextPageBtn.addEventListener('click', function () {
  loadPage(1);
});