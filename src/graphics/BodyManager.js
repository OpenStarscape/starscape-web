import StarscapeSet from "../lib/StarscapeSet.js";
import { makeBody } from "../graphics/Body.js";

/// Keeps track of creating and destroying bodies in the 3D scene.
export default class BodyManager {
  constructor(lifetime, scene, god) {
    this.lt = lifetime;
    this.scene = scene;
    this.god = god;
    this.bodyMap = new Map();
    this.nameMap = new Map(); // body names map to arrays of bodies
    // Will attach itself to the lifetime, no need to hold a reference
    new StarscapeSet(this.god.property('bodies'), this.lt, (itemLt, obj) => {
      makeBody(itemLt, this.scene, obj, body => {
        this.bodyMap.set(obj, body);
        obj.property('name').subscribe(itemLt, name => {
          this.setBodyName(body, name);
        });
        itemLt.addCallback(() => {
          this.setBodyName(body, null);
          this.bodyMap.delete(obj);
        });
      });
    });
  }

  /// Unlinks the body from the current name and links it to the new name. Current or new name can
  /// be null.
  setBodyName(body, name) {
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
      if (this.nameMap.has(name)) {
        // Append to the array (multiple bodies with the same name)
        this.nameMap.get(name).push(body);
      } else {
        // Set the name to map to an array with just the one body
        this.nameMap.set(name, [body]);
      }
    }
  }

  get(obj) {
    return this.bodyMap.get(obj);
  }

  /// If there is exactly one body with the given name return it, else return null
  getByName(name) {
    const bodies = this.nameMap.get(name);
    if (bodies === undefined || bodies.length != 1) {
      return null;
    } else {
      return bodies[0];
    }
  }

  update(cameraPosition) {
    for (const body of this.bodyMap.values()) {
      body.update(cameraPosition);
    }
  }
}
