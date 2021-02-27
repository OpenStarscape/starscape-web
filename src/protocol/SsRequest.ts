import { SsValue } from './SsValue'

export enum SsRequestType {
  Set,
  Get,
  Fire,
  Subscribe,
  Unsubscribe,
}

export interface SsRequest {
  method: SsRequestType,
  objId: number,
  member: string,
  value?: SsValue,
}
