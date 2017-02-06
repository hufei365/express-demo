var mysql = require('mysql');
var conf = require('../conf/db');


var pool  = mysql.createPool( conf.mysql);


module.exports = pool;
