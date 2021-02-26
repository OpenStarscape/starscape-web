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
