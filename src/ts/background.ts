import TabActiveInfo = chrome.tabs.TabActiveInfo;

const { tabs, storage, commands } = chrome;

tabs.onActivated.addListener((({ tabId, windowId }: TabActiveInfo) => {
  storage.local.get(({ current }) => {
    storage.local.set({ current: { tabId, windowId }, last: current });
  });
}));

commands.onCommand.addListener((command: string) => {
  if (command === 'switchTab') {
    storage.local.get(({ last }) => {
      tabs.update(last.tabId, { active: true });
    });
  }
});
