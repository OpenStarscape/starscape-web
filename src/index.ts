import { Game } from './game'
import { DependentLifetime } from './core';
import { errorMessage, gameContainer } from './ui';

function init() {
  const root = document.getElementById('root');
  try {
    const game = new Game();
    const lt = new DependentLifetime();
    const elem = gameContainer(lt, game);
    root!.appendChild(elem);
  } catch(err) {
    root!.appendChild(errorMessage('creating Game', err));
  }
}

document.addEventListener("DOMContentLoaded", function(){
    init();
});
