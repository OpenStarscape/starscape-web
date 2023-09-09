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

export function div(children: HTMLElement[] | null, props?: DivProps): HTMLDivElement {
  const div = elem(document.createElement('div'), props);
  if (children) {
    for (const child of children) {
      div.appendChild(child);
    }
  }
  return div;
}

export function hBox(children: HTMLElement[] | null, props?: DivProps): HTMLDivElement {
  const elem = div(children, props);
  elem.classList.add('h-box');
  return elem;
}

export function vBox(children: HTMLElement[] | null, props?: DivProps): HTMLDivElement {
  const elem = div(children, props);
  elem.classList.add('v-box');
  return elem;
}

export function scrollBox(children: HTMLElement[] | null, props?: DivProps): HTMLDivElement {
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
  if (props) {
    if (props.disabled) {
      b.disabled = props.disabled;
    }
  }
  return b;
}

type InputProps = null | ElemProps & {
  placeholder?: string,
  disabled?: boolean,
  input?: EventListenerOrEventListenerObject,
  change?: EventListenerOrEventListenerObject,
};

export function input(inputType: string, props?: InputProps): HTMLInputElement {
  const i = elem(document.createElement('input'), props);
  i.type = inputType;
  if (props) {
    if (props.placeholder) {
      i.placeholder = props.placeholder;
    }
    if (props.disabled) {
      i.disabled = props.disabled;
    }
    if (props.input) {
      i.addEventListener('input', props.input);
    }
    if (props.change) {
      i.addEventListener('change', props.change);
    }
  }
  return i;
}

type TabsElement = HTMLDivElement & {
  setTabNames: (tabs: string[]) => void,
  selectTab: (tab: string | null) => void,
}

/// Creates a list of tabs that can be selected by the user. Only one tab can be selected at a time. Only makes a tab
/// bar, if this is used to display multiple views the caller is expected to handle hiding and showing them.
/// tabs: list of tab names. this can be changed later with .setTabNames on the returned object
/// alwaysSelectTab: if to select a tab at the start and whenever the slected tab is removed from the tab list
/// tabSelected: this callback is called with the name of the selected tab (or null if no tab is selected) whenever the
///              selected tab changed (due to user input or .selectTab())
/// props: properties for the div, optional
/// Returns: an HTML div with additional properties
export function tabs(tabs: string[], alwaysSelectTab: boolean, tabSelected: (item: string | null) => void, props?: DivProps): TabsElement {
  const result = div(null, props) as TabsElement;
  result.classList.add('tab-list');
  let tabMap = new Map<string, HTMLElement>();
  let selectedTab: null | string = null;
  result.setTabNames = (tabs) => {
    while (result.lastElementChild) {
      result.removeChild(result.lastElementChild)
    }
    const newTabMap = new Map<string, HTMLElement>();
    let foundSelectedTab = false;
    for (const tab of tabs) {
      let elem = tabMap.get(tab);
      if (elem != undefined) {
        tabMap.delete(tab);
        if (tab === selectedTab) {
          foundSelectedTab = true;
        }
      } else {
        elem = button(tab, {class: 'tab-button', click: () => {
          result.selectTab(tab);
        }});
      }
      result.appendChild(elem);
      newTabMap.set(tab, elem);
    }
    tabMap.clear();
    tabMap = newTabMap;
    if (!foundSelectedTab) {
      if (alwaysSelectTab && tabs.length) {
        result.selectTab(tabs[0]);
      } else {
        result.selectTab(null);
      }
    }
  };
  result.selectTab = (tab) => {
    if (tab === selectedTab) {
      return;
    }
    if (selectedTab !== null && tabMap.has(selectedTab)) {
      tabMap.get(selectedTab)!.classList.remove('selected');
    }
    if (tab !== null) {
      if (!tabMap.has(tab)) {
        throw Error('Selected tab ' + tab + ' not in tab list');
      }
      tabMap.get(tab)!.classList.add('selected');
    }
    selectedTab = tab;
    tabSelected(tab);
  }
  result.setTabNames(tabs);
  if (selectedTab === null) {
    tabSelected(null);
  }
  return result;
}
