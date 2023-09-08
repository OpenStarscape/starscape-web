import { Lifetime, LocalProperty } from '../core';
import { Game } from '../game';
import { SpaceScene } from '../graphics';
import { create, panel, PaneBuilder, godControls, shipNameField, gameStats, navPanel, weaponsPanel } from '.';

const panes = new LocalProperty<[string, PaneBuilder][]>([
  ['God', godControls],
  ['Ship name', shipNameField],
  ['Game stats', gameStats],
  ['Nav', navPanel],
  ['Weapons', weaponsPanel],
]);

export function gameUI(lt: Lifetime, game: Game): HTMLDivElement {
  const scene = new SpaceScene(lt, game);
  scene.div.classList.add('game-ui-space-scene');
  return create.div([
    scene.div,
    create.div([
      panel(lt, game, panes),
      panel(lt, game, panes),
    ], {class: 'overlay-container'}),
  ], {class: 'game-ui-root'});
}
