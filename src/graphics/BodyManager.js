import StarscapeSet from "../lib/StarscapeSet.js";
import { makeBody } from "../graphics/Body.js";

/// Keeps track of creating and destroying bodies in the 3D scene.
export default class BodyManager {
  constructor(lifetime, scene, god) {
    this.lt = lifetime;
    this.scene = scene;
    this.god = god;
    this.bodyMap = new Map();
    // Will attach itself to the lifetime, no need to hold a reference
    new StarscapeSet(this.god.property('bodies'), this.lt, (itemLt, obj) => {
      makeBody(itemLt, this.scene, obj, body => {
        this.bodyMap.set(obj, body);
        itemLt.addCallback(() => {
          this.bodyMap.delete(obj);
        });
      });
    });
  }

  get(obj) {
    return this.bodyMap.get(obj);
  }
}
