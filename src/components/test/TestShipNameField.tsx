import { render, screen } from '@testing-library/react';
import ShipNameField from '../ShipNameField';

test('shows prompt to enter name', () => {
  const game = {
    connection: null,
    god: null,
    currentShip: null,
    fps: null,
  } as any
  render(<ShipNameField game={game} />);
  expect(screen.getByText('⮤ give your ship a name')).toBeInTheDocument()
});
