const maxMovement = 12;

// Absolutely stupid amount of code but without it bodies get selected in the 3D scene when you drag to pan and release
// over them
export function interceptDragClicks(elem: HTMLElement) {
  const pointers = new Map<number, number>();
  let ignoreScreenX = 0, ignoreScreenY = 0, ignoreTimestamp = 0;

  function pointerMove(event: PointerEvent) {
    const previous = pointers.get(event.pointerId);
    if (previous !== undefined) {
      const movement = previous + Math.abs(event.movementX) + Math.abs(event.movementY);
      pointers.set(event.pointerId, movement);
    }
  }

  elem.addEventListener('pointerdown', event => {
    if (pointers.size === 0) {
      elem.addEventListener('pointermove', pointerMove);
    }
    pointers.set(event.pointerId, 0);
  });

  elem.addEventListener('pointerleave', event => {
    pointers.delete(event.pointerId);
    if (pointers.size === 0) {
      elem.removeEventListener('pointermove', pointerMove);
    }
  });

  // The click event doesn't have a pointerId so to do it right we have to match it to a pointerup event
  elem.addEventListener('pointerup', event => {
    const movement = pointers.get(event.pointerId);
    pointers.delete(event.pointerId);
    if (pointers.size === 0) {
      elem.removeEventListener('pointermove', pointerMove);
    }
    if (movement && movement > maxMovement) {
      ignoreScreenX = event.screenX;
      ignoreScreenY = event.screenY;
      ignoreTimestamp = event.timeStamp;
    }
  });

  // This is a 'capture' event so it can intercept the click before it goes elsewhere
  elem.addEventListener('click', event => {
    if (event.screenX === ignoreScreenX &&
        event.screenY === ignoreScreenY &&
        event.timeStamp === ignoreTimestamp
    ) {
      event.stopPropagation();
    }
  }, {capture: true});
}
