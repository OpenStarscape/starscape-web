export default class OrbitList {
  constructor(parentDiv, bodyNameList, callback) {
    this.buttonList = [];
    this.selectedButton = null;
    for (const bodyName of bodyNameList) {
      const button = document.createElement("BUTTON");
      button.style.display = 'block'; // make vertical? for some reason?
      button.textContent = bodyName;
      button.onclick = () => {
        callback(bodyName);
        this.select(button);
      }
      parentDiv.appendChild(button);
      this.buttonList.push(button);
    }
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
