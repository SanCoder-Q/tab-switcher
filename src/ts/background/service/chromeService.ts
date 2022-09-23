import { ControlledTab } from '../entity/tab';
const { tabs, storage, commands, windows } = chrome;

export const getCurrent = (): Promise<ControlledTab> => new Promise<ControlledTab>((resolve) => {
  tabs.query({ active: true, lastFocusedWindow: true }, ([ tab ]) => {
    if (tab && tab.id) {
      resolve(new ControlledTab(tab.id, tab.windowId));
    }
  })
});

export const getTabById = (id: number): Promise<ControlledTab | null> => new Promise((resolve) => {
  tabs.get(id, tab => {
    resolve(tab && tab.id ? new ControlledTab(tab.id, tab.windowId) : null);
  });
});
