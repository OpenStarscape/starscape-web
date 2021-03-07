import { render } from '@testing-library/react';
import { LifetimeComponent } from '../LifetimeComponent';

class MockLifetimeComponent extends LifetimeComponent<any> {
  constructor(props: any) {
    super(props);
    this.addCallback(props.onDispose);
  }

  render() {
    return (
      <div />
    );
  }
}

test('LifetimeComponent disposes lifetime on unmount', () => {
  let disposed = false;
  const { rerender } = render(<MockLifetimeComponent onDispose={() => { disposed = true; }} />);
  expect(disposed).toBe(false);
  rerender(<div />);
  expect(disposed).toBe(true);
});
