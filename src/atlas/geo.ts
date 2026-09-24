// Loads the base map (coastlines, borders, rivers, beaches) from
// public/data/geo.topo.json, built by scripts/build-geo.mjs.
import { feature } from 'topojson-client';
import type { Topology, GeometryObject } from 'topojson-specification';
import type { Geometry, MultiLineString, MultiPolygon, FeatureCollection, LineString } from 'geojson';
import type { LonLat, RingKey } from '../data/types';
import { withBase } from '../lib/url';
import { coastline, densifyCuts } from './coast';

export interface Geo {
  world: MultiPolygon;
  borders: MultiLineString;
  france: MultiPolygon;
  others: MultiPolygon;
  /** Coastline of `others`, without the straight edges where it was cut out of the world */
  othersCoast: MultiLineString;
  rivers: MultiLineString;
  riversMinor: MultiLineString;
  beaches: Record<RingKey, LonLat[]>;
}

export const GEO_URL = withBase('data/geo.topo.json');

export async function loadGeo(url = GEO_URL): Promise<Geo> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Map data failed to load (${res.status})`);
  const topo = (await res.json()) as Topology;
  const geom = <T extends Geometry>(name: string) =>
    (feature(topo, topo.objects[name] as GeometryObject) as unknown as { geometry: T }).geometry;
  const beachFc = feature(topo, topo.objects.beaches as GeometryObject) as unknown as FeatureCollection<LineString>;
  const beaches = {} as Record<RingKey, LonLat[]>;
  for (const f of beachFc.features) beaches[f.id as RingKey] = f.geometry.coordinates as LonLat[];
  return {
    world: geom<MultiPolygon>('world'),
    borders: geom<MultiLineString>('borders'),
    france: geom<MultiPolygon>('france'),
    others: densifyCuts(geom<MultiPolygon>('others')),
    othersCoast: coastline(geom<MultiPolygon>('others')),
    rivers: geom<MultiLineString>('rivers'),
    riversMinor: geom<MultiLineString>('riversMinor'),
    beaches
  };
}

