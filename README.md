# koop-wfs provider 

## A provider for serving OGC WFS services as FeatureService 


------------

This provider consumes all data from a WFS service and makes it available as a FeatureService.
A suitable WFS for this requires:
1. JSON as allowed output format
2. ImplementsResultPaging set to True 

For example:
http://geodata.nationaalgeoregister.nl/bestuurlijkegrenzen/wfs?

1: Register the url http://geodata.nationaalgeoregister.nl/bestuurlijkegrenzen/wfs? with jsonurl by posting 
{"id":"bestuurlijkegrenzen","host":"http://geodata.nationaalgeoregister.nl/bestuurlijkegrenzen/wfs?", "typename": "bestuurlijkegrenzen:gemeenten", "version": "1.0.0", "epsg": "EPSG:4326"} to http://localhost:1337/wfs

2: Open the Featureservice using this url
http://localhost:1337/wfs/bestuurlijkegrenzen/bestuurlijkegrenzen:gemeenten/FeatureServer/0

This is still in development and therefore the way the WFS is registered is very likely to change.
