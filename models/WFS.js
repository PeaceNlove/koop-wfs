var request = require('request');

var WFS = function( koop ){

  var wfs = {};
  wfs.__proto__ = koop.BaseModel( koop );
  
  // adds a service to the Cache.db
  // needs a host, generates an id 
  wfs.register = function (id, host, version, epsg, filter, callback) {
    var type = 'wfs:url';
    koop.Cache.db.serviceCount( type, function (error, count) {
      id = id || count++;
	  host = JSON.stringify({'host': host,  'version': version, 'epsg': epsg,'filter': filter});
      koop.Cache.db.serviceRegister( type, {'id': id, 'host': host},  function (err, success) {
        callback( err, id );
      });
    });
  };
  wfs.prepFeatureserver = function(id, typename, options,callback ){
   if(Object.keys(options).length>0){
	   callback( "Tried to prepare a featureserver with options", null );
   }
   else{		   
	var type = 'WFS';
	var dbId = id+":"+typename;
	
	var opts = {"limit":1};
	koop.Cache.get( type, dbId, opts, function(err, entry ){
		if(err){
			wfs.find(id, typename, options,callback);
		}
		else{
			 var entry = entry;
			 var table = type + ':' + dbId+':0';
			 koop.Cache.getExtent(table, options, function(err, extent){
				 var feature = entry[0].features[0];
				 //create some dummy features whose extent covers the whole extent. TODO MultiLineStirng &MP
				 debugger;
				 if (feature.geometry.type==="Point"){
					 entry[0].features.push(JSON.parse(JSON.stringify(entry[0].features[0])));
					 entry[0].features[0].geometry.coordinates[0] = extent.xmin;
					 entry[0].features[0].geometry.coordinates[1] = extent.ymin;
					 entry[0].features[1].geometry.coordinates[0] = extent.xmax;
					 entry[0].features[1].geometry.coordinates[1] = extent.ymax;								 
				 }
				 else if (feature.geometry.type==="LineString"){
					 entry[0].features[0].geometry.coordinates = [[extent.xmin,extent.ymin],[extent.xmax,extent.ymax]];
				 }
				 else if (feature.geometry.type==="MultiLineString"){
					 entry[0].features[0].geometry.coordinates = [[[extent.xmin,extent.ymin],[extent.xmax,extent.ymax]]];
				 }
				 else if (feature.geometry.type==="Polygon"){
					 entry[0].features[0].geometry.coordinates = [[ [extent.xmin,extent.ymin],[extent.xmax,extent.ymax], [extent.xmin,extent.ymax], [extent.xmin,extent.ymin] ]];								 
				 }
				 else if (feature.geometry.type==="MultiPolygon"){
					 entry[0].features[0].geometry.coordinates = [[[ [extent.xmin,extent.ymin],[extent.xmax,extent.ymax], [extent.xmin,extent.ymax], [extent.xmin,extent.ymin] ]]];								 
				 }
				 callback( null, entry );
			 });
		}
	});
   }
  }
  
  // get service by id, no id == return all
  wfs.find = function( id, typename, options,callback ){
	var options = options;
	var type = 'WFS';
	var dbId = id+":"+typename;

	// check the cache for data with this type & id
	if ( options && options.returnCountOnly){
		var table = type + ':' + dbId+':0';
		koop.Cache.getCount( table, options, function(err, entry ){
			var c = entry;
			var data = [{type: 'FeatureCollection',count: c}];
			callback( null, data );
		});
	}
	else{
		if(options && !options.hasOwnProperty("limit")){
			options["limit"] =1000;
		}
		koop.Cache.get( type, dbId, options, function(err, entry ){
			if ( err && err!=='Not Found'){
				wfs.queryWFS( id, typename, options,callback );
			}
			else {
				if (!entry && err==='Not Found'){entry = [{type: 'FeatureCollection',features: []}];}
				callback( null, entry );//todo check wat er gebeurt als er geen entry is?
			}
		});
	}
  };
  wfs.queryWFS = function(id, typename, options,callback ){
	var type = 'WFS';
	var dbId = id+":"+typename;
	koop.Cache.db.serviceGet( 'wfs:url', parseInt(id) || id, function(err, res){
		if(err){
			callback('No service table found for that id. ', null);
		} 
		else {
			var hostObject = JSON.parse(res.host);
			var host  = hostObject.host;
			var version = hostObject.version;
			var epsg = hostObject.epsg;
			var filter = hostObject.filter;  
			//if we get an err then get the data and insert it 
			var datacallback;
			var url = host; // <-- change this to point to a real URL
			url += 'service=wfs&version='+version;
			url += '&REQUEST=GetFeature&typeNames='+ typename;
			url += '&SRSNAME='+ epsg;
			url += '&outputformat=json'
			if(filter && filter!==null){
				url+= '&FILTER=' + filter;
			}
			//http://geodata.nationaalgeoregister.nl/inspireadressen/wfs?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=inspireadressen:inspireadressen&SRSNAME=EPSG:28992&outputformat=json
			var page = 0;
			var total = 0;

			datacallback = function( dataerr, datasuccess){
				try{
					json = JSON.parse(datasuccess.body);
					if(json.hasOwnProperty('features')){
						console.log("WFS found "+json.features.length+ " features");
						if (json.hasOwnProperty('totalFeatures')){
							total = json.totalFeatures;
						}
						else{
							total = json.features.length;
						}
						koop.Cache.insert( type, dbId, json, 0, function( err, success){
							if ( success ) {
								page += json.features.length;
								if (page< total){
									//page over features, check if WFS has support for it
									request.get(url+'&STARTINDEX=' + page, function(e, res){
										console.log(url+'&STARTINDEX=' + page);
										datacallback(e,res);
									});
								}
								else{								
									console.log(JSON.stringify(options));
								  koop.Cache.get( type, dbId, options, function(err, entry ){
									  if (!entry && err==='Not Found'){entry = [{type: 'FeatureCollection',features: []}];}
									  if (entry){callback( null, entry );}//todo check wat er gebeurt als er geen entry is?
								  });
									  
								}
							}
						});
					}
					else{
						callback( "No features in response", null );
					}
					
				}
				catch(e){
					callback( "No features in response", null );
				}
			}
			request.get(url, function(e, res){
				console.log(url);
				datacallback(e,res);
			});
		} 
	});
  }
  /*wfs.statistics = function( id, typename, options,callback ){
	  
	  var type = 'WFS';
	  var table = type + ':' + id+":"+typename+':0';
	  options.groupByFieldsForStatistics
	  var query  = "select feature->'properties'->>'"+options.groupByFieldsForStatistics+"'  as groupByFieldsForStatistics,  Count(feature->'properties'->>'"+options.groupByFieldsForStatistics+"') as count from \""+table+"\" group by groupByFieldsForStatistics";
	  
  }*/
  
  return wfs;

};

module.exports = WFS;
