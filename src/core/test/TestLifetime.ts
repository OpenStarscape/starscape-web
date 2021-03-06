import { Lifetime } from '../Lifetime';

class MockDisposable {
  disposed = false;
  dispose() {
    if (this.disposed) {
      throw new Error('MockDisposable disposed twice');
    } else {
      this.disposed = true;
    }
  }
}

test('Lifetime disposes added disposables', () => {
  const lt = new Lifetime();
  const a = new MockDisposable();
  const b = new MockDisposable();
  lt.add(a);
  lt.add(b);
  lt.dispose();
  expect(a.disposed).toBe(true);
  expect(b.disposed).toBe(true);
});

test('Lifetime child disposed with parent', () => {
  const parent = new Lifetime();
  const lt = parent.newChild();
  const a = new MockDisposable();
  lt.add(a);
  parent.dispose();
  expect(a.disposed).toBe(true);
});

test('Lifetime child can be added to multiple parents', () => {
  const parent1 = new Lifetime();
  const parent2 = new Lifetime();
  const lt = parent1.newChild();
  parent2.addChild(lt);
  const a = new MockDisposable();
  lt.add(a);
  parent2.dispose();
  expect(a.disposed).toBe(true);
  // added after 1st parent disposed, so 2nd parent disposed shouldn't effect it
  // TODO: add back in when things can be added to lifetimes after dispose
  // const b = new MockDisposable();
  // lt.add(b);
  parent1.dispose();
  // expect(b.disposed).toBe(false);
});

test('Lifetime can have disposable deleted', () => {
  const lt = new Lifetime();
  const a = new MockDisposable();
  lt.add(a);
  lt.delete(a);
  lt.dispose();
  expect(a.disposed).toBe(false);
});

test('Lifetime can be used multiple times', () => {
  const lt = new Lifetime();
  const a = new MockDisposable();
  const b = new MockDisposable();
  const c = new MockDisposable();
  lt.add(a);
  lt.dispose();
  lt.add(b);
  lt.dispose();
  lt.add(c);
  expect(a.disposed).toBe(true);
  expect(b.disposed).toBe(true);
  expect(c.disposed).toBe(false);
});
