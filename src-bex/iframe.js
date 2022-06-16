const iFrame = document.createElement('iframe'),
  defaultFrameHeight = '0px';

/**
 * Set the height of our iFrame housing our BEX
 * @param height
 */
export const setIFrameHeight = (height) => {
  iFrame.height = height;
};

/**
 * Reset the iFrame to its default height e.g The height of the top bar.
 */
export const resetIFrameHeight = () => {
  setIFrameHeight(defaultFrameHeight);
};

/**
 * The code below will get everything going. Initialize the iFrame with defaults and add it to the page.
 * @type {string}
 */
iFrame.id = 'bex-app-iframe';
iFrame.width = '100%';
resetIFrameHeight();

// Assign some styling so it looks seamless
Object.assign(iFrame.style, {
  position: 'fixed',
  top: '0',
  right: '0',
  bottom: '0',
  left: '0',
  border: '0',
  zIndex: '9999999', // Make sure it's on top
  overflow: 'visible',
});
(function () {
  // When the page loads, insert our browser extension app.
  iFrame.src = chrome.runtime.getURL('www/index.html');
  iFrame.allow = 'clipboard-write';
  document.body.prepend(iFrame);
})();
