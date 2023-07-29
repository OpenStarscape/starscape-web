import { Game, Body, Spatial } from '../game'
import { DependentLifetime, Lifetime, LocalProperty } from '../core';
import { Scene } from '../graphics';
import { errorMessage } from '../ui';
import { SpaceScene } from '../graphics';
import './orbitIntegrationTests';
import './autopilotIntegrationTests';

enum TestStatus {
  Idle,
  Running,
  Passed,
  Exceeded,
  Failed,
}

const testResultHigherBetter = {
  passed: true,
  time: false,
};
type TestFunc = (
  lt: Lifetime,
  game: Game,
  scene: Scene,
  result: (result: {[k: string]: number}) => void
) => void;
type TestData = {
  suite: string,
  name: string,
  qualifiedName: string,
  func: TestFunc,
  status: LocalProperty<TestStatus>,
  result: {[k: string]: number} | null,
};
let currentRunningTestLt: DependentLifetime | null = null;
let testSuites: Map<string, {enabled: boolean, div?: HTMLElement}>;
let testList: TestData[];

const integrationTestResults: {[k: string]: {[k: string]: number}}[] = require('./integration-test-results.json');
const prevResults = integrationTestResults[integrationTestResults.length - 1];

export function integrationTest(suite: string, name: string, func: TestFunc) {
  if (testList === undefined) {
    testList = [];
    testSuites = new Map();
  }
  testList.push({
    suite: suite,
    name: name,
    qualifiedName: suite + ': ' + name,
    func: func,
    status: new LocalProperty<TestStatus>(TestStatus.Idle),
    result: null,
  });
  if (!testSuites.has(suite)) {
    testSuites.set(suite, {enabled: false});
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
      test.func(lt, game, scene, (result: {[k: string]: number}) => {
        const prevResult = prevResults[test.qualifiedName] ?
          prevResults[test.qualifiedName] :
          {};
        test.result = result;
        let status = TestStatus.Passed;
        Object.keys(result).forEach(key => {
          const higherBetter = (testResultHigherBetter as any)[key];
          if (higherBetter === undefined) {
            throw Error('please add ' + key + ' to testResultHigherBetter');
          }
          const score = result[key];
          const prevScore = prevResult[key];
          let resultStatus = TestStatus.Failed;
          if (prevScore === undefined) {
            if ((higherBetter && score > 0) || (!higherBetter && score < Infinity)) {
              resultStatus = TestStatus.Passed;
            }
          } else {
            const epsilon = Math.max(0.00001, Math.abs(prevScore * 0.001));
            const delta = (score - prevScore) * (higherBetter ? 1 : -1);
            if (delta > epsilon) {
              resultStatus = TestStatus.Exceeded;
            } else if (delta >= -epsilon) {
              resultStatus = TestStatus.Passed;
            }
          }
          if (resultStatus == TestStatus.Failed) {
            status = TestStatus.Failed;
          } else if (status != TestStatus.Failed && resultStatus == TestStatus.Exceeded) {
            status = TestStatus.Exceeded;
          }
        });
        test.status.set(status);
      });
    }
  }, 200);
}

