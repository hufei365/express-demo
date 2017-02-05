var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  console.log('-----------\n---------------\n');
  //res.render('index');
  res.redirect('/index');
});

module.exports = router;
