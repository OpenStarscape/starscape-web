type ElemProps = null | {
  id?: string,
  class?: string | string[],
  click?: EventListenerOrEventListenerObject,
  display?: 'block' | 'inline-block' | 'none' | 'flex' | 'grid',
  cursor?: string,
  width?: string,
  height?: string,
  flexGrow?: string,
};

export function elem<T extends HTMLElement>(e: T, props?: ElemProps): T {
  if (props) {
    if (props.id) {
      e.id = props.id;
    }
    if (props.class && typeof props.class === 'string') {
      e.classList.add(props.class);
    } else if (props.class) {
      for (const c of props.class) {
        e.classList.add(c);
      }
    }
    if (props.click) {
      e.addEventListener('click', props.click);
    }
    if (props.display) {
      e.style.display = props.display;
    }
    if (props.cursor) {
      e.style.cursor = props.cursor;
    }
    if (props.width) {
      e.style.width = props.width;
    }
    if (props.height) {
      e.style.height = props.height;
    }
    if (props.flexGrow) {
      e.style.flexGrow = props.flexGrow;
    }
  }
  return e;
}

type DivProps = ElemProps;

export function div(children: HTMLElement[], props?: DivProps): HTMLDivElement {
  const div = elem(document.createElement('div'), props);
  for (const child of children) {
    div.appendChild(child);
  }
  return div;
}

export function hBox(children: HTMLElement[], props?: DivProps): HTMLDivElement {
  const elem = div(children, props);
  elem.classList.add('h-box');
  return elem;
}

export function vBox(children: HTMLElement[], props?: DivProps): HTMLDivElement {
  const elem = div(children, props);
  elem.classList.add('v-box');
  return elem;
}

export function scrollBox(children: HTMLElement[], props?: DivProps): HTMLDivElement {
  const elem = div(children, props);
  elem.classList.add('scroll-box');
  return elem;
}

type PProps = ElemProps;

export function p(text: string, props?: PProps): HTMLParagraphElement {
  const p = elem(document.createElement('p'), props);
  p.textContent = text;
  return p;
}

type ButtonProps = null | ElemProps & {
  disabled?: boolean,
};

export function button(text: string, props?: ButtonProps): HTMLButtonElement {
  const b = elem(document.createElement('button'), props);
  b.textContent = text;
  b.classList.add('action-button');
  if (props) {
    if (props.disabled) {
      b.disabled = props.disabled;
    }
  }
  return b;
}

type InputProps = null | ElemProps & {
  input?: EventListenerOrEventListenerObject,
  change?: EventListenerOrEventListenerObject,
};

export function input(inputType: string, props?: InputProps): HTMLInputElement {
  const i = elem(document.createElement('input'), props);
  i.type = inputType;
  if (props) {
    if (props.input) {
      i.addEventListener('input', props.input);
    }
    if (props.change) {
      i.addEventListener('change', props.change);
    }
  }
  return i;
}
