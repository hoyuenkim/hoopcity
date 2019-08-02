//essential modules
const express = require('express');
const logger = require('morgan');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const moment = require('moment');
const co = require('co');
const passport = require('passport');
const session = require('express-session');
const flash = require('connect-flash');
const requestIp = require('request-ip');
const tz = require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");
const schedule = require('node-schedule');
const nodemailer = require('nodemailer');
const loginRequired = require('./libs/loginRequired');

const Youtube = require("youtube-api")
    , fs = require("fs")
    , readJson = require("r-json")
    , prettyBytes = require("pretty-bytes")
    ;

const CREDENTIALS = readJson(`${__dirname}/static/credentials.json`);

const mongoose = require('mongoose');

//express initialize
const app = express();
const port = 8080;

const options = {
  useNewUrlParser : true,
  reconnectTries : Number.MAX_VALUE,
  reconnectInterval : 500,
  poolSize : 10,
  bufferMaxEntries : 0,
  connectTimeoutMS : 10000,
  family : 4
}

//mongodb connection
const connect = mongoose.connect('mongodb://127.0.0.1:27017/hoops', options);

//mongodb models
const StandardModel = require('./models/StandardModel');
const UserModel = require('./models/admin/UserModel');
const TeamModel = require('./models/team/TeamModel');
const NoticeModel = require('./models/admin/NoticeModel');
const PickupModel = require('./models/game/PickupModel');
const RankModel = require('./models/team/RankModel');
const MediaModel = require('./models/static/MediaModel');
const MenuModel = require('./models/admin/MenuModel');
const MessageModel = require('./models/static/MessageModel');
const GuestModel = require('./models/team/GuestModel');
const FreetalkModel = require('./models/board/FreetalkModel');
const FunModel = require('./models/board/FunModel');
const ChallengeModel = require('./models/game/ChallengeModel');
const TestModel = require('./models/TestModel');
const TokenModel = require('./models/TokenModel');

//mongodb initialize
const db = mongoose.connection;
db.on('error', console.error);
db.once('open', function(){
  console.log('mongodb connected');
});

//mongodb session
const connectMongo = require('connect-mongo');
const MongoStore = connectMongo(session);

const sessionMiddleWare = session({
    secret: 'hykim',
    resave: true,
    saveUninitialized: false,
    cookie: {
      maxAge: 2000 * 60 * 60
    },
    store: new MongoStore({
        mongooseConnection: mongoose.connection,
        ttl: 14 * 24 * 60 * 60
    })
});

app.use(sessionMiddleWare);

//static setting
app.use('/static', express.static('static'));
app.use('/libs', express.static('libs'));
app.use('/uploads', express.static('uploads'));

//passport initialize
app.use(passport.initialize());
app.use(passport.session());

//flash modules
app.use(flash());

//login middleware
app.use(function(req, res, next){
  app.locals.isLogin = req.isAuthenticated();
  app.locals.userData = req.user;
  next();
});

//middleware setting
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(logger('dev'));
app.use(requestIp.mw())

//view setting
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//router
const accounts = require('./routes/accounts');
const admin = require('./routes/admin');
const game = require('./routes/game');
const team = require('./routes/team');
const board = require('./routes/board');
const ballers = require('./routes/ballers');
const static = require('./routes/static');
const lesson = require('./routes/lesson');

//router use
app.use('/accounts', accounts);
app.use('/admin', admin);
app.use('/game', game);
app.use('/team', team);
app.use('/board', board);
app.use('/ballers', ballers);
app.use('/static', static);
app.use('/lesson', lesson);

app.get('/', async (req, res)=>{
  let teammember = null;
  let messages;
  const now = new Date();
  const today = moment(now).tz("Asia/Seoul").format('YYYY-MM-DD HH:mm:ss');
  const yesterday = past();
  var yst = new Date(yesterday.past);
  if(req.user) teammember = await TeamModel.findOne({members : {$in : req.user._id}});
  if (req.user) messages = await MessageModel.find({to : req.user._id, views : false});
  const pickups = await PickupModel.find({date : {$gte : today}}).limit(5).sort({date : -1});
  const guests = await GuestModel.find({date : {$gte : today}}).limit(5).sort({date : -1});
  const notices = await NoticeModel.find().sort({created_at : -1}).limit(5);
  const ranks = await RankModel.find({deleted : false}).populate('team').sort({created_at : -1}).limit(5);
  const medias = await MediaModel.find().sort({created_at : -1}).limit(5);
  const menus = await MenuModel.find();
  const message = await MessageModel.find({views : false});
  console.log(req.session);
  await res.render('home', {teammember : teammember, notices, notices, pickups : pickups, ranks : ranks, medias : medias, menus : menus, message : message, guests : guests});
});


//schedule
schedule.scheduleJob('00 00 00 * * *', async ()=>{
  try{
    const ystday = past();
    await PickupModel.update({date : {$gte : ystday.past, $lt : ystday.today}}, {$set : {status : 2}});
    await GuestModel.update({date : {$gte : ystday.past, $lt : ystday.today}}, {$set : {status : 2}});
    await ChallengeModel.update({date : {$gte : ystday.past, $lt : ystday.today}}, {$set : {status : 2}});
    console.log(ystday);
  } catch(err){
    if(err) console.error(err);
  }
});
const Nightmare = require('nightmare')

