// Defines the routes and params name that will be passed in req.params 
// routes tell Koop what controller method should handle what request route

module.exports = {
  // route : handler
  'post /wfs': 'register',
  'get /wfs': 'index',
  'get /wfs/:id/:typename/FeatureServer': 'featureserver',
  'get /wfs/:id/:typename/FeatureServer/:layer': 'featureserver',
  'get /wfs/:id/:typename/FeatureServer/:layer/:method': 'featureserver',
  
}
