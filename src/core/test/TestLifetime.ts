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

test('Lifetime disposes owned disposables', () => {
  const lt = new Lifetime();
  const a = lt.own(new MockDisposable());
  const b = lt.own(new MockDisposable());
  lt.dispose();
  expect(a.disposed).toBe(true);
  expect(b.disposed).toBe(true);
});

test('Lifetime child disposed with parent', () => {
  const parent = new Lifetime();
  const lt = parent.newChild();
  const a = lt.own(new MockDisposable());
  parent.dispose();
  expect(a.disposed).toBe(true);
});

test('Lifetime child can be owned by multiple parents', () => {
  const parent1 = new Lifetime();
  const parent2 = new Lifetime();
  const lt = parent1.newChild();
  parent2.addChild(lt);
  const a = lt.own(new MockDisposable());
  parent2.dispose();
  expect(a.disposed).toBe(true);
  parent1.dispose();
});

test('Lifetime can have disposable disowned', () => {
  const lt = new Lifetime();
  const a = lt.own(new MockDisposable());
  lt.disown(a);
  lt.dispose();
  expect(a.disposed).toBe(false);
});

test('Lifetime can not be added to after dispose', () => {
  const lt = new Lifetime();
  lt.own(new MockDisposable());
  lt.dispose();
  expect(() =>{
    lt.own(new MockDisposable());
  }).toThrow();
});

test('Lifetime can be deleted from after dispose', () => {
  const lt = new Lifetime();
  const a = lt.own(new MockDisposable());
  lt.dispose();
  lt.disown(a);
  lt.disown(new MockDisposable());
});

test('Lifetime can be disposed multiple times', () => {
  const lt = new Lifetime();
  lt.own(new MockDisposable());
  lt.dispose();
  lt.dispose();
  lt.dispose();
});

test('Lifetime reports dead after dispose', () => {
  const lt = new Lifetime();
  expect(lt.alive()).toBe(true);
  lt.own(new MockDisposable());
  expect(lt.alive()).toBe(true);
  lt.dispose();
  expect(lt.alive()).toBe(false);
  lt.dispose();
  expect(lt.alive()).toBe(false);
});
