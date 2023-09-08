import { Game } from './game'
import { DependentLifetime } from './core';
import { errorMessage, gameUI } from './ui';

function init() {
  const root = document.getElementById('root');
  try {
    const game = new Game();
    const lt = new DependentLifetime();
    root!.appendChild(gameUI(lt, game));
  } catch(err) {
    root!.appendChild(errorMessage('creating Game', err));
  }
}

document.addEventListener("DOMContentLoaded", function(){
    init();
});
