//express modules
const express = require('express');
const router = express.Router();
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');

//passport modules 
const passport = require('passport');
const LocalStrategy = require('passport-local');
const KakaoStrategy = require('passport-kakao');
const FacebookStrategy = require('passport-facebook');
const passwordHash = require('../libs/passwordHash');
const loginRequired = require('../libs/loginRequired');

//mongodb models
const UserModel = require('../models/admin/UserModel');
const MessageModel = require('../models/static/MessageModel');
const TeamModel = require('../models/team/TeamModel');
const GuestModel = require('../models/team/GuestModel');
const PickupModel = require('../models/game/PickupModel');
const ChallengeModel = require('../models/game/ChallengeModel');

//multer

const uploadDir = path.join(__dirname, '../uploads/accounts');
const storage  = multer.diskStorage({
    destination : (req, file, callback) =>{
        callback(null, uploadDir);
    },
    filename : (req, file, callback) =>{
        callback(null, 'accounts' + Date.now() + '.'+ file.mimetype.split('/')[1])
    }
})
const upload = multer({storage : storage});


//passport session
passport.serializeUser((user, done)=>{
  done(null, user);
});

passport.deserializeUser((user, done)=>{
  done(null, user);
});

passport.use(new LocalStrategy({
        usernameField: 'username',
        passwordField : 'password',
        passReqToCallback : true
    },
    function (req, username, password, done) {
        UserModel.findOne({ username : username , password : passwordHash(password) , deleted : false, auth : true}, function (err, user) {
            if (!user){
                return done(null, false, {message : 'login error happens'});
            }else{
                return done(null, user);
            }
        });
      },
));

router.get('/login', (req, res)=>{
      res.render('accounts/accounts/login', { flashMessage : req.flash().error });
  });
  
  router.post('/login',
      passport.authenticate('local', {
          failureRedirect: '/accounts/login',
          failureFlash: true,
      }),
      (req, res)=>{
          res.redirect('/');
      }
  );
  

  passport.use(new KakaoStrategy({
    clientID: '5311f303e49dd2b9ef63e4a31ae775c0',
    callbackURL: 'http://localhost:8080/accounts/oauth/kakao/callback',
}, function(accessToken, refreshToken, profile, done){
    UserModel.findOne({username : profile.id, auth_type : 'kakao'}, (err, user)=>{
        if(err){
            return done(err);
        }
        else if(!user){
    const User = new UserModel({
            name: profile.username,
            username: profile.id,
            auth_type : 'kakao_password',
            roles : ['authenticated'],
            auth_type : 'kakao',
            provider: 'kakao',
            kakao: profile._json,
            });
            User.save((err)=>{
                if(err) console.error(err);
                return done(null, user);
            });
        }else{
            return done(null, user);
        }
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: '1757285137913725',
    clientSecret: 'e363434a4de06d8b3d931b88f8e86f45',
    callbackURL: 'http://localhost:8080/accounts/oauth/facebook/callback',
    profileFields: ['id', 'email', 'gender', 'link', 'locale', 'name', 'timezone',
      'updated_time', 'verified', 'displayName']
  }, function (accessToken, refreshToken, profile, done){
    const _profile = profile._json;
    UserModel.findOne({username : _profile.id, auth_type : 'facebook'}, (err, user)=>{
      if(err){
        return done(err);
      } else if(!user){
    const User = new UserModel ({
      username: _profile.id,
      name : _profile.name,
      email : _profile.id,
      auth_type : 'facebook'
      })
      User.save((err)=>{
        if(err) console.error(err)
        return done(null, user);
      });
          } else {
        return done(null, user)
      }
    });
  }
));

router.get('/kakao', passport.authenticate('kakao'));
router.get('/oauth/kakao/callback', passport.authenticate('kakao', {
    successRedirect : '/',
    failureRedirect : '/'
}));

  router.get('/facebook', passport.authenticate('facebook'));

  router.get('/oauth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/fail' }),
    (req, res)=>{
      res.redirect('/');
    });


router.get('/logout', (req, res)=>{
    req.logout();
    res.redirect('/');
});

router.post('/username/auth', (req, res)=>{
  UserModel.findOne({username : req.body.username}, (err, user)=>{
    if(!user){
      res.json({message : 1});
    } else {
      res.json({message : 0});
    }
  });
});

router.get('/register', (req, res)=>{
  res.render('accounts/accounts/join');
});

