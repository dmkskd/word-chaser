// Same Mercator projection as the original Europe basemap: scale 660,
// centre [10°, 51°], translated to [450, 325]. Coordinates are [lon, lat].
const radians = Math.PI / 180;
const mercatorY = latitude => Math.log(Math.tan(Math.PI / 4 + latitude * radians / 2));
export function project([longitude, latitude]) {
  return [450 + 660 * (longitude - 10) * radians, 325 + 660 * (mercatorY(51) - mercatorY(latitude))];
}
export function placePoint(place) {
  return place.coordinates ? project(place.coordinates) : [place.x, place.y];
}
export function evidencePoint(node, catalog, scale = 1) {
  const anchor = placePoint(catalog.places[node.placeId]);
  return anchor.map((value, index) => value + node.offset[index] + (node.displayOffset?.[index] || 0) * scale);
}
