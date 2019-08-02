const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const loginRequired = require('../libs/loginRequired');
const adminRequired = require('../libs/adminRequired');
const teamRequired = require('../libs/teamRequired');
const passwordHash = require('../libs/passwordHash');
const arrayCounter = require('array-counter');
const convert = require('object-array-converter');

const uploadDir = path.join(__dirname, '../uploads/team');
const storage = multer.diskStorage({
    destination : function(req, file, callback){
        callback(null, uploadDir);
    },
    filename : function(req, file, callback){
        callback(null, 'team' + Date.now() + '.'+ file.mimetype.split('/')[1])
    }
});
const upload = multer({storage : storage});

const UserModel = require('../models/admin/UserModel');
const TeamModel = require('../models/team/TeamModel');
const MediaModel = require('../models/static/MediaModel');
const GuestModel = require('../models/team/GuestModel');
const RankModel = require('../models/team/RankModel');
const RecruitModel = require('../models/team/RecruitModel');
const CommentModel = require('../models/static/CommentModel');
const ChallengeModel = require('../models/game/ChallengeModel');
const BoardModel = require('../models/team/BoardModel');

router.get('/', async (req, res)=>{
    try {
        let conf;
        let page = 1;
        if(req.query.page) page = req.query.page;
        let search = createSearch(req.query);
        const query = Object.assign(search.findContent, {deleted : false});
        const limit = 10;
        const urlQuery = req._parsedUrl.query;
        const ranks = await RankModel.find().populate('team').sort({point : -1}).limit(10);
        const count = await TeamModel.countDocuments(query);
        const maxPage = Math.ceil(count/limit);
        const teams = await TeamModel.find(query).populate('leader').sort().paginate(page, limit);
        if(req.user) conf = await TeamModel.findOne({members : {$in : req.user._id}});
        res.render('team/home', {page : page, maxPage : maxPage, urlQuery : urlQuery, teams, teams, ranks : ranks, search : search , conf : conf});
    } catch(err) {
        if(err) console.error(err);
    }
});

router.get('/register', loginRequired, async (req, res)=>{
        res.render('team/register');
});

router.post('/register', upload.single('teamicon'), async (req, res)=>{
    const team = new TeamModel({
        name : req.body.name,
        leader : req.user._id,
        desc : req.body.desc,
        teamicon : (req.file) ? req.file.filename : "",
        court : req.body.court,
        addr : req.body.addr,
        training : {day : req.body.date, 
                    time : req.body.time},
        "geometry.coordinates" : [req.body.x, req.body.y],
        members : [req.user._id],
        options : req.body.options,
    });
    team.save((err)=>{
        if(err) console.error(err);
        const rank = new RankModel({
            team : team._id
        });
        rank.save((err)=>{
            if(err) console.error(err);
            UserModel.update({username : req.user.username}, {$set : {status : 2}}, (err)=>{
                if(err) console.error
                req.user.status = 2;
                res.redirect('/team');
            });
        });
    });
});

router.get('/edit/:name', teamRequired, async (req, res)=>{
    const team = await TeamModel.findOne({name : req.params.name});
    res.render('team/editor', {team : team});
});

router.post('/edit/:name', upload.single('teamicon'), (req, res)=>{
        const query = {
        desc : req.body.desc,
        teamicon : (req.file) ? req.file.filename : "",
        court : req.body.court,
        training : {
            day : req.body.date,
            time : req.body.time
        },
        geometry : {    type : "point",
                        coordinates : [req.body.x, req.body.y]
        },
        addr : req.body.addr,
        options : req.body.options,
        }

        TeamModel.update({name : req.params.name}, {$set : query}, (err)=>{
        if(err) console.error(err);
        res.redirect('/team/home/' + req.params.name);
    });
});

router.get('/delete/:name', teamRequired, async(req, res)=>{
    const conf = await TeamModel.findOne({name : req.params.name})
    if(conf.leader != req.user._id) res.redirect('/team/home/'+req.params.name);
    TeamModel.update({name : req.params.name}, {$set : {deleted : true, members : []}}, (err)=>{
        if(err) console.error(err);
        RankModel.update({team : conf._id}, {$set : {deleted : true}}, (err)=>{
            if(err) console.error(err);
            res.redirect('/team');
        });
    });
});

