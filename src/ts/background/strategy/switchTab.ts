import { Strategy } from './strategy';
import { ControlledTab } from '../entity/tab';
import { Stack } from '../entity/stack';
import { getTabById } from '../service/chromeService';
const { tabs, storage, commands, windows } = chrome;

const getNextValidTab = async (stack: Stack<ControlledTab>): Promise<ControlledTab | null> => {
  const tab = await stack.pop();
  if (!tab) {
    return null;
  }
  const checkedTab = await getTabById(tab.tabId);
  if (!checkedTab) {
    return getNextValidTab(stack);
  }
  return checkedTab;
};

export const createSwitchTabStrategy = (stack: Stack<ControlledTab>) => new Strategy(
  (command: string): boolean => command === 'switchTab',
  async (): Promise<void> => {
    const current = await stack.pop();
    const previous = await getNextValidTab(stack);
    if (!previous) {
      return;
    }
    await stack.push(current!);
    tabs.update(previous.tabId, { active: true });
    windows.update(previous.windowId, { focused: true });
  }
);
