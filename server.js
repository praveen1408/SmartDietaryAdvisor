var express = require('express');
var app = express();

// Listen to port 80 http port
app.listen(80, function () {
  console.log('Listening for connections');
});

// Host the public folder app
app.use(express.static('app'));

var neo4j = require('neo4j-driver').v1;

app.get('/getRecipe', function (req, res, next) {
  console.log("Request");
  var driver = neo4j.driver("bolt://localhost", neo4j.auth.basic("neo4j", "foodstuff"));
  var session = driver.session();
  var query = "MATCH (n) WHERE rand() < 0.5 RETURN n.id as id, n.name as name, n.class as class, n.calorie as calorie,n.unit as unit LIMIT 10;"
  session.run(query)
    .then(function (result) {
      output = [];
      console.log("Returned " + result.records.length + " results");
      for (var i = 0; i < result.records.length; i++) {
        var tmpObj = {};
        tmpObj.id = result.records[i].get("id").low;
        tmpObj.name = result.records[i].get("name");
        tmpObj.class = result.records[i].get("class");
        tmpObj.calorie = result.records[i].get("calorie").low;
        tmpObj.unit = result.records[i].get("unit");
        output.push(tmpObj);
      }
      //console.log(output);
      res.json(output)
      session.close();
      driver.close();
    });
});
