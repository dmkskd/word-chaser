"""Regenerate bundled UK/Ireland detail from Natural Earth's public-domain 10m countries.
Usage: python3 scripts/build-uk-map.py /path/to/ne_10m_admin_0_countries.geojson
Source: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_admin_0_countries.geojson
No network requests are made by the game or normal build.
"""
import json, math, sys
from pathlib import Path

def project(p):
    lon,lat=p
    my=lambda v: math.log(math.tan(math.pi/4+math.radians(v)/2))
    return [450+660*math.radians(lon-10),325+660*(my(51)-my(lat))]
def simplify(points,tolerance=.06):
    if len(points)<3:return points
    a,b=points[0],points[-1];dx,dy=b[0]-a[0],b[1]-a[1];length=dx*dx+dy*dy
    def distance(p):
        t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length)) if length else 0
        return math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)
    index=max(range(1,len(points)-1),key=lambda i:distance(points[i]))
    return simplify(points[:index+1],tolerance)[:-1]+simplify(points[index:],tolerance) if distance(points[index])>tolerance else [a,b]
countries=[]
for f in json.loads(Path(sys.argv[1]).read_text())['features']:
    if f['properties']['ADMIN'] not in ['United Kingdom','Ireland']:continue
    polygons=f['geometry']['coordinates'] if f['geometry']['type']=='MultiPolygon' else [f['geometry']['coordinates']]
    paths=[]
    for polygon in polygons:
        for ring in polygon:
            if not any(-12<lon<3 and 49<lat<61 for lon,lat in ring):continue
            points=simplify([project(p) for p in ring])
            if len(points)<4:continue
            paths.append('M'+'L'.join(','.join(f'{v:.3f}' for v in p) for p in points)+'Z')
    countries.append({'name':f['properties']['ADMIN'],'path':''.join(paths)})
labels=[
 ('Manchester',[-2.2453,53.4808],'city'),('Grimsby',[-.0752,53.5675],'city'),
 ('Chester',[-2.8931,53.1934],'city'),('Derby',[-1.4768,52.9225],'city'),
 ('York',[-1.0827,53.9583],'city'),('London',[-.1276,51.5072],'city'),
 ('Edinburgh',[-3.1883,55.9533],'city'),('Cardiff',[-3.1791,51.4816],'city'),
 ('Glasgow',[-4.2518, 55.8642],'city'),
 ('Sandwich',[1.337, 51.274],'city'),
 ('Exeter',[-3.534, 50.718],'city'),
 ('Devon',[-3.6, 51.0],'region'),
 ('Cornwall',[-5.0, 50.25],'region'),
 ('Kent',[0.8, 51.1],'region'),
 ('Yorkshire',[-1.6,54.35],'region'),('Lincolnshire',[-.2,53.15],'region'),
 ('Lancashire',[-2.65,54.05],'region'),('Scotland',[-4.1,57],'region'),
 ('Wales',[-3.8,52.3],'region'),('England',[-1.5,51.9],'region')]
result={'source':'Natural Earth 1:10m admin 0 countries, public domain; simplified in the existing Europe projection. Town coordinates are approximate centres; regional labels are representative, not boundaries.','countries':countries,'labels':[{'text':name,'coordinates':point,'kind':kind} for name,point,kind in labels]}
Path('data/uk-map.json').write_text(json.dumps(result,separators=(',',':'))+'\n')
print('Generated UK/Ireland detail:',len(result['countries']),'outlines,',len(result['labels']),'labels')
