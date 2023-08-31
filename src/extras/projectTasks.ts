import { Game, Body, Spatial } from '../game'
import { DependentLifetime, Lifetime, LocalProperty, Vec3, G, TAU } from '../core';
import { errorMessage, create } from '../ui';
import { SpaceScene } from '../graphics';
import { SsObject } from '../protocol';
import * as THREE from 'three';

function createBody(
  game: Game,
  name: undefined | string,
  color: undefined | string,
  radius: number,
  mass: number,
  position: THREE.Vector3,
  velocity: THREE.Vector3
) {
  game.root.action('create_celestial', undefined).fire({
    name: name,
    color: color,
    radius: radius,
    mass: mass,
    position: new Vec3(position),
    velocity: new Vec3(velocity),
  });
}

function createSubtask(lt: Lifetime, game: Game, parent: Spatial) {
  const mass = parent.mass() / 10;
  const radius = mass / 1e23;
  const distance = radius * (Math.random() * 100 + 50);
  const periodTime = TAU * Math.sqrt((Math.pow(distance, 3) / (G * parent.mass())));
  const speed = distance * TAU / periodTime;
  const position = new THREE.Vector3();
  const velocity = new THREE.Vector3();
  parent.copyPositionInto(position);
  parent.copyVelocityInto(velocity);
  const quat = new THREE.Quaternion();
  const zVec = new THREE.Vector3(0, 0, 1);
  quat.setFromAxisAngle(zVec, Math.random() * TAU);
  const upVec = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, 4);
  upVec.normalize();
  const tiltQuat = new THREE.Quaternion();
  tiltQuat.setFromUnitVectors(zVec, upVec);
  quat.multiply(tiltQuat);
  const localPos = new THREE.Vector3(distance, 0, 0);
  const localVel = new THREE.Vector3(0, speed, 0);
  localPos.applyQuaternion(quat);
  localVel.applyQuaternion(quat);
  position.add(localPos);
  velocity.add(localVel);
  createBody(game, undefined, '#ffffff', radius, mass, position, velocity);
}

function tasksContainer(lt: Lifetime, game: Game): HTMLElement {
  const scene = new SpaceScene(lt, game);
  scene.div.style.flexGrow = '1';
  const createSubtaskButton = create.button('Create subtask', {click: () => {
    const parent = game.selectedBody.get();
    if (parent) {
      createSubtask(lt, game, parent.spatial(lt));
    }
  }});
  const nameField = create.input('text', {placeholder: 'Task name', input: () => {
    const selected = game.selectedBody.get();
    if (selected) {
      selected.obj.property('name', {nullable: String}).set(nameField.value);
    }
  }});
  const destroyButton = create.button('Delete', {click: () => {
    const selected = game.selectedBody.get();
    if (selected) {
      selected.obj.action('destroy', null).fire(null);
    }
  }})
  game.selectedBody.subscribeWithValueLifetime(lt, (valueLt, body) => {
    scene.cameraFocusBody.set(body);
    createSubtaskButton.disabled = body === null;
    nameField.disabled = body === null;
    destroyButton.disabled = body === null;
    nameField.blur();
    if (body) {
      body.obj.property('name', {nullable: String}).subscribe(valueLt, name => {
        if (document.activeElement !== nameField) {
          nameField.value = name ?? '';
        }
      });
    }
  });
  return create.hBox([
    create.scrollBox([
      createSubtaskButton,
      nameField,
      destroyButton,
    ], {height: '100%', width: '300px', flexGrow: '0'}),
    scene.div,
  ], {height: '100vh'});
}

function init() {
  const root = document.getElementById('root');
  try {
    const game = new Game();
    game.root.property('quit_at', {nullable: Number}).set(null);
    game.root.property('time_per_time', Number).set(0);
    const lt = new DependentLifetime();
    root!.appendChild(tasksContainer(lt, game));
    game.root.property('bodies', {arrayOf: SsObject}).getThen(lt, bodies => {
      if (!bodies.length) {
        console.log('Creating root body');
        createBody(game, undefined, '#dc99fb', 1, 1e25, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0));
      }
    });
  } catch(err) {
    root!.appendChild(errorMessage('creating Game', err));
  }
}

document.addEventListener("DOMContentLoaded", function(){
    init();
});
