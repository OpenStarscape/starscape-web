import { Game } from '../game'
import { DependentLifetime, Lifetime, LocalProperty } from '../core';
import { errorMessage } from '../ui';
import { spaceScene } from '../graphics';
import './orbitIntegrationTests';

export enum TestStatus {
  Idle,
  Running,
  Passed,
  Failed,
}

type TestFunc = (lt: Lifetime, game: Game, status: LocalProperty<TestStatus>) => void;
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

function runTest(parentLt: Lifetime, test: TestData, game: Game) {
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
  test.status.subscribe(lt, status => {
    if (status != TestStatus.Running) {
      lt.kill();
    }
  });
  test.func(lt, game, test.status);
}

function runAllTests(lt: Lifetime, game: Game) {
  let i = 0;
  let runNext = () => {
    const testLt = lt.newDependent();
    testList[i].status.subscribe(testLt, status => {
      if (status == TestStatus.Passed || status == TestStatus.Failed) {
        testLt.kill();
        i++;
        if (i < testList.length) {
          runNext();
        }
      }
    });
    runTest(testLt, testList[i], game);
  }
  runNext();
}

function testListDiv(lt: Lifetime, game: Game): HTMLElement {
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
    })
    labelDiv.addEventListener('click', () => {
      runTest(lt, test, game);
    })
  });
  return testListDiv;
}

function testContainer(lt: Lifetime, game: Game): HTMLElement {
  const sidebarDiv = document.createElement('div');
  sidebarDiv.classList.add('v-box');
  sidebarDiv.style.flexGrow = '0';
  sidebarDiv.style.height = '100%';
  sidebarDiv.append(testListDiv(lt, game));
  let runAllButton = document.createElement('button');
  runAllButton.textContent = 'Run all';
  runAllButton.classList.add('action-button');
  runAllButton.addEventListener('click', () => runAllTests(lt, game));
  sidebarDiv.append(runAllButton);
  const containerDiv = document.createElement('div');
  containerDiv.classList.add('h-box');
  containerDiv.append(sidebarDiv);
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
