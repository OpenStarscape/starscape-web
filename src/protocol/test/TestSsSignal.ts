import { SsSignal } from '../SsSignal';
import { SsRequest, SsRequestType } from '../SsRequest';
import { Lifetime, DependentLifetime } from '../../core';

// Lifetime mock
const mockLt = {
  own: (d: any) => { return d; },
} as unknown as Lifetime;

function newSignal(requests: SsRequest[]): SsSignal<number> {
  const obj = {
    id: 88,
    makeRequest: (rq: SsRequest) => {
      requests.push(rq);
    },
    addDependent: (_: any) => {},
  }
  return new SsSignal<number>(
    obj as any,
    'sig',
    Number,
  );
}

test('SsSignal handles signal on no subscribers', () => {
  const requests: SsRequest[] = [];
  const sig = newSignal(requests);
  sig.handleSignal(7);
  expect(requests).toEqual([]);
});

test('SsSignal subscribes on first local subscribe', () => {
  const requests: SsRequest[] = [];
  const sig = newSignal(requests);
  sig.subscribe(mockLt, _value => {});
  expect(requests).toEqual([
    {
      method: SsRequestType.Subscribe,
      objId: 88,
      member: 'sig',
    } as SsRequest,
  ]);
});

test('SsSignal unsubscribes on subscriber lifetime dispose', () => {
  const requests: SsRequest[] = [];
  const sig = newSignal(requests);
  const lt = new DependentLifetime();
  sig.subscribe(lt, _value => {});
  lt.kill();
  expect(requests).toEqual([
    {
      method: SsRequestType.Subscribe,
      objId: 88,
      member: 'sig',
    } as SsRequest,
    {
      method: SsRequestType.Unsubscribe,
      objId: 88,
      member: 'sig',
    } as SsRequest,
  ]);
});

test('SsSignal does not unsub when still has subscribers', () => {
  const requests: SsRequest[] = [];
  const sig = newSignal(requests);
  const lt1 = new DependentLifetime();
  const lt2 = new DependentLifetime();
  sig.subscribe(lt1, _value => {});
  sig.subscribe(lt2, _value => {});
  lt1.kill();
  expect(requests).toEqual([
    {
      method: SsRequestType.Subscribe,
      objId: 88,
      member: 'sig',
    } as SsRequest,
  ]);
});

test('SsSignal can resubscribe', () => {
  const requests: SsRequest[] = [];
  const sig = newSignal(requests);
  const lt = new DependentLifetime();
  sig.subscribe(lt, _value => {});
  lt.kill();
  sig.subscribe(mockLt, _value => {});
  expect(requests).toEqual([
    {
      method: SsRequestType.Subscribe,
      objId: 88,
      member: 'sig',
    } as SsRequest,
    {
      method: SsRequestType.Unsubscribe,
      objId: 88,
      member: 'sig',
    } as SsRequest,
    {
      method: SsRequestType.Subscribe,
      objId: 88,
      member: 'sig',
    } as SsRequest,
  ]);
});

test('SsSignal notifies subscriber', () => {
  const sig = newSignal([]);
  const values: any[] = [];
  sig.subscribe(mockLt, value => {
    values.push(value);
  });
  sig.handleSignal(7);
  sig.handleSignal(3);
  sig.handleSignal(3);
  expect(values).toEqual([7, 3, 3]);
});

test('SsSignal runs input through filter', () => {
  const sig = newSignal([]);
  expect(() => {
    sig.handleSignal('1');
  }).toThrow('expected number, got string');
});
