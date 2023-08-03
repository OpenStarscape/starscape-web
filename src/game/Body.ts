import { SsObject } from '../protocol'
import { Lifetime, MappingConduit, LocalProperty } from '../core'
import { Game } from '../game'
import { Spatial } from './Spatial'
import { OrbitSpatial } from './OrbitSpatial'

export class Body {
  readonly name;
  readonly color;
  readonly size;
  readonly isSelected = new LocalProperty(false);
  private readonly spatialUserTracker;
  private cachedSpatial: Spatial | null = null;

  constructor(
    readonly game: Game,
    readonly obj: SsObject,
  ) {
    this.name = obj.property('name', {nullable: String});
    this.color = new MappingConduit((lt: Lifetime, setter: (value: string) => void) => {
      setter('#ffffff');
      obj.property('color', {nullable: String}).subscribe(lt, color => {
        setter(color || '#ffffff');
      });
    })
    this.size = obj.property('size', Number);
    // Create the spatial when it is needed, clear it when all users are dead
    this.spatialUserTracker = new MappingConduit<void>((lt, _setter) => {
      this.cachedSpatial = new OrbitSpatial(this.game, lt, this);
      lt.addCallback(() => {
        this.cachedSpatial = null;
      });
    });
  }

  spatial(lt: Lifetime): Spatial {
    this.spatialUserTracker.subscribe(lt, () => {});
    // cache.spatial will always have a value when spatialUserTracker has subscribers
    return this.cachedSpatial!;
  }
}