app.get('/getToken', async (req, res)=>{
  let oauth = Youtube.authenticate({
    type: "oauth"
  , client_id: CREDENTIALS.web.client_id
  , client_secret: CREDENTIALS.web.client_secret
  , redirect_url: CREDENTIALS.web.redirect_uris[0]
  });

  const url = oauth.generateAuthUrl({
    access_type: "offline"
  , scope: ["https://www.googleapis.com/auth/youtube.upload"]
  });
  const nightmare = new Nightmare({show : true});
  nightmare
  .goto(url)
  .wait(1000)
  .type('input[name="identifier"]', 'hoops.nation.kr@gmail.com')
  .click('#identifierNext')
  .wait(2000)
  .type('input[name="password"]', '$kpc100400')
  .click('#passwordNext')
  .wait(10000)
  .end()
  .catch(err => {
    if(err) console.error(err)
  })
  .then(
    res.redirect('/')
  )
});

// Handle oauth2 callback
app.get('/oauth2callback', async (req, res)=>{
  let oauth = Youtube.authenticate({
    type: "oauth"
  , client_id: CREDENTIALS.web.client_id
  , client_secret: CREDENTIALS.web.client_secret
  , redirect_url: CREDENTIALS.web.redirect_uris[0]
  });
    oauth.getToken(req.query.code, async (err, tokens) => {
      console.log(tokens);
      if(err) console.error(err);
      const token = new TokenModel({
        tokens : tokens
      })
      token.save((err)=>{
        if(err) console.error(err);
        res.status(200).end();
      })
    });
});

app.get('/upload', async (req, res)=>{
  const oauth = await TokenModel.findOne();
  console.log(oauth);
  if(!oauth){
    res.redirect('/getToken');
  } else {
    res.render('upload')
  }
});

app.post('/upload', async (req, res)=>{
  const token = await TokenModel.findOne();
  let oauth = Youtube.authenticate({
    type: "oauth"
  , client_id: CREDENTIALS.web.client_id
  , client_secret: CREDENTIALS.web.client_secret
  , redirect_url: CREDENTIALS.web.redirect_uris[0]
  });
  oauth.setCredentials(token.tokens);
        var result = Youtube.videos.insert({
            resource: {
                // Video title and description
                snippet: {
                    title: "Testing YoutTube API NodeJS module"
                  , description: "Test video upload via YouTube API"
                }
                // I don't want to spam my subscribers
              , status: {
                    privacyStatus: "public"
                }
            }
            // This is for the callback function
          , part: "snippet,status"

            // Create the readable stream to upload the video
          , media: {
                body: fs.createReadStream("video.mp4")
            }
        }, async (err, data) => {
            if(err) console.error(err);
            await console.log(data);
            await res.redirect('/');
        })
        setInterval(function () {
            console.log(`${prettyBytes(result.req.connection._bytesDispatched)} bytes uploaded.`);
        }, 250)

})

schedule.scheduleJob('00 00 00 * * *', ()=>{
  UserModel.remove({auth : false}, (err)=>{
    if(err) console.error(err);
    console.log('unauthorized ids are deleted');
  });
});

schedule.scheduleJob('00 00 00 * * *', ()=>{
  let oauth = Youtube.authenticate({
    type: "oauth"
  , client_id: CREDENTIALS.web.client_id
  , client_secret: CREDENTIALS.web.client_secret
  , redirect_url: CREDENTIALS.web.redirect_uris[0]
  });

  const url = oauth.generateAuthUrl({
    access_type: "offline"
  , scope: ["https://www.googleapis.com/auth/youtube.upload"]
  });
  const nightmare = new Nightmare({show : true});
  nightmare
  .goto(url)
  .wait(1000)
  .type('input[name="identifier"]', 'hoops.nation.kr@gmail.com')
  .click('#identifierNext')
  .wait(2000)
  .type('input[name="password"]', '$kpc100400')
  .click('#passwordNext')
  .wait(10000)
  .end()
  .catch(err => {
    if(err) console.error(err)
  });
});

//port setting
app.listen(port, ()=>{
    console.log('server is running at ' + port + ' port');
});

function past(){
  var now = new Date();
  var today = moment(now).startOf('day');
  var past = moment(today).subtract(1, 'days');
  return {today : moment(today).tz("Asia/Seoul").format('YYYY-MM-DD'), past : moment(past).tz("Asia/Seoul").format('YYYY-MM-DD')};
}

function getMonthday(){
  var today = new Date(moment().startOf('day'));
  var todayday = new Date(moment().startOf('day')).getDate();
  var i = 0;
  var j = 0;
  var days = new Object();
  var startday;
  var endday;
  while(true){
    startday  = new Date(moment(today).subtract(i, 'days')).getDate();
    var firstDay = moment(today).subtract((i-1), 'days')
    if(startday === 1){
      break;
    }
    i++;
  }
  days.firstDay = firstDay.toDate();
  while(true){
    endday  = new Date(moment(today).add(j, 'days')).getDate();
    var lastDay = moment(today).add(j, 'days')
    if(endday === 1){
      break;
    }
    j++;
  }
  days.lastDay = lastDay.toDate();
  return days;
}

// const listen = require('socket.io');
// const io = listen(server);
// io.use(function(socket, next){
//   sessionMiddleWare(socket.request, socket.request.res, next);
// }); //io.use로 미들웨어를 작성합니다

// require('./libs/socketConnection')(io);
