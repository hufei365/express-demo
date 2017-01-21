var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'what?',
    user:{a:1} ,
    success:'{suceess }',
    body:'<div style="background:red;">TItlek , sdfjj </div>'
  });
});

module.exports = router;