router.get('/home/:name', async(req, res)=>{
    try{
    let conf = null;
    const team = await TeamModel.findOne({name : req.params.name}).populate('members').populate('leader');
    const rank = await RankModel.findOne({team : team._id});
    if(req.user) conf = await TeamModel.findOne({members : {$in : [req.user._id]}});
    const ranking = await RankModel.countDocuments({point : {$lt : rank.point}});
    const teamInfo = {rank : rank, ranking : ranking+1}
    console.log(team);
    res.render('team/team', {team : team, teamInfo : teamInfo, conf : conf, subject : "home"});
    } catch(err){
        console.error(err);
    }
});

router.get('/schedule/:name', async (req, res)=>{
    try {
        const team = await TeamModel.findOne({name : req.params.name});
        const challenges = await ChallengeModel.find({status : 1, $or : [{home : team._id}, {away : team._id}]});
        const guests = await GuestModel.find({team : team._id});
        const pickups = [];
        console.log(team.training)
        res.render('team/section/schedule', {team : team, challenges : challenges, guests : guests, pickups : pickups, subject : 'schedule', training : team.training});
    } catch (err) {
        if(err) console.error(err);
    }
});

router.get('/members/:name', async (req, res)=>{
    try{
    const team = await TeamModel.findOne({name : req.params.name}).populate('members');
    let avgHeight = 0;
    let avgWeight = 0;
    const positionArr = [];
    const memLength = team.members.length;
    team.members.forEach(function(member){
        avgHeight += Number(member.profile.height)/memLength
    });
    team.members.forEach(function(member){
        avgWeight += Number(member.profile.weight)/memLength
    });
    team.members.forEach(function(member){
        positionArr.push(member.profile.position);
    });
    const pst = arrayCounter(positionArr);
    const position = convert.toArray(arrayCounter(positionArr));
    const teamInfo = {avgWeight : avgWeight.toFixed(1), avgHeight : avgHeight.toFixed(1), position : position, pst : pst}
    res.render('team/section/members', {team : team, teamInfo : teamInfo, subject : "members"});
    } catch(err) {
        if(err) console.error(err);
    }
});

router.get('/board/:name', async (req, res)=>{
    let page = 1;
    let conf;
    if(req.query.page) page = req.query.page;
    const limit = 10;
    const urlQuery = req._parsedUrl.query;
    const search = createSearch(req.query);
    const team = await TeamModel.findOne({name : req.params.name});
    if(req.user) conf = await TeamModel.findOne({name : req.params.name, members : {$in : [req.user._id]}});
    const query = Object.assign(search.findContent, {team : team._id});
    const count = await BoardModel.countDocuments(query);
    const maxPage = Math.ceil(count/limit);
    const boards = await BoardModel.find(query).populate('author');
    res.render('team/section/board', {boards : boards, page : page, maxPage : maxPage, search : search, urlQuery : urlQuery, team : team, subject : "board", conf : conf});
});

router.get('/board/:name/regist', loginRequired, async (req, res)=>{
    res.render('team/section/register', {content : ""});
});

router.post('/board/:name/regist', async (req, res)=>{
    const team = await TeamModel.findOne({name : req.params.name});
    const board = new BoardModel({
        id : Date.now(),
        author : req.user._id,
        team : team._id,
        subject : req.body.subject,
        content : req.body.content,
    });
    board.save((err)=>{
        if(err) console.error(err);
        res.redirect('/team/board/'+team.name);
    });
});

router.get('/board/:name/content/:id', async (req, res)=>{
    const comments = await CommentModel.find({section : "team", target : req.params.id}).populate('author');
    const team = await TeamModel.findOne({name : req.params.name});
    const content = await BoardModel.findOne({id : req.params.id}).populate('author');
    const ip = req.clientIp;
    await BoardModel.update({id : req.params.id}, {$push : {views : ip}});
    res.render('team/section/content', {team : team, content : content, comments : comments, section : "team"});
});

