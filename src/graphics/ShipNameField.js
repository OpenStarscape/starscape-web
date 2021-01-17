export default class ShipNameField {
  constructor(parentDiv, currentShipElement) {
    const field = document.createElement("INPUT");
    field.style.display = 'block';
    field.oninput = () => {
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
  }
}
