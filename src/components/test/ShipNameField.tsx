import { render, screen } from '@testing-library/react';
import ShipNameField from '../ShipNameField';
import { SsConnection, SsObject } from '../../protocol'
import {ValueElement} from '../../lib/Element'

test('shows prompt to enter name', () => {
  const game = {
    connection: null as unknown as SsConnection,
    god: null as unknown as SsObject,
    currentShip: null as unknown as unknown as ValueElement,
  }
  render(<ShipNameField game={game} />);
  expect(screen.getByText('⮤ give your ship a name')).toBeInTheDocument()
});