router.get('/board/:name/edit/:id', loginRequired, async (req, res)=>{
    const team = await TeamModel.findOne({name : req.params.name});
    const content = await BoardModel.findOne({team : team._id, id : req.params.id});
    console.log(content);
    res.render('team/section/register', {content : content})
});

router.post('/board/:name/edit/:id', async (req, res)=>{
    const team = await TeamModel.findOne({name : req.params.name});
    const query = {
       subject : req.body.subject,
       content : req.body.content
    }
    BoardModel.update({team : team._id, id : req.params.id}, {$set : query}, (err)=>{
        if(err) console.error(err);
        res.redirect('/team/board/'+req.params.name+'/content/'+req.params.id);
    })
});

router.get('/board/:name/delete/:id', async (req, res)=>{
    const team = await TeamModel.findOne({name : req.params.name});
    BoardModel.remove({team : team._id, id : req.params.id}, (err)=>{
        if(err) console.error(err);
        res.redirect('/team/board/'+req.params.name);
    })
});

router.post('/auth/team', (req, res)=>{
    TeamModel.findOne({name : req.body.name}, (err, team)=>{
        if(err) console.error(err);
        if(team) res.json({message : 1});
        if(!team) res.json({message : 0});
    });
});


router.post('/join', async (req, res)=>{
    console.log(req.user);
    try{
        const team = await TeamModel.findOne({name : req.body.team});
        const board = new BoardModel({
            id : Date.now(),
            subject : '[가입인사] 안녕하세요. ' + req.user.profile.name + '입니다.',
            content : req.body.content,
            author : req.user._id,
            team : team._id,
        });
        await UserModel.update({username : req.user.username}, {$set : {status : 1}});
        await TeamModel.update({name : req.body.team}, {$push : {members : req.user._id}});
        board.save((err)=>{
            req.user.status = 1;
            res.json({message : 1});
        });
    } catch(err){
        if(err) console.error(err)
    }
});

router.get('/resign', loginRequired, async (req, res)=>{
    req.user.status = 0;
    await UserModel.update({username : req.user.username}, {$set : {status : 0}});
    TeamModel.update({team : req.query.name}, {$pull : {members : req.user._id}}, (err)=>{
        if(err) console.error(err);
        res.redirect('/team');
    });
});

router.get('/media', async (req, res)=>{
    const team = await TeamModel.findOne({name : req.query.name});
    res.render('/media', {team : team});
});

//media edit
router.post('/media', async (req, res)=>{
    const media = new MediaModel({

    });
});

router.get('/guest/regist', teamRequired, (req, res)=>{
    TeamModel.findOne({leader : req.user._id}, (err, team)=>{
        if(err) console.error(err);
        if(!team){res.send('<script>alert("you are not a team leader");location.href="/game/guest"</script>');
          } else {
        res.render('game/guest/regist', {team : team});
        }
    });
});

router.post('/guest/regist', teamRequired, async (req, res)=>{
    const team = await TeamModel.findOne({leader : req.user._id});
    const guest = await new GuestModel({
        team : team._id,
        host : req.user._id,
        homename : req.body.homename,
        court : req.body.court,
        addr : req.body.addr,
        date : req.body.date,
        time : req.body.time,
        "geometry.coordinates" : [req.body.x, req.body.y],
        members : [],
    });
    guest.save((err)=>{
        if(err) console.error(err);
        res.redirect('/game/guest');
    });
});

router.get('/guest/edit/:id', teamRequired, (req, res)=>{
    GuestModel.findOne({id : req.params.id}, (err, guest)=>{
        if(err) console.error(err);
        res.render('team/guestRegist', {guest : guest});
    });
});

router.post('/guest/edit/:id', async (req, res)=>{
    const query = {
        team : req.body.team,
        date : req.body.date,
        time : req.body.time,
        "geometry.coordinates" : [req.body.x, req.body.y],
    }
    await GuestModel.update({id : req.params.id}, {$set : query}, (err)=>{
        if(err) console.error(err);
        res.redirect('/game/guest/'+req.params.id);
    });
});

