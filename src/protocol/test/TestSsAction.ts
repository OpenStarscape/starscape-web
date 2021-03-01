import { SsAction } from '../SsAction';
import { SsObject } from '../SsObject';
import { SsRequest, SsRequestType } from '../SsRequest';
import { Lifetime } from '../../core';

// Lifetime mock
const ltMock = {
  add: (_disp: any) => {},
} as unknown as Lifetime;

function newAction(requests: SsRequest[]): SsAction<number> {
  const obj = {
    id: 88,
    makeRequest: (rq: SsRequest) => {
      requests.push(rq);
    }
  }
  return new SsAction(
    obj as unknown as SsObject,
    'act',
    Number
  );
}

test('SsAction fires request', () => {
  const requests: SsRequest[] = [];
  const act = newAction(requests);
  act.fire(7);
  expect(requests).toEqual([
    {
      method: SsRequestType.Fire,
      objId: 88,
      member: 'act',
      value: 7,
    } as SsRequest,
  ]);
});

test('SsAction fires to local subscribers', () => {
  const act = newAction([]);
  const values: any[] = [];
  act.subscribe(ltMock, value => {
    values.push(value);
  });
  act.fire(7);
  act.fire(3);
  act.fire(3);
  expect(values).toEqual([7, 3, 3]);
});
