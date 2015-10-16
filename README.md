# koop-wfs provider 

## A provider for serving OGC WFS services as FeatureService 


------------

This provider consumes all data from a WFS service and makes it available as a FeatureService.
A suitable WFS for this requires:

1. JSON as allowed output format

2. ImplementsResultPaging set to True (preferred, it also works without paging in some cases)

For example:
http://geodata.nationaalgeoregister.nl/bestuurlijkegrenzen/wfs?

1: Register the url http://geodata.nationaalgeoregister.nl/bestuurlijkegrenzen/wfs? with koop-wfs by posting 
{"id":"bestuurlijkegrenzen","host":"http://geodata.nationaalgeoregister.nl/bestuurlijkegrenzen/wfs?", "version": "1.0.0", "epsg": "EPSG:4326"} to http://localhost:1337/wfs/register

2: Open the Featureservice using this url
http://localhost:1337/wfs/bestuurlijkegrenzen/bestuurlijkegrenzen:gemeenten/FeatureServer/0

This provider can work with datasets with up to 300,000 features. There is however one limitation: statistics will be calculated on the first 1000 features. I'm still working on a solution to calculate statistics on the whole dataset.
You also need my modified pg-cache module which handles the spatial queries on the geometry column instead of the json if you would like to do WFS with large 


This is still in development and therefore the way the WFS is registered is very likely to change.
