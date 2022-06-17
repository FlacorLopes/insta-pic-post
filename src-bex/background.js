let outBridge = null; // TODO: randomly gets undefined :(

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'insta-pic',
    title: 'Insta',
    type: 'normal',
    contexts: ['page'],
  });
});

chrome.contextMenus.onClicked.addListener((item, tab) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(
      tab.id,
      {
        type: 'context.icon.clicked',
        item,
        tab,
      },
      function (response) {
        switch (response.type) {
          case 'image.clicked':
            outBridge.send('open.preview', {
              src: response.data.src,
              author: response.data.author,
            });
            break;
          case 'error.fired':
            try {
              outBridge.send('error.fired', {
                code: response.data.code,
              });
            } catch (error) {
              console.error(error);
            }
        }
      }
    );
  });
});

export default function (bridge /* , allActiveConnections */) {
  outBridge = bridge;
  bridge.on('storage.get', (event) => {
    const payload = event.data;
    if (payload.key === null) {
      chrome.storage.local.get(null, (r) => {
        const result = [];

        // Group the items up into an array to take advantage of the bridge's chunk splitting.
        for (const itemKey in r) {
          result.push(r[itemKey]);
        }
        bridge.send(event.eventResponseKey, result);
      });
    } else {
      chrome.storage.local.get([payload.key], (r) => {
        bridge.send(event.eventResponseKey, r[payload.key]);
      });
    }
  });

  bridge.on('storage.set', (event) => {
    const payload = event.data;
    chrome.storage.local.set({ [payload.key]: payload.data }, () => {
      bridge.send(event.eventResponseKey, payload.data);
    });
  });

  bridge.on('storage.remove', (event) => {
    const payload = event.data;
    chrome.storage.local.remove(payload.key, () => {
      bridge.send(event.eventResponseKey, payload.data);
    });
  });

  /*
  // EXAMPLES
  // Listen to a message from the client
  bridge.on('test', d => {
    console.log(d)
  })

  // Send a message to the client based on something happening.
  chrome.tabs.onCreated.addListener(tab => {
    bridge.send('browserTabCreated', { tab })
  })

  // Send a message to the client based on something happening.
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
      bridge.send('browserTabUpdated', { tab, changeInfo })
    }
  })
   */
}
