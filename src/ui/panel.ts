import { Lifetime, DependentLifetime, Conduit } from '../core';
import { Game } from '../game';
import { create } from '.';

export type PaneBuilder = (lt: Lifetime, game: Game) => HTMLElement;

export function panel(lt: Lifetime, game: Game, panes: Conduit<[string, PaneBuilder][]>): HTMLDivElement {
  const panelDiv = create.div(null, {class: 'panel'});
  const paneMap = new Map<string, PaneBuilder>();
  let paneLt: DependentLifetime | null = null;
  const tabDiv = create.tabs([], true, (selected) => {
    if (paneLt !== null) {
      paneLt.kill();
    }
    if (selected !== null) {
      const builder = paneMap.get(selected);
      if (!builder) {
        console.error('Tab ' + selected + ' selected but has no pane builder');
        return;
      }
      paneLt = lt.newDependent();
      const paneElem = builder(paneLt, game);
      panelDiv.appendChild(paneElem)
      paneLt.addCallback(() => {
        panelDiv.removeChild(paneElem);
        paneLt = null;
      });
    }
  });
  panelDiv.prepend(tabDiv);
  panes.subscribe(lt, panes => {
    paneMap.clear();
    const paneList: string[] = [];
    for (const [name, builder] of panes) {
      paneList.push(name);
      paneMap.set(name, builder);
    }
    tabDiv.setTabNames(paneList);
  });
  return panelDiv;
}
