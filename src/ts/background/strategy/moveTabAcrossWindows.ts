import { Strategy } from './strategy';
import { ControlledTab } from '../entity/tab';
import { Stack } from '../entity/stack';
const { tabs, storage, commands, windows } = chrome;
import ChromeWindow = chrome.windows.Window;

const getAllWindows = (): Promise<ChromeWindow[]> => new Promise(resolve => windows.getAll(resolve));

export const createMoveTabAcrossWindowsStrategy = (stack: Stack<ControlledTab>) => new Strategy(
  (command: string): boolean => command === 'moveTabCrossWindow',
  async (): Promise<void> => {
    const wins = await getAllWindows();
    const normalWindows = wins.filter(win => win.type === 'normal');
    if (normalWindows.length < 1) {
      return;
    }

    const currentTab = stack.peek();
    if (!currentTab) {
      return;
    }

    if (normalWindows.length === 1) {
      windows.create({ tabId: currentTab.tabId, focused: true });
      return;
    }

    const currentWinIndex = normalWindows.findIndex((win) => win.id === currentTab.windowId);

    if (currentWinIndex < 0) {
      return;
    }

    const nextWin = normalWindows[(currentWinIndex + 1) % normalWindows.length];
    tabs.move([currentTab.tabId], { windowId: nextWin.id, index: -1 });
    windows.update(nextWin.id!, { focused: true });
    tabs.update(currentTab.tabId, { active: true });
  }
);
