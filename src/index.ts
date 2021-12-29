import { GameImpl } from './game'
import { Lifetime } from './core';
import { errorMessage, gameContainer } from './ui';

function init() {
  const root = document.getElementById('root');
  try {
    const game = new GameImpl();
    const lt = new Lifetime();
    const elem = gameContainer(lt, game);
    root!.appendChild(elem);
  } catch(err) {
    root!.appendChild(errorMessage('creating Game', err));
  }
}

document.addEventListener("DOMContentLoaded", function(){
    init();
});
