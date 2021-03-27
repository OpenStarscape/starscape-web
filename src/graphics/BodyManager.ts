import * as THREE from 'three';
import { SsObject, SsSet } from "../protocol";
import { Lifetime } from "../core";
import { Body, Celestial, Ship } from "../graphics/Body";

/// Keeps track of creating and destroying bodies in the 3D scene.
export default class BodyManager {
  private readonly bodyMap = new Map<SsObject, Body>();
  private readonly nameMap = new Map<string, Body[]>();

  constructor(
    readonly lt: Lifetime,
    readonly scene: THREE.Scene,
    readonly god: SsObject,
    scale: number,
  ) {
    // Will attach itself to the lifetime, no need to hold a reference
    const bodyListProp = this.god.property('bodies', {arrayOf: SsObject});
    new SsSet(bodyListProp, this.lt, (itemLt, obj) => {
      obj.property('class', String).getThen(itemLt, cls => {
        let body: Body;
        if (cls === 'celestial') {
          body = new Celestial(scene, obj, scale);
        } else if (cls === 'ship') {
          body = new Ship(scene, obj, scale);
        } else {
          console.error('unknown body class ', cls);
          return;
        }
        this.bodyMap.set(obj, body);
        obj.property('name', {nullable: String}).subscribe(itemLt, (name: any) => {
          this.setBodyName(body, name);
        });
        itemLt.addCallback(() => {
          body.dispose();
          this.setBodyName(body, null);
          this.bodyMap.delete(obj);
        });
      });
    });
  }

  /// Unlinks the body from the current name and links it to the new name. Current or new name can
  /// be null.
  setBodyName(body: Body, name: string | null) {
    const old = body.getName();
    if (old !== null) {
      // if the body already had a name we need to remove it
      const array = this.nameMap.get(old);
      if (array !== undefined) {
        if (array.length === 1) {
          // there's only one body (presumably the one we want to remove)
          // remove the map entry
          this.nameMap.delete(old);
        } else {
          // there's multiple bodies, remove the relevant one but leave the map entry in place
          const index = array.indexOf(body);
          array.splice(index, 1);
        }
      }
    }
    body.setName(name);
    // Only add it to the map if it's not null
    if (name !== null) {
      const array = this.nameMap.get(name);
      if (array === undefined) {
        // Set the name to map to an array with just the one body
        this.nameMap.set(name, [body]);
      } else {
        // Append to the array (multiple bodies with the same name)
        array.push(body);
      }
    }
  }

  get(obj: SsObject | null | undefined): Body | undefined {
    return obj ? this.bodyMap.get(obj) : undefined;
  }

  /// If there is exactly one body with the given name return it, else return undefined
  getByName(name: string): Body | undefined {
    const bodies = this.nameMap.get(name);
    if (bodies === undefined || bodies.length !== 1) {
      return undefined;
    } else {
      return bodies[0];
    }
  }

  update(cameraPosition: THREE.Vector3) {
    for (const body of this.bodyMap.values()) {
      body.update(cameraPosition);
    }
  }
}
