//essential modules
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const paginate = require('mongoose-pagination');
const moment = require('moment');
const loginRequired = require('../libs/loginRequired');
const teamRequired = require('../libs/teamRequired');

//file uploads
const uploadDir = path.join(__dirname, '../uploads/games');
const storage = multer.diskStorage({
    destination : (req, file, callback)=>{
        callback(null, uploadDir);
    },
    filename : (req, file, callback)=>{
        callback(null, 'game' + Date.now() + '.'+ file.mimetype.split('/')[1])
    }
});
const upload = multer({storage : storage});

//mongoose models
// const LeagueModel = require('../models/game/LeagueModel');
const UserModel = require('../models/admin/UserModel');
const TeamModel = require('../models/team/TeamModel');
const PickupModel = require('../models/game/PickupModel');
// const ResultModel = require('../models/game/ResultModel');
const GuestModel = require('../models/team/GuestModel');
const RankModel = require('../models/team/RankModel');
const ChallengeModel = require('../models/game/ChallengeModel');
const CommentModel = require('../models/static/CommentModel');

router.get('/3on3', async (req, res)=>{
  try{
  var today = new Date(moment().startOf('day'));
  let page = 1;
  if(req.query.page) page = req.query.page;
  const limit = 10;
  const urlQuery = req._parsedUrl.query;
  const search = createSearch(req.query);
  const query = Object.assign(search.findContent, {date : {$gte :today}});
  const count = await PickupModel.countDocuments(query);
  const maxPage = Math.ceil(count/limit);
  const games = await PickupModel.find(query).populate('host').paginate(page, limit);
  res.render('game/3on3/home', {games : games, count : count, page : page, maxPage : maxPage, search : search, urlQuery : urlQuery});
  } catch(err){
    if(err) console.error(err);
  }
});

router.get('/3on3/match/:id', async (req, res)=>{
  try {
    let conf;
    const query = req.params.id;
    if(req.user) conf = await PickupModel.findOne({id : query, members : {$in : [req.user._id]}});
    const pickup = await PickupModel.findOne({id : query}).populate('members').populate('host');
    res.render('game/3on3/match', {pickup : pickup, conf : conf});
  } catch (err) {
    if(err) console.error(err);
  }
});

router.get('/3on3/join/:id', loginRequired, async (req, res)=>{
  PickupModel.update({id: req.params.id}, {$push : {members : req.user._id}}, (err)=>{
      if(err) console.error(err);
       res.redirect('/game/3on3/match/'+req.params.id);
  });
});

router.get('/3on3/cancel/:id', loginRequired, async (req, res)=>{
  PickupModel.update({id : req.params.id}, {$pull : {members : req.user._id}}, (err)=>{
    if(err) console.error(err);
    res.redirect('/game/3on3/match/'+req.params.id);
  }); 
});

router.get('/3on3/delete/:id', loginRequired, async (req, res)=>{
  PickupModel.remove({id : req.params.id}, (err)=>{
    if(err) console.error(err);
    res.redirect('/game/3on3');
  }); 
});

router.get('/3on3/regist', loginRequired, (req, res)=>{
  res.render('game/3on3/regist', {pickup : ""});
});

router.post('/3on3/regist', (req, res)=>{
  const game = new PickupModel({
    host : req.user._id,
    subject : req.body.subject,
    court : req.body.court,
    addr : req.body.addr,
    date : req.body.date,
    time : req.body.time,
    "geometry.cocoordinates" : [req.body.x, req.body.y],
    members : [req.user._id]
  });
  game.save((err)=>{
    if(err) console.error(err);
    res.redirect('/game/3on3')
  });
});

router.get('/3on3/edit/:id', loginRequired, async (req, res)=>{
  const pickup = await PickupModel.findOne({id : req.params.id});
  res.render('game/3on3/regist', {pickup : pickup});
});

router.post('/3on3/regist', (req, res)=>{
  const game = new PickupModel({
    host : req.user._id,
    subject : req.body.subject,
    court : req.body.court,
    addr : req.body.addr,
    date : req.body.date,
    time : req.body.time,
    "geometry.cocoordinates" : [req.body.x, req.body.y],
    members : [req.user._id]
  });
  game.save((err)=>{
    if(err) console.error(err);
    res.redirect('/game/3on3')
  });
});

router.get('/guest', async (req, res)=>{
  try{
    let page = 1;
    var today = new Date(moment().startOf('day'));
    if(req.query.page) page = req.query.page;
    const limit = 10;
    const urlQuery = req._parsedUrl.query;
    const search = createSearch(req.query);
    const query = Object.assign(search.findContent, {date : {$gte :today}});
    const count = await GuestModel.countDocuments(query);
    const maxPage = await Math.ceil(count/limit);
    const games = await GuestModel.find(query).populate('team').sort({date : -1}).paginate(page, limit);
    res.render('game/guest/home', {games : games, page : page, maxPage : maxPage, urlQuery : urlQuery, search : search});
    } catch(err){
      if(err) console.error(err);
    }
  });

router.get('/guest/match/:id', async (req, res)=>{
  try {
  let conf;
  const query = req.params.id;
  if(req.user) conf = await GuestModel.findOne({id : query, members : {$in : [req.user._id]}});
    const guest = await GuestModel.findOne({id : query}).populate('members').populate('team').populate('host');
      res.render('game/guest/match', {guest : guest, conf : conf});
  } catch (err){
    if(err) console.error(err);
  }
});

