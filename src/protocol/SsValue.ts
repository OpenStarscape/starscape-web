import { Vec3, RuntimeType } from '../core'
import { SsObject } from './SsObject'

export type SsValue =
  null |
  boolean |
  number |
  string |
  SsObject |
  SsValue[] |
  Vec3;

export type SsValueRuntimeType =
  RuntimeType & (
    null |
    BooleanConstructor |
    NumberConstructor |
    StringConstructor |
    {arrayOf: SsValueRuntimeType} |
    {nullable: SsValueRuntimeType} |
    (new (...args: any[]) => SsObject) |
    (new (...args: any[]) => Vec3) |
    Array<SsValueRuntimeType>
  );
