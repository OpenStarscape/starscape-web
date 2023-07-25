import * as THREE from 'three';
import { Lifetime, Vec3 } from '../core';
import { Game, Nav, Body } from '../game';
import { SsObject } from '../protocol';

export function weaponsPanel(lt: Lifetime, game: Game): HTMLElement {
  const div = document.createElement('div');
  const fireButton = document.createElement('button');
  fireButton.classList.add('action-button');
  let target: Body | null = null;
  game.selectedBody.subscribeWithValueLifetime(lt, (valueLt, body) => {
    fireButton.disabled = true;
    target = body;
    if (body) {
      body.name.subscribe(valueLt, name => {
        fireButton.textContent = 'Shoot ' + (name ?? 'body');
        fireButton.disabled = false;
      });
    } else {
      fireButton.textContent = 'Orbit';
    }
  });
  fireButton.addEventListener('click', () => {
    const currentShip = game.currentShip.get();
    if (currentShip === null) {
      return;
    }
    const shipCreatedLt = lt.newDependent();
    if (target === null) {
      return;
    }
    const missileName = 'missile ' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    game.root.signal('ship_created', SsObject).subscribe(shipCreatedLt, obj => {
      const missile = game.getBody(obj);
      missile.name.getThen(shipCreatedLt, name => {
        if (name === missileName) {
          shipCreatedLt.kill(); // only handle this callback once
          if (target !== null) {
            Nav.applyState(missile, {
              scheme: Nav.Scheme.Dock,
              target: target,
            });
          }
        }
      })
    });
    const currentSpatial = currentShip.spatial(shipCreatedLt);
    currentSpatial.onReady(() => {
      const pos = new THREE.Vector3();
      const vel = new THREE.Vector3();
      currentSpatial.copyPositionInto(pos);
      currentSpatial.copyVelocityInto(vel);
      pos.add(vel.clone().multiplyScalar(0.03));
      game.root.action('create_ship', undefined).fire({
        name: missileName,
        position: new Vec3(pos),
        velocity: new Vec3(vel),
      });
    });
  });
  div.appendChild(fireButton);
  return div;
}
