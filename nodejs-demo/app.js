
/**
 * Module dependencies.
 */

var express = require('express');
var logger = require('morgan');
var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var session = require('express-session');
var serveStatic = require('serve-static');
var errorhandler = require('errorhandler');

var routes = require('./routes');
var user = require('./routes/user');
var search = require('./routes/search');
var apply = require('./routes/apply');
var movie = require('./routes/movie');
var dashboard = require('./routes/dashboard');

var http = require('http');
var path = require('path');
var ejs = require('ejs');

var MongoStore = require("connect-mongostore")(session);

var store = new MongoStore({
  db: "session"
});


var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('ejs-mate'));

app.use(logger('tiny'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(methodOverride());
app.use(cookieParser('crms', {
  resave: true,
  saveUninitialized: false
}));

app.use(cookieSession({secret : 'crms'}));
app.use(session({
  secret : 'crms',
  store: store,
  cookie: { maxAge: 900 * 1000 }
}));

app.use(function(req, res, next){
  res.locals.user = req.session.user;
  var err = req.session.error;
  delete req.session.error;
  res.locals.message = '';
  if(err) {
    res.locals.message = '<div class="alert alert-error">' + err + '</div>';
  }
  next();
});

app.use(serveStatic(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(errorhandler());
}

app.get('/', routes.index);
app.get('/index', routes.index);
app.get('/users', user.list);
app.all('/login', notAuthentication);
app.get('/login', routes.login);
app.post('/login', routes.doLogin);
app.get('/logout', authenticaiton);
app.get('/logout', routes.logout);
app.all('/signup', notAuthentication);
app.get('/signup', routes.signup);
app.post('/signup', routes.doSignup);

app.all('/dashboard', authenticaiton);
app.get('/dashboard', dashboard.dashboard);
app.post('/dashboard/roomAdd',dashboard.roomAdd);

app.all('/apply', authenticaiton);
app.get('/apply', apply.apply);
app.post('/apply/add', apply.applyAdd);

app.all('/search', authenticaiton);
app.get('/search', search.search);


app.get('/home', authenticaiton);
app.get('/home', routes.home);
// app.get('/apply', routes.apply);

app.get('/movie/add',movie.movieAdd);//增加
app.post('/movie/add',movie.doMovieAdd);//提交
// app.get('/movie/:name',movie.movieAdd);//编辑查询
// app.get('/movie/json/:name',movie.movieJSON);//JSON数据

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

function authenticaiton(req, res, next) {
  if(!req.session.user) {
    req.session.error = '请先登录！';
    return res.redirect('/login');
  }
  next();
}

function notAuthentication(req, res, next) {
  if(req.session.user) {
    req.session.error = '已登录!';
    return res.redirect('/');
  }
  next();
}