router.get('/guest/join/:id', loginRequired, async (req, res)=>{
  //참가비 시퀸스
  GuestModel.update({id : req.params.id}, {$push : {members : req.user._id}}, (err)=>{
    if(err) console.error(err);
    res.redirect('/game/guest/match/'+req.params.id);
  });
});

router.get('/guest/cancel/:id', (req, res)=>{
  GuestModel.update({id : req.params.id}, {$pull : {members : req.user._id}}, (err)=>{
    if(err) console.error(err)(err);
    res.redirect('/game/guest/match/'+req.params.id);
  });
});

router.get('/guest/delete/:id', loginRequired, async (req, res)=>{
  GuestModel.remove({id : req.params.id}, (err)=>{
    if(err) console.error(err)(err);
    res.redirect('/game/guest');
  }); 
});

router.get('/challenge', async (req, res)=>{
  try{
    let page = 1;
    let conf
    let today = moment().startOf('day');
    let weekday = getWeekEndday().toDate();
    if(req.query.page) page = req.query.page;
    const urlQuery = req._parsedUrl.query;
    const limit = 2;
    const search = createSearch(req.query);
    const query = Object.assign(search.findContent, {status : 0}, {date : {$gte : today}});
    if(req.user) conf = await ChallengeModel.find({$or : [{home : req.user._id}, {away : req.user._id}], date : {$gte : today}});
    const count = await ChallengeModel.countDocuments(query);
    const maxPage = Math.ceil(count/limit);
    const challenges = await ChallengeModel.find(query).populate('home').populate('away').paginate(page, limit).sort({created_at : -1});
    console.log(challenges);
    res.render('game/challenge/home', {page : page, urlQuery : urlQuery, search : search, maxPage : maxPage, challenges : challenges, conf : conf});
  } catch (err){
    if(err) console.error(err);
  }
});

router.get('/challenge/match/:id', async (req, res)=>{
  try{
    const challenge = await ChallengeModel.findOne({id : req.params.id})
    const home = await TeamModel.findOne({_id : challenge.home});
    const homeRank = await RankModel.findOne({team : challenge.home});
    const homeRanking = await RankModel.countDocuments({rank: {$lt : homeRank.point}})
    if(challenge.away) { 
      var away = await TeamModel.findOne({_id : challenge.away});
      var awayRank = await RankModel.findOne({team : challenge.away});
      var awayRanking = await RankModel.countDocuments({rank: {$lt : awayRank.point}})
    }
    res.render('game/challenge/match', {challenge : challenge, home : home, away : away, homeRank : homeRank, homeRanking : homeRanking+1, awayRank : awayRank, awayRanking : awayRanking+1});
  } catch (err){
    if(err) console.error(err);
  }
});

router.get('/challenge/trial/:id', teamRequired, async (req, res)=>{
  const team = await TeamModel.findOne({leader : req.user._id});
  const query = {
    away : team._id,
    awayname : team.name
  }
  ChallengeModel.update({id : req.params.id}, {$set : query}, (err)=>{
    if(err) console.error(err);
    res.redirect('/game/challenge/match/'+req.params.id);
  });
});

router.get('/challenge/cancel/:id', teamRequired, async (req, res)=>{
  const team = await ChallengeModel.findOne({id : req.params.id}).populate('away');    
  const query = {
    away : "",
    awayname : ""
  }
  ChallengeModel.update({id : req.params.id}, {$unset : query}, (err)=>{
    if(err) console.error(err);
    res.redirect('/game/challenge/match/'+ req.params.id);
  });
});

router.get('/challenge/delete/:id', teamRequired, async (req, res)=>{
  ChallengeModel.remove({id : req.params.id}, (err)=>{
    if(err) console.error(err);
    res.redirect('/game/challenge');
  });
});


function createSearch(queries){
    let today = new Date();
    let findContent = {};
    if(queries.searchType && queries.searchText && queries.searchText.length >= 1){
      let searchTypes = queries.searchType.toLowerCase().split(",");
      let postQueries = [];
      if(searchTypes.indexOf("homename")>=0){
        postQueries.push({homename : {$regex : new RegExp(queries.searchText, "i")}});
      }
      if(searchTypes.indexOf("awayname")>=0){
        postQueries.push({awayname : {$regex : new RegExp(queries.searchText, "i")}});
      }
      if(searchTypes.indexOf("name")>=0){
        postQueries.push({name : {$regex : new RegExp(queries.searchText, "i")}});
      }
      if(searchTypes.indexOf("addr")>=0){
        postQueries.push({addr : {$regex : new RegExp(queries.searchText, "i")}});
      }
      if(postQueries.length>0) findContent = {$or:postQueries};
    }
    return { searchType : queries.searchType, searchText : queries.searchText, findContent : findContent}
  }

  function getWeekEndday(){
    var today = new Date(moment().startOf('day'));
    var i = 0;
      var point;
      while(point != 1){
        point = new Date(moment(today).add(i, 'days')).getDay();
        var weekEnd = moment(today).add(i, 'days');
        i ++;
      }
      return weekEnd;
  }
  
module.exports = router;
