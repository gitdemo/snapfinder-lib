exports.connect = connect;
exports.findStoresInRange = findStoresInRange;
exports.findStoresInZip = findStoresInZip;
exports.sortStoresByDistance = sortStoresByDistance;

var snapdb = require('./lib/snapdb')
  , geo = require('./lib/geo')
  ;

/**
 * Connect to the snapdb mongo database.
 */
function connect(mongodbUri, function (err, client) {
  snapdb.connect(mongodbUri, function (err, client) {
    if (err) return callback(err);
    callback(null, client);
  });
});

/**
 * Find nearby stores in ascending distance order.
 * @param address a valid address, address fragment, or pair of coordinates
 * @param range a distance in miles, defaults to 3
 */
function findStoresInRange(address, range, callback) {
  range = range || 3;

  geo.geocode(address, function(err, georesult) {
    if (err) return callback(err);

    snapdb.findStoresInRange(georesult.location, range, function(err, stores) {
      if (err) return callback(err);

      var sorted = sortStoresByDistance(georesult.location, stores);
      georesult.stores = _.filter(sorted, function(store) {
        return store.distance <= range;
      });
      return callback(null, georesult);
    });
  });
}
  
/**
 * Find stores within a zip code.
 * @param address a valid address, address fragment, or pair of coordinates
 */
function findStoresInZip(address, callback) {
  geo.geocode(address, function(err, georesult) {
    if (err) return callback(err);

    snapdb.findStoresInZip(georesult.zip5, function(err, stores) {
      if (err) return callback(err);
      georesult.stores = stores;
      return callback(null, georesult);
    });
  });
}

/**
 * Sorts the stores array in distance order from location, and also returns it.
 * @param location an object with lat and lng properties
 * @param stores an array of store objects
 */
function sortStoresByDistance(location, stores) {
  var i, s;

  for (i = 0; i < stores.length; i++) {
    s = stores[i];
    s.distance = geo.getDistanceInMiles(location,
        { lat:s.latitude, lng:s.longitude });
  }

  stores.sort(function(a,b) { return a.distance - b.distance; });
  return stores;
}

