import * as THREE from 'three'
import { SsObject } from './SsObject'

export type SsValue =
  null |
  boolean |
  number |
  string |
  SsObject |
  SsValue[] |
  THREE.Vector3;

export type SsValueRuntimeType =
  RuntimeType & (
    null |
    BooleanConstructor |
    NumberConstructor |
    StringConstructor |
    {arrayOf: SsValueRuntimeType} |
    {nullable: SsValueRuntimeType} |
    (new (...args: any[]) => SsObject) |
    (new (...args: any[]) => THREE.Vector3) |
    Array<SsValueRuntimeType>
  );
