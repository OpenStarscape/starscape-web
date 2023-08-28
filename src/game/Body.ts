import { SsObject } from '../protocol'
import { Lifetime, DependentLifetime, MappingConduit, LocalProperty } from '../core'
import { Game } from '../game'
import { Spatial } from './Spatial'
import { OrbitSpatial } from './OrbitSpatial'

export class Body {
  readonly name;
  readonly color;
  readonly size;
  readonly isSelected = new LocalProperty(false);
  private readonly spatialUsers = new Set<Lifetime>();
  private hasSpatialLt: DependentLifetime | null = null;
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
  }

  spatial(lt: Lifetime): Spatial {
    if (!this.spatialUsers.has(lt)) {
      this.spatialUsers.add(lt);
      lt.addCallback(() => {
        this.spatialUsers.delete(lt);
        if (!this.spatialUsers.size && this.hasSpatialLt) {
          this.hasSpatialLt.kill();
        }
      });
    }
    if (!this.hasSpatialLt) {
      this.hasSpatialLt = new DependentLifetime();
      this.hasSpatialLt.addCallback(() => {
        this.hasSpatialLt = null;
        this.cachedSpatial = null;
      });
      this.cachedSpatial = new OrbitSpatial(this.game, this.hasSpatialLt, this);
    }
    return this.cachedSpatial!;
  }
}
