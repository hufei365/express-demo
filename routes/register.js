var express = require('express');
var router = express.Router();

var dao = require('../dao/dao');

var jsonWrite = function (res, ret) {
	if(typeof ret === 'undefined') {
		res.json({
			code:'1',
			msg: '操作失败'
		});
	} else {
		res.json(ret);
	}
};

/* GET register  */
router.get('/', function(req, res, next) {
  res.render('register',{layout:false});
});

/* do register */
router.post('/', function(req, res, next) {
  var user_name=req.body.name;
  var password=req.body.password;
  console.log(user_name + '------' + password);

  dao.getConnection(function(err, connection) {

			// 建立连接，向表中插入值
			// 'INSERT INTO user(id, name, age) VALUES(0,?,?)',
			connection.query('INSERT INTO user(id, name, password) VALUES(0,?,?)', [user_name, password], function(err, result) {
				if(result) {
					result = {
						code: 0,
						msg:'增加成功'
					};
				}

        console.log(err);
        console.log(result);
				// 以json形式，把操作结果返回给前台页面
				jsonWrite(res, result);

				// 释放连接
				connection.release();
			});
		});

  //res.send('register success');


});

module.exports = router;
