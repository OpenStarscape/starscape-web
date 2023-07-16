import { Game } from '../game'
import { DependentLifetime, Lifetime } from '../core';
import { errorMessage } from '../ui';
import { spaceScene } from '../graphics';
import './orbitIntegrationTests';

type TestFunc = (lt: DependentLifetime, game: Game, completed: (passed: boolean) => void) => void;
let testList: [string, TestFunc][];

export function integrationTest(name: string, func: TestFunc) {
  if (testList === undefined) {
    testList = [];
  }
  testList.push([name, func]);
  console.log('test added');
}

function testContainer(lt: Lifetime, game: Game): HTMLElement {
  const testListDiv = document.createElement('div');
  testListDiv.classList.add('v-box');
  testListDiv.style.flexGrow = '0';
  testList.forEach(([name, func]) => {
    const labelDiv = document.createElement('div');
    labelDiv.style.cursor = 'pointer';
    labelDiv.classList.add('h-box');
    const labelP = document.createElement('p');
    labelP.textContent = name;
    labelDiv.append(labelP);
    testListDiv.append(labelDiv);
    labelDiv.addEventListener('click', () => {
      labelDiv.style.backgroundColor = 'blue';
      const testLt = lt.newDependent();
      func(testLt, game, passed => {
        testLt.kill();
        if (passed) {
          labelDiv.style.backgroundColor = 'green';
        } else {
          labelDiv.style.backgroundColor = 'red';
        }
      });
    })
  });
  const containerDiv = document.createElement('div');
  containerDiv.classList.add('h-box');
  containerDiv.append(testListDiv);
  const spaceSceneElem = spaceScene(lt, game);
  spaceSceneElem.style.flexGrow = '1';
  containerDiv.append(spaceSceneElem);
  containerDiv.style.height = '100vh';
  return containerDiv;
}

function init() {
  const root = document.getElementById('root');
  try {
    const game = new Game();
    const lt = new DependentLifetime();
    const elem = testContainer(lt, game);
    root!.appendChild(elem);
  } catch(err) {
    root!.appendChild(errorMessage('creating Game', err));
  }
}

document.addEventListener("DOMContentLoaded", function(){
    init();
});
