import { messageFromError } from '../core';

export function errorMessage(action: string | null, message: any): HTMLElement {
  let text = 'Error';
  if (action !== null) {
    text += ' ' + action;
  }
  text += ': ' + messageFromError(message);
  const elem = document.createElement('p');
  console.error(text)
  elem.textContent = text;
  return elem;
}
