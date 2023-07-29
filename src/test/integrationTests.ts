import { Game, Body, Spatial } from '../game'
import { DependentLifetime, Lifetime, LocalProperty } from '../core';
import { Scene } from '../graphics';
import { errorMessage } from '../ui';
import { SpaceScene } from '../graphics';
import './orbitIntegrationTests';
import './autopilotIntegrationTests';

export enum TestStatus {
  Idle,
  Running,
  Passed,
  Failed,
}

type TestFunc = (
  lt: Lifetime,
  game: Game,
  scene: Scene,
  result: (status: TestStatus, score: null | number) => void
) => void;
type TestData = {
  suite: string,
  name: string,
  func: TestFunc,
  status: LocalProperty<TestStatus>,
  score: null | number,
};
let currentRunningTestLt: DependentLifetime | null = null;
let suitesEnabled: Map<string, boolean>;
let testList: TestData[];

export function integrationTest(suite: string, name: string, func: TestFunc) {
  if (testList === undefined) {
    testList = [];
    suitesEnabled = new Map();
  }
  testList.push({
    suite: suite,
    name: name,
    func: func,
    status: new LocalProperty<TestStatus>(TestStatus.Idle),
    score: null,
  });
  if (!suitesEnabled.has(suite)) {
    suitesEnabled.set(suite, false);
  }
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

export function withSpatialWithName(lt: Lifetime, game: Game, name: string, callback: (spatial: Spatial) => void) {
  withBodyWithName(lt, game, name, body => {
    const spatial = body.spatial(lt);
    spatial.onReady(() => {
      callback(spatial);
    })
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
  setPaused(game, true);
  game.root.action('reset', null).fire(null);
  // TODO: wait for reset to actually complete instead of waiting for a timeout
  setTimeout(() => {
    if (lt.alive()) {
      test.func(lt, game, scene, (status: TestStatus, score: null | number) => {
        test.score = score;
        test.status.set(status);
      });
    }
  }, 200);
}

function runAllTests(lt: Lifetime, game: Game, scene: Scene) {
  let i = 0;
  let runNext = () => {
    while (i < testList.length && !suitesEnabled.get(testList[i].suite)) {
      i++;
    }
    if (i >= testList.length) {
      return;
    }
    const testLt = lt.newDependent();
    runTest(testLt, testList[i], game, scene);
    testList[i].status.subscribe(testLt, status => {
      if (status == TestStatus.Passed || status == TestStatus.Failed) {
        testLt.kill();
        i++;
        runNext();
      }
    });
  }
  runNext();
}

function testListDiv(lt: Lifetime, game: Game, scene: Scene): HTMLElement {
  const suiteListDiv = document.createElement('div');
  suiteListDiv.classList.add('scroll-box');
  suiteListDiv.style.width = '300px';
  const suites = new Map();
  testList.forEach(test => {
    if (!suites.has(test.suite)) {
      const toggleSuiteButton = document.createElement('button');
      toggleSuiteButton.textContent = test.suite;
      toggleSuiteButton.classList.add('action-button');
      suiteListDiv.append(toggleSuiteButton);
      const suiteDiv = document.createElement('div');
      suiteListDiv.append(suiteDiv);
      suiteDiv.style.display = 'none';
      suiteDiv.style.marginLeft = '10px';
      suiteDiv.classList.add('v-box');
      suites.set(test.suite, suiteDiv);
      toggleSuiteButton.addEventListener('click', () => {
        const enabled = !suitesEnabled.get(test.suite);
        suitesEnabled.set(test.suite, enabled);
        suiteDiv.style.display = enabled ? 'flex' : 'none';
      });
    }
    const suiteDiv = suites.get(test.suite);
    const labelDiv = document.createElement('div');
    suiteDiv.append(labelDiv);
    labelDiv.style.cursor = 'pointer';
    labelDiv.classList.add('h-box');
    const labelP = document.createElement('p');
    labelP.textContent = test.name;
    labelDiv.append(labelP);
    suiteDiv.append(labelDiv);
    test.status.subscribe(lt, status => {
      labelDiv.classList.toggle('good', status === TestStatus.Passed);
      labelDiv.classList.toggle('bad', status === TestStatus.Failed);
      labelDiv.classList.toggle('important', status === TestStatus.Running);
      labelDiv.scrollIntoView({behavior: "smooth", block: "nearest"});
    })
    labelDiv.addEventListener('click', () => {
      runTest(lt, test, game, scene);
    });
  });
  return suiteListDiv;
}

export function setPaused(game: Game, paused: boolean) {
  const tpt = game.root.property('time_per_time', Number);
  if (paused) {
    tpt.set(0);
  } else {
    tpt.set((game as any).testGameSpeed);
  }
}

function realTimeToggle(game: Game): HTMLElement {
  const div = document.createElement('div');
  div.classList.add('h-box');
  const p = document.createElement('p');
  p.textContent = 'Real time';
  p.style.flexGrow = '1';
  const toggle = document.createElement('input');
  toggle.type = 'checkbox';
  const fastGameSpeed = 100;
  (game as any).testGameSpeed = fastGameSpeed;
  toggle.checked = false;
  toggle.addEventListener('change', () => {
    (game as any).testGameSpeed = toggle.checked ? 1 : fastGameSpeed;
  })
  div.append(p);
  div.append(toggle);
  return div;
}

function testContainer(lt: Lifetime, game: Game): HTMLElement {
  const scene = new SpaceScene(lt, game);
  const sidebarDiv = document.createElement('div');
  sidebarDiv.classList.add('v-box');
  sidebarDiv.style.flexGrow = '0';
  sidebarDiv.style.height = '100%';
  sidebarDiv.append(testListDiv(lt, game, scene));
  const paddingDiv = document.createElement('div');
  paddingDiv.style.flexGrow = '1';
  sidebarDiv.append(paddingDiv);
  sidebarDiv.append(realTimeToggle(game));
  const runAllButton = document.createElement('button');
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
    game.root.property('min_roundtrip_time', Number).set(0);
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