function runAllTests(lt: Lifetime, game: Game, scene: Scene) {
  let i = 0;
  let runNext = () => {
    while (i < testList.length && !testSuites.get(testList[i].suite)!.enabled) {
      i++;
    }
    if (i >= testList.length) {
      let allRan = true;
      for (const test of testList) {
        if (test.result === null) {
          allRan = false;
        }
      }
      (document.getElementById('copy-data-button') as HTMLButtonElement).disabled = !allRan;
      return;
    }
    const testLt = lt.newDependent();
    runTest(testLt, testList[i], game, scene);
    testList[i].status.subscribe(testLt, status => {
      if (status == TestStatus.Passed ||
          status == TestStatus.Exceeded ||
          status == TestStatus.Failed
      ) {
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
  const testResultsDiv = document.createElement('div');
  testResultsDiv.classList.add('v-box');
  testResultsDiv.style.position = 'absolute';
  testResultsDiv.style.background = 'gray';
  testResultsDiv.style.bottom = '0';
  scene.div.appendChild(testResultsDiv);
  testList.forEach(test => {
    const suite = testSuites.get(test.suite);
    if (suite === undefined) {
      throw Error('unkown suite ' + test.suite);
    }
    if (!suite.div) {
      const toggleSuiteButton = document.createElement('button');
      toggleSuiteButton.textContent = test.suite;
      toggleSuiteButton.classList.add('action-button');
      suiteListDiv.append(toggleSuiteButton);
      suite.div = document.createElement('div');
      suiteListDiv.append(suite.div);
      suite.div.style.display = 'none';
      suite.div.style.marginLeft = '10px';
      suite.div.classList.add('v-box');
      toggleSuiteButton.addEventListener('click', () => {
        suite.enabled = !suite.enabled;
        suite.div!.style.display = suite.enabled ? 'flex' : 'none';
      });
    }
    const labelDiv = document.createElement('div');
    suite.div.append(labelDiv);
    labelDiv.style.cursor = 'pointer';
    labelDiv.classList.add('h-box');
    const labelP = document.createElement('p');
    labelP.textContent = test.name;
    labelDiv.append(labelP);
    suite.div.append(labelDiv);
    test.status.subscribe(lt, status => {
      while (testResultsDiv.firstChild) {
        testResultsDiv.removeChild(testResultsDiv.firstChild);
      }
      if (test.result !== null && (
          status === TestStatus.Failed ||
          status === TestStatus.Passed ||
          status === TestStatus.Exceeded
      )) {
        for (const key of Object.keys(test.result)) {
          const prev = prevResults[test.qualifiedName] ?
            prevResults[test.qualifiedName][key] :
            undefined;
          const p = document.createElement('p');
          const prevStr = prev !== undefined ? prev.toFixed(4) : '';
          const resultStr = test.result[key].toFixed(4);
          p.textContent = key + ': ' +
            ((prevStr && prevStr !== resultStr) ? prevStr + ' -> ' : '') +
            resultStr;
          testResultsDiv.appendChild(p);
        };
      }
      labelDiv.classList.toggle('exceptional', status === TestStatus.Exceeded);
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

function runButtons(lt: Lifetime, game: Game, scene: Scene): HTMLElement {
  const div = document.createElement('div');
  div.classList.add('h-box');
  const runAllButton = document.createElement('button');
  runAllButton.textContent = 'Run all';
  runAllButton.classList.add('action-button');
  runAllButton.addEventListener('click', () => {
    for (let suite of testSuites.values()){
      suite.enabled = true;
      suite.div!.style.display = 'flex';
    }
    runAllTests(lt, game, scene);
  });
  div.append(runAllButton);
  const runShownButton = document.createElement('button');
  runShownButton.textContent = 'Run shown';
  runShownButton.classList.add('action-button');
  runShownButton.addEventListener('click', () => runAllTests(lt, game, scene));
  div.append(runShownButton);
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
  sidebarDiv.append(runButtons(lt, game, scene));
  const copyDataButton = document.createElement('button');
  copyDataButton.textContent = 'Copy data';
  copyDataButton.classList.add('action-button');
  copyDataButton.id = 'copy-data-button';
  copyDataButton.disabled = true;
  copyDataButton.addEventListener('click', () => {
    const results = integrationTestResults.slice();
    const newResult: {[k: string]: {[k: string]: number}} = {};
    for (const test of testList) {
      if (!test.result) {
        throw Error('not all tests have completed');
      }
      newResult[test.qualifiedName] = test.result;
    }
    (newResult as any).recorded_at = Math.floor(Date.now() / 1000);
    results.push(newResult);
    const resultStr = JSON.stringify(results, null, 2);
    navigator.clipboard.writeText(resultStr);
  });
  sidebarDiv.append(copyDataButton);
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
