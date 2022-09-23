import TabActiveInfo = chrome.tabs.TabActiveInfo;
import { ControlledTab } from './background/entity/tab';
import { Stack } from './background/entity/stack';
import { getCurrent } from './background/service/chromeService';
import { createSwitchTabStrategy } from './background/strategy/switchTab';
import { createMoveTabAcrossWindowsStrategy } from './background/strategy/moveTabAcrossWindows';

const { tabs, storage, commands, windows } = chrome;

const stack = new Stack<ControlledTab>((a, b) => a.tabId === b.tabId);

tabs.onActivated.addListener(async ({ tabId, windowId }: TabActiveInfo) => {
  await stack.push(new ControlledTab(tabId, windowId));
});

windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === windows.WINDOW_ID_NONE) {
    return;
  }
  const currentTab = await getCurrent();
  if (windowId === currentTab.windowId) {
    await stack.push(currentTab);
  }
});

const switchTabStrategy = createSwitchTabStrategy(stack);
const moveTabAcrossWindowsStrategy = createMoveTabAcrossWindowsStrategy(stack);
const strategies = [switchTabStrategy, moveTabAcrossWindowsStrategy];

commands.onCommand.addListener(async (command: string) => {
  windows.getCurrent(window => {
    if (window.type !== 'normal') {
      return;
    }
    strategies.forEach(async strategy => {
      if (strategy.match(command)) {
        await strategy.execute();
      }
    });
  });
});
