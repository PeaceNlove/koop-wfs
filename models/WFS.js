var request = require('request');

var WFS = function( koop ){

  var wfs = {};
  wfs.__proto__ = koop.BaseModel( koop );
  
  // adds a service to the Cache.db
  // needs a host, generates an id 
  wfs.register = function (id, host, version, epsg, callback) {
    var type = 'wfs:url';
    koop.Cache.db.serviceCount( type, function (error, count) {
      id = id || count++;
	  host = JSON.stringify({'host': host,  'version': version, 'epsg': epsg});
      koop.Cache.db.serviceRegister( type, {'id': id, 'host': host},  function (err, success) {
        callback( err, id );
      });
    });
  };
  // get service by id, no id == return all
  wfs.find = function( id, typename, options,callback ){
	  var options = options;
	  
    koop.Cache.db.serviceGet( 'wfs:url', parseInt(id) || id, function(err, res){
		
      if (err){
        callback('No service table found for that id. ', null);
      } else {
        var type = 'WFS';
		var dbId = id+":"+typename;
		var hostObject = JSON.parse(res.host);
		var host  = hostObject.host;
		var version = hostObject.version;
		var epsg = hostObject.epsg;
		// check the cache for data with this type & id 
		koop.Cache.get( type, dbId, options, function(err, entry ){
			
		  if ( err){
			// if we get an err then get the data and insert it 
			var datacallback;
			var url = host; // <-- change this to point to a real URL
			url += 'service=wfs&version='+version;
			url += '&REQUEST=GetFeature&typeNames='+ typename;
			url += '&SRSNAME='+ epsg;
			url += '&outputformat=json'
		    //http://geodata.nationaalgeoregister.nl/inspireadressen/wfs?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=inspireadressen:inspireadressen&SRSNAME=EPSG:28992&outputformat=json
			var page = 0;
			var total = 0;
			
			datacallback = function( dataerr, datasuccess){
				
				json = JSON.parse(datasuccess.body);
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
						  koop.Cache.get( type, dbId, options, function(err, entry ){
							  if (entry){callback( null, entry );}
						  });
							  
						}
					}
				});
				
			}
			request.get(url, function(e, res){
				console.log(url);
				datacallback(e,res);
			});
			
		  } else {
			callback( null, entry );
		  }
		});
      }
    });
  };
  

  
  
  return wfs;

};

module.exports = WFS;
