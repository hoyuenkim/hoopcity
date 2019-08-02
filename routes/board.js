const express = require('express');
const router = express.Router();
const loginRequired = require('../libs/loginRequired');
const paginate = require('mongoose-paginate');
const multer = require('multer');
const path = require('path');

const uploadDir = path.join(__dirname, '../uploads/board');

const storage = multer.diskStorage({
    destination : function(req, file, callback){
        callback(null, uploadDir);
    },
    filename : function(req, file, callback){
        callback(null, 'ballers' + Date.now() + '.'+ file.mimetype.split('/')[1])
    }
});

const upload = multer({storage : storage});

const FreetalkModel = require('../models/board/FreetalkModel');
const FunModel = require('../models/board/FunModel');
const CommentModel = require('../models/static/CommentModel');

router.get('/freetalk', async (req, res)=>{
    try {
        let page = 1;
    if(req.query.page) page = req.query.page;
    const limit = 10;
    let search = createSearch(req.query);
    const urlQuery = req._parsedUrl.query;
    const count = await FreetalkModel.countDocuments(search.findContent);
    const maxPage = Math.ceil(count/limit);
    const freetalks = await FreetalkModel.find(search.findContent).populate('author').paginate(page, limit).sort({created_at : -1});
    await res.render('board/freetalk/home', {freetalks : freetalks, page : page, maxPage : maxPage, search : search, urlQuery : urlQuery});
    } catch (err){
        if(err) console.error(err);
    }   
});

router.get('/freetalk/content/:id', async (req, res)=>{
    const comments = await CommentModel.find({section : "freetalk", target : req.params.id}).populate('author');
    const content = await FreetalkModel.findOne({id : req.params.id}).populate('author');
    const ip = req.clientIp;
    await FreetalkModel.update({id : req.params.id}, {$push : {views : ip}});
     res.render('board/freetalk/content', {content : content, comments : comments, section : "freetalk"});
});

router.get('/freetalk/register', loginRequired, (req, res)=>{
    res.render('board/freetalk/register', {content : ""});
});

router.post('/freetalk/register', loginRequired, upload.single('thumbnail'), (req, res)=>{
    const freetalk = new FreetalkModel({
        id : Date.now(),
        author : req.user._id,
        subject : req.body.subject,
        thumbnail : (req.file) ? req.file.filename : "",
        content : req.body.content,
    });
    freetalk.save((err)=>{
        if(err) console.error(err);
        res.redirect('/board/freetalk')
    });
});

router.get('/freetalk/edit/:id', loginRequired, (req, res)=>{
    FreetalkModel.findOne({id : req.params.id}, (err, content)=>{
        if(err) console.error(err);
        res.render('board/freetalk/register', {content : content});
    });
});

router.post('/freetalk/edit/:id', loginRequired, upload.single('thumbnail'),  (req, res)=>{
    const freetalk = {
        subject : req.body.subject,
        content : req.body.content,
    };
    FreetalkModel.update({id : req.params.id}, {$set : freetalk}, (err)=>{
        res.redirect('/board/freetalk/content/'+req.params.id);
    });
});

router.get('/freetalk/delete/:id', loginRequired, (req, res)=>{
    FreetalkModel.remove({id : req.params.id}, (err)=>{
        if(err) console.error(err);
        res.redirect('/board/freetalk');
    });
});

router.get('/fun', async (req, res)=>{
    try {
        let page = 1;
    if(req.query.page) page = req.query.page;
    const limit = 10;
    let search = createSearch(req.query);
    const urlQuery = req._parsedUrl.query;
    const count = await FunModel.countDocuments(search.findContent);
    const maxPage = Math.ceil(count/limit);
    const funs = await FunModel.find(search.findContent).populate('author').paginate(page, limit).sort({created_at : -1})
    res.render('board/fun/home', {funs : funs, page : page, maxPage : maxPage, search : search, urlQuery : urlQuery});
    } catch (err){
        if(err) console.error(err);
    }
});

router.get('/fun/content/:id', async (req, res)=>{
    const comments = await CommentModel.find({section : "fun", target : req.params.id}).populate('author');
    const content = await FunModel.findOne({id : req.params.id}).populate('author');
    const ip = req.clientIp;
    await FunModel.update({id : req.params.id}, {$push : {views : ip}});
     res.render('board/fun/content', {content : content, comments : comments, section : "fun"});
});

router.get('/fun/register', loginRequired, (req, res)=>{
    res.render('board/fun/register', {content : ""});
});

router.post('/fun/register', loginRequired, upload.single('thumbnail'), (req, res)=>{
    const fun = new FunModel({
        id : Date.now(),
        author : req.user._id,
        subject : req.body.subject,
        thumbnail : (req.file) ? req.file.filename : "",
        content : req.body.content,
    });
    fun.save((err)=>{
        if(err) console.error({message : "Error is occured at notice register"});
        res.redirect('/board/fun')
    });
});

router.get('/fun/edit/:id', loginRequired, (req, res)=>{
    FunModel.findOne({id : req.params.id}, (err, content)=>{
        if(err) console.error(err);
        res.render('board/fun/register', {content : content});
    });
});

router.post('/fun/edit/:id', loginRequired, upload.single('thumbnail'), (req, res)=>{
    const query = {
        subject : req.body.subject,
        content : req.body.content,
    };
    FunModel.update({id : req.params.id}, {$set : query}, (err)=>{
        res.redirect('/board/fun/content/'+req.params.id);
    });
});

router.get('/fun/delete/:id', loginRequired, (req, res)=>{
    FunModel.remove({id : req.params.id}, (err)=>{
        if(err) console.error(err);
        res.redirect('/board/fun');
    });
});

router.post('/fun/comment', async (req, res)=>{
    const writer = req.user.profile.name;
    const comment = new CommentModel({
        author : req.user._id,
        content : req.body.comment,
        target : req.body.target,
        section : "fun"
    });
    comment.save(function(err){
        if(err) console.error(err);
        res.json({message : 1, name : writer, comment : req.body.comment, id : comment.id});
    });
});

router.post('/properties', upload.single('thumbnail'), (req, res)=>{
    try{
        res.send('/uploads/board/' + req.file.filename);
    } catch(err){
        console.error(err);
    }
});

function createSearch(queries){
    var findContent = {};
    if(queries.searchType && queries.searchText && queries.searchText.length >= 1){
      var searchTypes = queries.searchType.toLowerCase().split(",");
      var postQueries = [];
      if(searchTypes.indexOf("subject")>=0){
        postQueries.push({subject : {$regex : new RegExp(queries.searchText, "i")}});
      }
      if(searchTypes.indexOf("content")>=0){
        postQueries.push({content : {$regex : new RegExp(queries.searchText, "i")}});
      }
      if(postQueries.length>0) findContent = {$or:postQueries};
    }
    return { searchType : queries.searchType, searchText : queries.searchText, findContent : findContent}
  }

module.exports = router;