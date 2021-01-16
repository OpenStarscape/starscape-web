export default class OrbitList {
  constructor(parentDiv, bodyNameList, callback) {
    this.parentDiv = parentDiv;
    this.callback = callback;
    this.buttonList = [];
    this.selectedButton = null;
    this.addButton('Manual Control', null);
    for (const bodyName of bodyNameList) {
      this.addButton(bodyName, bodyName);
    }
  }

  addButton(label, name) {
    const button = document.createElement("BUTTON");
    button.style.display = 'block'; // make vertical? for some reason?
    button.textContent = label;
    button.onclick = () => {
      this.callback(name);
      this.select(name);
    };
    this.parentDiv.appendChild(button);
    this.buttonList.push(button);
  }

  select(button) {
    if (this.selectedButton) {
      this.selectedButton.style.fontWeight = null;
    }
    this.selectedButton = button;
    if (this.selectedButton) {
      this.selectedButton.style.fontWeight = 'bold';
    }
  }
}
