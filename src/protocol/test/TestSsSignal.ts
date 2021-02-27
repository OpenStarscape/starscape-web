import { SsSignal } from '../SsSignal';
import { SsValue } from '../SsValue';
import { SsRequest, SsRequestType } from '../SsRequest';
import { Lifetime } from '../../core';

// Lifetime mock
const ltMock = {
  add: (_: any) => {},
} as any
function newSignalWithFilter(requests: SsRequest[], filter: (v: SsValue) => number) {
  const obj = {
    id: 88,
    makeRequest: (rq: SsRequest) => {
      requests.push(rq);
    }
  }
  return new SsSignal(
    obj as any,
    'sig',
    filter,
  );
}

function newSignal(requests: SsRequest[]): SsSignal<number> {
  return newSignalWithFilter(requests, v => v as number)
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
  sig.subscribe(ltMock, _value => {});
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
  const lt = new Lifetime();
  sig.subscribe(lt, _value => {});
  lt.dispose();
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
  const lt1 = new Lifetime();
  const lt2 = new Lifetime();
  sig.subscribe(lt1, _value => {});
  sig.subscribe(lt2, _value => {});
  lt1.dispose();
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
  const lt = new Lifetime();
  sig.subscribe(lt, _value => {});
  lt.dispose();
  sig.subscribe(ltMock, _value => {});
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
  sig.subscribe(ltMock, value => {
    values.push(value);
  });
  sig.handleSignal(7);
  sig.handleSignal(3);
  sig.handleSignal(3);
  expect(values).toEqual([7, 3, 3]);
});

test('SsSignal runs input through filter', () => {
  const sig = newSignalWithFilter([], _v => {
    throw new Error('filter failed')
  });
  expect(() => {
    sig.handleSignal(1);
  }).toThrow('filter failed');
});
