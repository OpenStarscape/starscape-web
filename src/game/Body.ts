import { SsObject } from '../protocol'
import { Lifetime, DependentLifetime, Subscriber, Conduit } from '../core'
import { Game } from '../game'
import { Spatial } from './Spatial'
import { OrbitSpatial } from './OrbitSpatial'

/// Creates a spatial when needed and holds onto it only as long as it has users
class SpatialCache extends Conduit<null> {
  public spatial: Spatial | null = null;

  constructor(
    private readonly game: Game,
    private readonly body: Body,
  ) {
    super();
  }

  protected initialSubscriberAdded(hasSubscribersLt: DependentLifetime): void {
    this.spatial = new OrbitSpatial(this.game, hasSubscribersLt, this.body);
    hasSubscribersLt.addCallback(() => {
      this.spatial = null;
    });
  }
  protected subscriberAdded(_subscriber: Subscriber<null>): void {}
}

export class Body {
  readonly name;
  readonly color;
  readonly size;
  private readonly cache;

  constructor(
    game: Game,
    readonly obj: SsObject,
  ) {
    this.name = obj.property('name', {nullable: String});
    this.color = obj.property('color', String);
    this.size = obj.property('size', Number);
    this.cache = new SpatialCache(game, this);
  }

  spatial(lt: Lifetime): Spatial {
    this.cache.subscribe(lt, () => {});
    // cache.spatial will always have a value when the cache has subscribers
    return this.cache.spatial!;
  }
}
