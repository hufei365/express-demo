var express = require('express');
var bodyParser = require("body-parser");
var router = express.Router();

/* GET home page. */
router.get('/login', function(req, res, next) {
  res.render('login', {layout:false});
});

router.post('/login', function(req, res, next) {
  var user_name=req.body.name;
   var password=req.body.password;
   console.log("User name = "+user_name+", password is "+password);
   res.end("yes");


});

module.exports = router;
