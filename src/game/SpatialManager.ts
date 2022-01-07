import { SsObject } from "../protocol";
import { Lifetime, DependentLifetime, Conduit, Subscriber } from "../core";
import { OrbitSpatial } from "./OrbitSpatial";
import { Spatial } from "./Spatial";
import type { Game } from "./Game";

/// Used for tracking how long a spatial is in use
class SpatialUserTracker extends Conduit<null> {
  public spatial: Spatial | null = null;

  lifetime(): DependentLifetime {
    return this.hasSubscribersLt!;
  }

  protected initialSubscriberAdded(_hasSubscribersLt: DependentLifetime): void {}
  protected subscriberAdded(_subscriber: Subscriber<null>): void {}
}

/// Keeps track of spatials for bodies
export class SpatialManager {
  private readonly spatialMap = new Map<SsObject, SpatialUserTracker>();

  constructor(private readonly game: Game) {}

  spatialFor(lt: Lifetime, body: SsObject): Spatial {
    let tracker = this.spatialMap.get(body);
    if (tracker === undefined) {
      tracker = new SpatialUserTracker();
      this.spatialMap.set(body, tracker);
    }
    tracker.subscribe(lt, () => {});
    if (tracker.spatial === null) {
      tracker.spatial = new OrbitSpatial(this.game, tracker.lifetime(), body);
      tracker.lifetime().addCallback(() => {
        this.spatialMap.delete(body);
      });
      body.addDependent(tracker.lifetime());
    }
    return tracker.spatial!;
  }
}
