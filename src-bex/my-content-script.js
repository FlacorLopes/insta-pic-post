// Hooks added here have a bridge allowing communication between the BEX Content Script and the Quasar Application.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/content-hooks

let clickEvent = null;

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request?.type === 'contextIconClicked') {
    console.log(request?.item, request?.tab, clickEvent);

    const { src } = getSinglePictureFromClickEvent(clickEvent);
    const author = getPictureAuthorFromClickEvent(clickEvent);
    if (src && author) {
      sendResponse({
        type: 'image.clicked',
        data: { src, author },
      });
    }
  }
});

let eventAdded = false;
if (!eventAdded) {
  /*
      captures the click event when context menu icon is clicked
    */
  document.addEventListener('mousedown', (e) => {
    clickEvent = e;
  });
  eventAdded = true;
}

/**
 *
 * @param { MouseEvent} event
 */
const getSinglePictureFromClickEvent = (event) =>
  event.path[0]?.previousElementSibling?.firstElementChild;

/**
 *
 * @param { MouseEvent} event
 */
const getPictureAuthorFromClickEvent = (event) => {
  const article = event.path.find(
    (el) => el.tagName.toLowerCase() === 'article'
  );

  return article.firstElementChild.firstElementChild.getElementsByTagName(
    'a'
  )[1].href;
};

const iFrame = document.createElement('iframe'),
  defaultFrameHeight = '0px';

/**
 * Set the height of our iFrame housing our BEX
 * @param height
 */
const setIFrameHeight = (height) => {
  iFrame.height = height;
};

/**
 * Reset the iFrame to its default height e.g The height of the top bar.
 */
const resetIFrameHeight = () => {
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
  document.body.prepend(iFrame);
})();

export default function (bridge) {
  /**
   * When the drawer is toggled set the iFrame height to take the whole page.
   * Reset when the drawer is closed.
   */
  bridge.on('mount.iframe', (event) => {
    setIFrameHeight('100%');
    bridge.send(event.eventResponseKey);
  });

  bridge.on('unmount.iframe', (event) => {
    resetIFrameHeight();
    bridge.send(event.eventResponseKey);
  });
}
