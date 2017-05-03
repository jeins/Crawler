/*
db.restaurants.createIndex( { "coordinates": "2d" } )
db.restaurants.aggregate([
    { "$geoNear":  {
          "near" : [52.513668,13.4935073], 
          "num" : 10, 
          "spherical" : true,  
          "maxDistance" :100,
          "distanceField": "calculated"
     }},
     { "$sort": { "calculated": 1 } },
])

















*/