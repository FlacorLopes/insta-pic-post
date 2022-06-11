// Hooks added here have a bridge allowing communication between the BEX Content Script and the Quasar Application.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/content-hooks

import { resetIFrameHeight, setIFrameHeight } from './iframe';

/**
 * stores click event triggered when context menu icon is clicked
 * @var {MouseEvent}
 */
let clickEvent = null;

// FEED | PROFILE
let postType = 'FEED';

let isTheaterMode = false;
let postHasMultipleImages = false;

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request?.type === 'context.icon.clicked') {
    console.log(request);

    if (request.tab.url.includes('/p/')) postType = 'PROFILE';

    try {
      const { src } = getSinglePictureFromClickEvent(clickEvent);
      const author = getPictureAuthorFromClickEvent(clickEvent);
      if (src && author) {
        sendResponse({
          type: 'image.clicked',
          data: { src, author },
        });
      }
    } catch (error) {
      console.error(error);
      sendResponse({
        type: 'error.fired',
        data: { code: error.message },
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
const getSinglePictureFromClickEvent = (event) => {
  const img = event.path[0]?.previousElementSibling?.firstElementChild;
  if (!img?.src) throw new Error('GET_PICTURE_ERROR');

  return img;
};

/**
 *
 * @param { MouseEvent} event
 */
const getPictureAuthorFromClickEvent = (event) => {
  const article = event.path.find(
    (el) => el.tagName.toLowerCase() === 'article'
  );
  if (!article) throw new Error('ARTICLE_TAG_NOT_FOUND');

  let profileLlink = article
    ?.getElementsByTagName('header')[0]
    .getElementsByTagName('a')[0].href;

  if (!profileLlink) throw new Error('PROFILE_LINK_NOT_FOUND');

  return profileLlink;
};

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
