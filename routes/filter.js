exports.authorize = function(req, res, next) {
  var url = req.originalUrl;
  if ( url != '/login' && !req.session.user_id) {
    res.redirect('/login');
  } else {
    next();
  }
}
