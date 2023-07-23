import { Game, Body } from '../game'
import { DependentLifetime, Lifetime, LocalProperty } from '../core';
import { Scene } from '../graphics';
import { errorMessage } from '../ui';
import { SpaceScene } from '../graphics';
import './orbitIntegrationTests';

export enum TestStatus {
  Idle,
  Running,
  Passed,
  Failed,
}

type TestFunc = (lt: Lifetime, game: Game, scene: Scene, status: LocalProperty<TestStatus>) => void;
type TestData = {
  name: string,
  func: TestFunc,
  status: LocalProperty<TestStatus>,
};
let currentRunningTestLt: DependentLifetime | null = null;
let testList: TestData[];

export function integrationTest(name: string, func: TestFunc) {
  if (testList === undefined) {
    testList = [];
  }
  testList.push({
    name: name,
    func: func,
    status: new LocalProperty<TestStatus>(TestStatus.Idle),
  });
}

export function withBodyWithName(lt: Lifetime, game: Game, name: string, callback: (body: Body) => void) {
  game.bodies.subscribe(lt, ([_, body]) => {
    body.property('name', {nullable: String}).getThen(lt, bn => {
      if (bn == name) {
        callback(game.getBody(body));
      }
    });
  });
}

function runTest(parentLt: Lifetime, test: TestData, game: Game, scene: Scene) {
  if (currentRunningTestLt) {
    currentRunningTestLt.kill();
  }
  const lt = parentLt.newDependent();
  currentRunningTestLt = lt;
  lt.addCallback(() => {
    currentRunningTestLt = null;
    if (test.status.get() == TestStatus.Running) {
      test.status.set(TestStatus.Idle);
    }
  });
  test.status.set(TestStatus.Running);
  test.func(lt, game, scene, test.status);
}

function runAllTests(lt: Lifetime, game: Game, scene: Scene) {
  let i = 0;
  let runNext = () => {
    const testLt = lt.newDependent();
    runTest(testLt, testList[i], game, scene);
    testList[i].status.subscribe(testLt, status => {
      if (status == TestStatus.Passed || status == TestStatus.Failed) {
        testLt.kill();
        i++;
        if (i < testList.length) {
          runNext();
        }
      }
    });
  }
  runNext();
}

function testListDiv(lt: Lifetime, game: Game, scene: Scene): HTMLElement {
  const testListDiv = document.createElement('div');
  testListDiv.classList.add('scroll-box');
  testList.forEach(test => {
    const labelDiv = document.createElement('div');
    labelDiv.style.cursor = 'pointer';
    labelDiv.classList.add('h-box');
    const labelP = document.createElement('p');
    labelP.textContent = test.name;
    labelDiv.append(labelP);
    testListDiv.append(labelDiv);
    test.status.subscribe(lt, status => {
      labelDiv.classList.toggle('good', status === TestStatus.Passed);
      labelDiv.classList.toggle('bad', status === TestStatus.Failed);
      labelDiv.classList.toggle('important', status === TestStatus.Running);
      labelDiv.scrollIntoView({behavior: "smooth", block: "nearest"});
    })
    labelDiv.addEventListener('click', () => {
      runTest(lt, test, game, scene);
    })
  });
  return testListDiv;
}

function testContainer(lt: Lifetime, game: Game): HTMLElement {
  const scene = new SpaceScene(lt, game);
  const sidebarDiv = document.createElement('div');
  sidebarDiv.classList.add('v-box');
  sidebarDiv.style.flexGrow = '0';
  sidebarDiv.style.height = '100%';
  sidebarDiv.append(testListDiv(lt, game, scene));
  let runAllButton = document.createElement('button');
  runAllButton.textContent = 'Run all';
  runAllButton.classList.add('action-button');
  runAllButton.addEventListener('click', () => runAllTests(lt, game, scene));
  sidebarDiv.append(runAllButton);
  const containerDiv = document.createElement('div');
  containerDiv.classList.add('h-box');
  containerDiv.append(sidebarDiv);
  scene.div.style.flexGrow = '1';
  containerDiv.append(scene.div);
  containerDiv.style.height = '100vh';
  return containerDiv;
}

function init() {
  const root = document.getElementById('root');
  try {
    const game = new Game();
    game.root.action('reset', null).fire(null);
    game.root.property('quit_at', {nullable: Number}).set(null);
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
