export default class ShipNameField {
  constructor(parentDiv, currentShipElement) {
    const field = document.createElement('INPUT');
    field.style.display = 'block';
    field.oninput = () => {
      if (this.vanishingLabel) {
        parentDiv.removeChild(this.vanishingLabel);
        this.vanishingLabel = null;
      }
      const ship = currentShipElement.get();
      if (ship) {
        let name = field.value;
        if (!name) {
          name = null;
        }
        ship.property('name').set(name);
      }
    };
    parentDiv.appendChild(field);
    this.vanishingLabel = document.createElement('p');
    this.vanishingLabel.textContent = ' ⮤ give your ship a name'
    this.vanishingLabel.style.fontFamily = 'sans-serif';
    this.vanishingLabel.style.fontSize = "x-large";
    this.vanishingLabel.style.color = "yellow";
    parentDiv.appendChild(this.vanishingLabel);
  }
}
