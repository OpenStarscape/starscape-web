import { Game } from '../game'
import { Lifetime } from '../core'
import { SsProperty } from '../protocol'

function namePrompt(): HTMLElement {
  const elem = document.createElement('p');
  elem.textContent = '⮤ give your ship a name';
  elem.style.fontSize = 'x-large';
  elem.style.color = 'yellow';
  return elem;
}

export function shipNameField(lt: Lifetime, game: Game): HTMLElement {
  const div = document.createElement('div');
  const nameField = document.createElement('input');
  let prompt: HTMLElement | null = namePrompt();

  div.appendChild(nameField);
  div.appendChild(prompt);

  const clearPrompt = () => {
    if (prompt !== null) {
      div.removeChild(prompt);
      prompt = null;
    }
  }

  let nameProp: SsProperty<string | null> | null = null;

  game.currentShip.subscribeWithValueLifetime(lt, (currentShipLt, ship) => {
    nameProp = ship ? ship.name : null;
    if (nameProp !== null) {
      nameProp.subscribe(currentShipLt, name => {
        // If we are not typing, update the name. If input focus is in the box don't mess with it
        if (document.activeElement != nameField) {
          nameField.textContent = name;
        }
      })
    }
  })

  // When we type, set the name
  nameField.addEventListener('input', () => {
    clearPrompt();
    let name: string | null = nameField.value;
    if (!name) {
      name = null;
    }
    if (nameProp !== null) {
      nameProp.set(name);
    }
  })

  // When we unfocus, set the text field to the current name value (this may be different if the property has changed
  // since the last edit of the text field, or if the text field edit was rejected)
  nameField.addEventListener("focusout", () => {
    const value = nameProp ? nameProp.cachedValue() : null;
    nameField.textContent = value ? value : "";
  });

  return div;
}