//recruit
router.get('/recruit', async (req, res)=>{
    let page = 1;
    if(req.query.page) page = req.query.page;
    const urlQuery = req._parsedUrl.query;
    const limit = 10;
    const search = createSearch(req.query);
    const query = Object.assign(search.findContent, {status : 0});
    const count = await RecruitModel.countDocuments(query);
    const maxPage = Math.ceil(count/limit);
    const recruits = await RecruitModel.find(query).populate('team').populate('members').sort({created_at : -1}).paginate(page, limit);
    res.render('team/recruit/home', {recruits : recruits, page : page, maxPage : maxPage, count, count, search : search, urlQuery : urlQuery});
});

router.get('/recuit/content/:id', async (req, res)=>{
   const recruit = await RecruitModel.findOne({id : req.params.id});
   res.render('team/recruit/content', {recruit : recruit});
});

router.get('/recruit/register', teamRequired, async(req, res)=>{
    const team = await TeamModel.findOne({leader : req.user._id});
    res.render('team/recruit/regist', {team : team});
});


router.post('/recruit/register', async (req, res)=>{
    const team = await TeamModel.findOne({leader : req.user._id});
    const recruit = new RecruitModel({
        team : team._id,
        subject : req.body.subject,
        content : req.body.content,
        position : req.body.position,
    });
    recruit.save((err)=>{
        if(err) console.error(err);
        res.redirect('/team/recruit');
    });
});


router.get('/recruit/edit/:id', async (req, res)=>{
    const team = await RecruitModel.findOne({id : req.params.id});
    res.render('team/recruit/regist', {team : team});
});

router.post('/recruit/edit/:id', async (req, res)=>{
    const query = {
        subject : req.body.subject,
        position : req.body.position,
        content : req.body.content
    };
    RecruitModel.update({id : req.params.id}, {$set : query}, (err)=>{
        if(err) console.error(err);
        res.redirect('/team/recurit/content/'+req.params.id);
    });
});

router.get('/recurit/join/:id', loginRequired, async (req, res)=>{
    const conf = TeamModel.findOne({members : {$in : [req.user._id]}});
    if(conf) {res.redirect('/recruit/content/'+req.params.id)}; 
    await RecruitModel.update({id : req.params.id}, {members : {$push : [req.user._id]}});
    res.redirect('/recurit/content/'+req.params.id);
});

router.get('/challenge/regist', teamRequired, async (req, res)=>{
   const team = await TeamModel.findOne({leader : req.user._id});
   res.render('game/challenge/register', {team : team});
});

router.post('/challenge/regist', async (req, res)=>{
    const challenge = new ChallengeModel({
        id : Date.now(),
        home : req.body._id,
        homename : req.body.homename,
        addr : req.body.addr,
        date : req.body.date,
        time : req.body.time,
        "geometry.coordinates" : [req.body.x, req.body.y]
    });
    challenge.save((err)=>{
        res.redirect('/game/challenge')
    });
});

router.post('/properties', upload.single('thumbnail'), (req, res)=>{
    try{
        res.send('/uploads/team/' + req.file.filename);
    } catch(err){
        if(err) console.error(err);
    }
});

//search fucntion
function createSearch(queries){
    var findContent = {};
    if(queries.searchType && queries.searchText && queries.searchText.length >= 1){
      var searchTypes = queries.searchType.toLowerCase().split(",");
      var postQueries = [];
      if(searchTypes.indexOf("name")>=0){
        postQueries.push({name : {$regex : new RegExp(queries.searchText, "i")}});
      }
      if(searchTypes.indexOf("subject")>=0){
        postQueries.push({subject : {$regex : new RegExp(queries.searchText, "i")}});
      }
      if(searchTypes.indexOf("addr")>=0){
        postQueries.push({addr : {$regex : new RegExp(queries.searchText, "i")}});
      }
      if(searchTypes.indexOf("content")>=0){
        postQueries.push({content : {$regex : new RegExp(queries.searchText, "i")}});
      }
      if(postQueries.length>0) findContent = {$or:postQueries};
    }
    return { searchType : queries.searchType, searchText : queries.searchText, findContent : findContent}
  }

module.exports = router;
