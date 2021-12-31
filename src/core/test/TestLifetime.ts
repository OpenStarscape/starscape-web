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
  parent1.dispose();
});

test('Lifetime can have disposable deleted', () => {
  const lt = new Lifetime();
  const a = new MockDisposable();
  lt.add(a);
  lt.delete(a);
  lt.dispose();
  expect(a.disposed).toBe(false);
});

test('Lifetime can not be added to after dispose', () => {
  const lt = new Lifetime();
  const a = new MockDisposable();
  const b = new MockDisposable();
  lt.add(a);
  lt.dispose();
  expect(() =>{
    lt.add(b);
  }).toThrow();
});

test('Lifetime can be deleted from after dispose', () => {
  const lt = new Lifetime();
  const a = new MockDisposable();
  const b = new MockDisposable();
  lt.add(a);
  lt.dispose();
  lt.delete(a);
  lt.delete(b);
});

test('Lifetime can be disposed multiple times', () => {
  const lt = new Lifetime();
  const a = new MockDisposable();
  lt.add(a);
  lt.dispose();
  lt.dispose();
  lt.dispose();
});

test('Lifetime reports dead after dispose', () => {
  const lt = new Lifetime();
  expect(lt.alive()).toBe(true);
  const a = new MockDisposable();
  lt.add(a);
  expect(lt.alive()).toBe(true);
  lt.dispose();
  expect(lt.alive()).toBe(false);
  lt.dispose();
  expect(lt.alive()).toBe(false);
});
