import { ControlledTab } from '../entity/tab';

const { tabs, storage, commands, windows } = chrome;

export const getCurrent = (): Promise<ControlledTab | null> => tabs.query({ active: true, lastFocusedWindow: true })
  .then(([tab]) =>
    tab && tab.id ? new ControlledTab(tab.id, tab.windowId) : null
  ).catch(error => {
    console.error('[ERROR] failed to current tab', error);
    return null;
  });

export const getTabById = (id: number): Promise<ControlledTab | null> => tabs.get(id).then(tab =>
  tab && tab.id ? new ControlledTab(tab.id, tab.windowId) : null
).catch(error => {
  console.error('[ERROR] failed to fetch tab with id', id, error);
  return null;
});
