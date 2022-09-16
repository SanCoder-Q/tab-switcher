import TabActiveInfo = chrome.tabs.TabActiveInfo;
import ChromeWindow = chrome.windows.Window;
import ChromeTab = chrome.tabs.Tab;

const { tabs, storage, commands, windows } = chrome;

class Item {
  constructor(public tabId: number, public windowId: number) {}
}

class Stack {
  constructor(public current: Item, public previous: Item) {}
}

const pushItem = ({ tabId, windowId }: Item, current?: Item | null): Promise<void> => {
  return (current ? Promise.resolve({ current }) : getItem())
    .then(({ current }) => new Promise<void>((resolve) => {
      if (tabId !== current.tabId) {
        const stack = new Stack(new Item(tabId, windowId), current);
        console.log(JSON.stringify(stack));
        storage.local.set(stack, resolve);
      } else {
        resolve();
      }
    }));
};

const getItem = (): Promise<Stack> => new Promise<Stack>((resolve) => {
  storage.local.get(({ current, previous }) => resolve(new Stack(current, previous)));
});

const updatePotentialItem = (item: Item | null): Promise<void> =>
  new Promise<void>((resolve) => {
    console.log('Potential: ', JSON.stringify(item));
    storage.local.set({ potential: item }, resolve);
  });

const getPotentialItem = (): Promise<Item | null> =>
  new Promise<Item | null>((resolve) => {
    storage.local.get(({ potential }) => resolve(potential));
  });

const getCurrent = (): Promise<ChromeTab> => new Promise<ChromeTab>((resolve) => {
  tabs.query({ active: true, lastFocusedWindow: true }, ([ tab ]) => {
    if (tab && tab.id) {
      resolve(tab);
    }
  })
});

const getCurrentIn = (windowId: number): Promise<ChromeTab> => new Promise<ChromeTab>((resolve) => {
  tabs.query({ active: true, windowId }, ([ tab ]) => {
    if (tab) {
      resolve(tab);
    }
  })
});

const updateStack = ({ tabId, windowId }: Item): Promise<void> =>
  getPotentialItem().then((potentialItem) =>
    pushItem(new Item(tabId, windowId), potentialItem)
      .then(() => {
        if (potentialItem) {
          return updatePotentialItem(null);
        }
        return Promise.resolve();
      })
  );

tabs.onActivated.addListener(updateStack);

windows.onFocusChanged.addListener((windowId) => {
  if (windowId === windows.WINDOW_ID_NONE) {
    return;
  }
  getCurrent().then(tab => {
    if (windowId === tab.windowId) {
      return updatePotentialItem(new Item(tab.id!, tab.windowId));
    }
    return Promise.resolve();
  });
});

commands.onCommand.addListener((command: string) => {
  windows.getCurrent(window => {
    if (window.type !== 'normal') {
      return;
    }

    if (command === 'switchTab') {
      getPotentialItem().then((potentialItem) => {
        if (potentialItem) {
          return pushItem(potentialItem).then(() => updatePotentialItem(null));
        }
        return Promise.resolve();
      }).then(() => getItem()).then(({ previous }) => {
        console.log('switch', JSON.stringify(previous));
        tabs.update(previous.tabId, { active: true });
        windows.update(previous.windowId, { focused: true });
      });
    }

    if (command === 'moveTabCrossWindow') {
      windows.getAll((wins: ChromeWindow[]) => {
        const normalWindows = wins.filter(win => win.type === 'normal');
        if (normalWindows.length < 1) {
          return;
        }

        getCurrent().then((tab) => {
          if (normalWindows.length === 1) {
            windows.create({ tabId: tab.id, focused: true });
          } else {
            const index = normalWindows.reduce(
              (result, window, index) => window.id === tab.windowId ? index : result,
              -1
            );
            if (index === -1) {
              return;
            }

            const windowId = normalWindows[(index + 1) % normalWindows.length].id;
            tabs.move([tab.id!], { windowId, index: -1 });
            windows.update(windowId!, { focused: true });
            tabs.update(tab.id!, { active: true });
          }
        });
      });
    }
  });
});
