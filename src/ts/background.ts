import TabActiveInfo = chrome.tabs.TabActiveInfo;
import { ControlledTab } from './background/entity/tab';
import { Stack } from './background/entity/stack';
import { getCurrent } from './background/service/chromeService';
import { createSwitchTabStrategy } from './background/strategy/switchTab';
import { createMoveTabAcrossWindowsStrategy } from './background/strategy/moveTabAcrossWindows';

const { tabs, storage, commands, windows } = chrome;

const stack = new Stack<ControlledTab>((a, b) => a.tabId === b.tabId);

tabs.onActivated.addListener(async ({ tabId, windowId }: TabActiveInfo) => {
  console.debug('[DEBUG] new tab', tabId, 'in window', windowId);
  await stack.push(new ControlledTab(tabId, windowId));
});

windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === windows.WINDOW_ID_NONE) {
    console.debug('[DEBUG] losing window focus');
    return;
  }
  const currentTab = await getCurrent();
  console.debug('[DEBUG] focusing on window', windowId);
  if (windowId === currentTab.windowId) {
    console.debug('[DEBUG] new tab', currentTab.tabId, 'in window', currentTab.windowId);
    await stack.push(currentTab);
  }
});

const switchTabStrategy = createSwitchTabStrategy(stack);
const moveTabAcrossWindowsStrategy = createMoveTabAcrossWindowsStrategy(stack);
const strategies = [switchTabStrategy, moveTabAcrossWindowsStrategy];

commands.onCommand.addListener(async (command: string) => {
  console.debug('[DEBUG] onCommand', command);
  windows.getCurrent(window => {
    if (window.type !== 'normal') {
      console.debug('[DEBUG] unknown window type', window.type);
      return;
    }
    strategies.forEach(async strategy => {
      if (strategy.match(command)) {
        await strategy.execute();
      }
    });
  });
});