router.post('/register', upload.single('thumbnail'), (req, res)=>{
  const profile = {
    name : req.body.name,
    height : req.body.height,
    weight : req.body.weight,
    thumbnail : (req.file) ? req.file.filename : "",
    addr : req.body.addr,
    addr_detail : req.body.addr_detail,
    position : req.body.position,
    phone : req.body.phone,
    email : req.body.email,
  }
  // console.log(req.body.phone);
  const User = new UserModel({
        username : req.body.username,
        password : passwordHash(req.body.password),
        profile : profile,
        "geometry.coordinates" : [req.body.x, req.body.y],
      });
  User.save((err)=>{
  if(err) console.error(err);
    res.redirect('/');
  });
});

router.get('/delete', loginRequired, async (req, res)=>{
  try {
  const team = await TeamModel.find({members : {$in : [req.user._id]}});
  if(team.leader == req.user._id) {
    res.send(`<script>alert("you have to dismiss your team first!");location.href="/team/home/${team.name}"</script>`)
  }
  await TeamModel.update({name : team.name}, {$pull : {members : req.user._id}});
  await UserModel.update({_id : req.user._id}, {$set : {deleted : true}})
    req.logout();
    res.redirect('/');     
  } catch(err) {
    if(err) console.error(err);
  }
});

router.get('/logout', (req, res)=>{
  req.logout();
  res.redirect('/');
});

router.get('/profile', loginRequired, (req, res)=>{
UserModel.findOne({username : req.user.username}, (err, profile)=>{
  if(err) console.error(err);
  if(!profile.profile){
    res.send('<script>alert("you have to regist your profile");location.href="/accounts/profile/register"</script>');
  } else {
    res.render('accounts/accounts/profile', {profile : profile.profile});
  }
});
});

router.get('/profile/edit', loginRequired, (req, res)=>{
UserModel.findOne({username : req.user.username}, (err, profile)=>{
  res.render('accounts/accounts/profileregist', {profile : profile.profile});
  });
});

router.post('/profile/edit', upload.single('thumbnail'), async (req, res)=>{
  const user = await UserModel.findOne({_id : req.user._id});
  var thumbnail = "";
  if(user.profile.thumbnail && user.profile.thumbnail != "") thumbnail = user.profile.thumbnail;
  const profile = {
      name : req.body.name,
      thumbnail : (req.file) ? req.file.filename : thumbnail,
      height : req.body.height,
      weight : req.body.weight,
      position : req.body.position,
      addr : req.body.addr,
      addr_detail : req.body.addr_detail,
    };
    const geometry = {
      type : "point",
      coordinates : [req.body.x, req.body.y]
    }
    UserModel.update({username : req.user.username}, {$set : {profile : profile, geometry : geometry}}, (err)=>{
    if(err) console.error(err)
      req.user.profile = profile;
      res.redirect('/');
  });
});

router.get('/profile/register', loginRequired, (req, res)=>{
  res.render('accounts/accounts/profileregist', {profile : ""});
});

router.post('/profile/register', loginRequired, upload.single('thumbnail'), (req, res)=>{
  const profile = {
    name : req.body.name,
    thumbnail : (req.file) ? req.file.filename : "",
    height : req.body.height,
    weight : req.body.weight,
    position : req.body.position,
    addr : req.body.addr,
    addr_detail : req.body.addr_detail,
  };
});

router.get('/message', loginRequired, async (req, res)=>{
  try{
    let page = 1;
    if(req.query.page) page = req.query.page;
    const limit = 10;
    const urlQuery = req._parsedUrl.query;
    const count = await MessageModel.countDocuments({to : req.query.name});
    const maxPage = Math.ceil(count/limit);
    const messages = await MessageModel.find({to : req.query.name}).populate('to').populate('from').sort({created_at : -1});
    res.render('accounts/message/home', {page : page, maxPage : maxPage, urlQuery : urlQuery, messages : messages});
  } catch(err){
    if(err) console.error(err);
  }
});

router.get('/message/content/:id', loginRequired, async (req, res)=>{

});

