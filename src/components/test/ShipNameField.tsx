import { render, screen } from '@testing-library/react';
import ShipNameField from '../ShipNameField';
import StarscapeConnection, {StarscapeObject} from '../../lib/Starscape'
import {ValueElement} from '../../lib/Element'

test('renders learn react link', () => {
  const game = {
    connection: null as unknown as StarscapeConnection,
    god: null as unknown as StarscapeObject,
    currentShip: null as unknown as unknown as ValueElement,
  }
  render(<ShipNameField game={game} />);
  expect(1).toEqual(1);
});
