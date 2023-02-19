const { ipcRenderer} = require('electron');

const loadBookBtn = document.getElementById('open-book-link')
const loadAudioBtn = document.getElementById('open-audio-link')

loadBookBtn.addEventListener('click', function(){
  ipcRenderer.send('load-book')
})

loadAudioBtn.addEventListener('click', function(){
  ipcRenderer.send('load-audio')
})

ipcRenderer.on('add-text', (event, message) => {
  console.log("add text")
  addStringsToDocument(message)
});

function addStringsToDocument(strings) {
  const MAX_HEIGHT_PER_PAGE = 10000; // maximum height of each page in mm
  const body = document.body; // body element to add pages to
  let currentHeight = 0; // current height of the content on the page, in mm
  let currentPage; // current page element

  // helper function to convert pixels to millimeters
  const pxToMm = (px) => px * (227 / 25.4); // assuming 96 pixels per inch

  for (let i = 0; i < strings.length; i++) {
    const str = strings[i];
    const newP = document.createElement('p');
    newP.setAttribute('id', 'p' + i); // set id attribute
    const text = document.createTextNode(str);
    newP.appendChild(text);

    // create new page if needed
    if (!currentPage || currentHeight + pxToMm(newP.offsetHeight) > MAX_HEIGHT_PER_PAGE) {
      currentPage = document.createElement('div');
      currentPage.classList.add('page');
      body.appendChild(currentPage);
      currentHeight = 0; // reset current height
    }
    currentPage.appendChild(newP);
    currentHeight += pxToMm(newP.offsetHeight);
  }
}

