import { render, screen } from '@testing-library/react';
import { LocalProperty } from '../../core'
import { SsConnection, SsObject } from '../../protocol'
import ShipNameField from '../ShipNameField';

test('shows prompt to enter name', () => {
  const game = {
    connection: null as unknown as SsConnection,
    god: null as unknown as SsObject,
    currentShip: null as unknown as unknown as LocalProperty<SsObject | null>,
    fps: null as any,
  }
  render(<ShipNameField game={game} />);
  expect(screen.getByText('⮤ give your ship a name')).toBeInTheDocument()
});