router.get('/schedule', loginRequired, async (req, res)=>{
  try {
    let training = [];
    let challenges = [];
    let guests = [];
    const team = await TeamModel.findOne({members : {$in : [req.user._id]}});
    if(team){
      challenges = await ChallengeModel.find({status : 1, $or : [{home : team._id}, {away : team._id}]});
      guests = await GuestModel.find({team : team._id});
      training = team.training;
    }
    const pickups = await PickupModel.find({members : {$in : [req.user._id]}});
    res.render('accounts/schedule/home', {challenges : challenges, guests : guests, pickups : pickups, training : training});
} catch (err) {
    if(err) console.error(err);
}
});

router.post('/username/auth', (req, res)=>{
  UserModel.findOne({username : req.body.username}, (err, user)=>{
    if(err) console.error;
    if(!user){
      res.json({message : 1});
    } else {
      res.json({message : 0});
    }
    });
});

router.get('/mail/auth/:id', async (req, res)=>{
  try{
    const user = await UserModel.findOne({username : req.params.id});
    if(!user){ 
      res.send('<script>alert("certification overdue");location.href="/"</script>')
    } else {
      await UserModel.update({username : req.params.id}, {$set : {auth : true}});
      res.redirect('/')
    }
  } catch(err){
    if(err) console.error(err);
  }
});

router.post('/email/check', async (req, res)=>{
  const email = req.body.email;
  console.log(email);
  const conf = await UserModel.findOne({'profile.email' : email});
  console.log(conf)
  if(conf) res.json({message : 0});
  if(!conf) res.json({message : 1});
});

router.post('/auth/email', function(req, res, next){
  try {
    console.log(req.body.email);
    let email = req.body.email;
    let id = req.body.id;
    let transporter = nodemailer.createTransport({
    service : 'gmail',
    auth : {
      user : 'hoops.nation.kr@gmail.com',
      pass : '$kpc100400'
    }
  });
  
  let mailOptions = {
    from : 'hoops.nation.kr@gmail.com',
    to : email,
    subject : 'Hoops 아이디 인증 메일',
    text : `
    welcome to Hoops nation!
    please certificate your id click the url below
    http://127.0.0.1:8080/accounts/mail/auth/${id}`,
  };
  transporter.sendMail(mailOptions, function(err, info){
    if(err) console.error(err);
    console.log('email sent : ' + info.response);
  });
  res.json({message : email});
  } catch (err) {
    if(err) console.error(err);
  }
});

router.get('/password/find', (req, res)=>{
  res.render('accounts/accounts/pwd');
});

router.post('/password/find', async(req, res)=>{
  try{

    const user = await UserModel.findOne({'profile.email' : req.body.email});
    if(!user) {
      // res.redirect('/')
      res.send('<script>alert("there is no such email");location.href="/accounts/password/find"</script>');
    }
    const tempPwd = 'temp' + Date.now();
    const query = {
      password : passwordHash(tempPwd),
    };
    await UserModel.update({'profile.email' : req.body.email}, {$set : query});
    let email = req.body.email;
    let transporter = nodemailer.createTransport({
      service : 'gmail',
      auth : {
        user : 'hoops.nation.kr@gmail.com',
        pass : '$kpc100400'
      }
    });
    
    let mailOptions = {
      from : 'hoops.nation.kr@gmail.com',
      to : email,
      subject : 'Hoops 아이디, 패스워드 확인 메일',
      text : `
        Hoops nation 입니다.

        ${user.profile.name}님의 id 는 ${user.username}이고
        ${user.profile.name}님의 새로운 패스워드는 ${tempPwd}입니다. 
      `,
    };
    transporter.sendMail(mailOptions, function(err, info){
      if(err) console.error(err);
      console.log('email sent : ' + info.response);
    });
    res.redirect('/accounts/login');
    // res.send('<script>alert("email was sent to your email");location.href="/accounts/login"<script>')
    } catch(err){
      if(err) console.error(err);
    }
  });
  
  function createSearch(queries){
  var findContent = {};
  if(queries.searchType && queries.searchText && queries.searchText.length >= 1){
    var searchTypes = queries.searchType.toLowerCase().split(",");
    var postQueries = [];
    if(searchTypes.indexOf("title")>=0){
      postQueries.push({title : {$regex : new RegExp(queries.searchText, "i")}});
    }
    if(searchTypes.indexOf("content")>=0){
      postQueries.push({content : {$regex : new RegExp(queries.searchText, "i")}});
    }
    if(postQueries.length>0) findContent = {$or:postQueries};
  }
  return { searchType : queries.searchType, searchText : queries.searchText, findContent : findContent}
}

module.exports = router;