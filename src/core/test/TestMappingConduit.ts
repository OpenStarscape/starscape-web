import { MappingConduit } from '../MappingConduit';
import { DependentLifetime } from '../Lifetime';

const lt = new DependentLifetime();

test('MappingConduit is not initialized until subscribed', () => {
  let setter = null;
  const mapping = new MappingConduit((_lt, value) => {
    setter = value;
  });
  expect(setter).toBe(null);
  mapping.subscribe(lt, () => {});
  expect(setter).not.toBe(null);
});

test('MappingConduit handles value', () => {
  const events: any[] = [];
  let setter: null | ((value: any) => void) = null;
  const mapping = new MappingConduit((_lt, value) => {
    setter = value;
  });
  mapping.subscribe(lt, value => {
    events.push(value);
  });
  setter!(44);
  setter!(22);
  expect(events).toEqual([44, 22]);
});

test('MappingConduit ignores duplicate values', () => {
  const events: any[] = [];
  let setter: null | ((value: any) => void) = null;
  const mapping = new MappingConduit((_lt, value) => {
    setter = value;
  });
  mapping.subscribe(lt, value => {
    events.push(value);
  });
  setter!(44);
  setter!(44);
  setter!(22);
  setter!(22);
  setter!(44);
  expect(events).toEqual([44, 22, 44]);
});

test('MappingConduit sends value on first subscribe if available', () => {
  const events: any[] = [];
  const mapping = new MappingConduit((_lt, value) => {
    value(7)
  });
  mapping.subscribe(lt, value => {
    events.push(value);
  });
  expect(events).toEqual([7]);
});

test('MappingConduit sends value on later subscribes if available', () => {
  const events1: any[] = [];
  const events2: any[] = [];
  let setter: null | ((value: any) => void) = null;
  const mapping = new MappingConduit((_lt, value) => {
    setter = value;
  });
  mapping.subscribe(lt, value => {
    events1.push(value);
  });
  setter!(11);
  setter!(22);
  mapping.subscribe(lt, value => {
    events2.push(value);
  });
  setter!(33);
  expect(events1).toEqual([11, 22, 33]);
  expect(events2).toEqual([22, 33]);
});

test('MappingConduit shuts down when all lifetimes are dead', () => {
  const lt1 = new DependentLifetime();
  const lt2 = new DependentLifetime();
  const lt3 = new DependentLifetime();
  let isActive = false;
  const mapping = new MappingConduit((lt, _value) => {
    isActive = true
    lt.addCallback(() => {
      isActive = false;
    })
  });
  expect(isActive).toBe(false);
  mapping.subscribe(lt1, () => {});
  expect(isActive).toBe(true);
  mapping.subscribe(lt2, () => {});
  expect(isActive).toBe(true);
  lt2.kill();
  expect(isActive).toBe(true);
  mapping.subscribe(lt3, () => {});
  expect(isActive).toBe(true);
  lt1.kill();
  expect(isActive).toBe(true);
  lt3.kill();
  expect(isActive).toBe(false);
});

test('MappingConduit can be reactivated', () => {
  const lt1 = new DependentLifetime();
  const lt2 = new DependentLifetime();
  let isActive = false;
  const mapping = new MappingConduit((lt, _value) => {
    isActive = true
    lt.addCallback(() => {
      isActive = false;
    })
  });
  expect(isActive).toBe(false);
  mapping.subscribe(lt1, () => {});
  expect(isActive).toBe(true);
  lt1.kill();
  expect(isActive).toBe(false);
  mapping.subscribe(lt2, () => {});
  expect(isActive).toBe(true);
});
