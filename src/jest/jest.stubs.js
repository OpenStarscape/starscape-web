// Included by jest.config.json
// from https://github.com/piotrwitek/react-redux-typescript-guide#jest

// Global/Window object Stubs for Jest
window.matchMedia = window.matchMedia || function () {
  return {
    matches: false,
    addListener: function () { },
    removeListener: function () { },
  };
};

window.requestAnimationFrame = function (callback) {
  setTimeout(callback);
};

window.localStorage = {
  getItem: function () { },
  setItem: function () { },
};

Object.values = () => [];

class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}
window.ResizeObserver = ResizeObserver;
export default ResizeObserver;

class MockWebGLRenderer {
  constructor(parameters) {
    this.domElement = document.createElement('div');
  }
  setPixelRatio(value) { }
  setSize(w, h) { }
  render(scene, camera) { }
  dispose() { }
}

jest.mock('three', () => ({
  ...jest.requireActual('three'),
  WebGLRenderer: MockWebGLRenderer,
}));
