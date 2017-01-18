var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var session = require('express-session');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// session config
app.use(session({
  secret: '12345',
  name: 'testapp',   //这里的name值得是cookie的name，默认cookie的name是：connect.sid
  cookie: {maxAge: 80000 },  //设置maxAge是80000ms，即80s后session和相应的cookie失效过期
  resave: false,
  saveUninitialized: true,
}));
// session validate
 app.get('/awesome', function(req, res){

     if(req.session.lastPage) {
         console.log('Last page was: ' + req.session.lastPage + ".");
     }
     req.session.lastPage = '/awesome'; //每一次访问时，session对象的lastPage会自动的保存或更新内存中的session中去。
     res.send("You're Awesome. And the session expired time is: " + req.session.cookie.maxAge);
 });

 app.get('/radical', function(req, res){
     if (req.session.lastPage) {
         console.log('Last page was: ' + req.session.lastPage + ".");
     }
     req.session.lastPage = '/radical';
     res.send('What a radical visit! And the session expired time is: ' + req.session.cookie.maxAge);
 });

 app.get('/tubular', function(req, res){
     if (req.session.lastPage){
         console.log("Last page was: " + req.session.lastPage + ".");
     }

     req.session.lastPage = '/tubular';
     res.send('Are you a suffer? And the session expired time is: ' + req.session.cookie.maxAge);
 });


app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
