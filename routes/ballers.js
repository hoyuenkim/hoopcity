const express = require('express');
const router = express.Router();
const loginRequired = require('../libs/loginRequired');
const multer = require('multer');
const path = require('path');

const uploadDir = path.join(__dirname, '../uploads/ballers');

const storage = multer.diskStorage({
    destination : function(req, file, callback){
        callback(null, uploadDir);
    },
    filename : function(req, file, callback){
        callback(null, 'ballers' + Date.now() + '.'+ file.mimetype.split('/')[1])
    }
});

const upload = multer({storage : storage});

const UsedModel = require('../models/ballers/UsedModel');
const CommentModel = require('../models/static/CommentModel');

router.get('/used', async (req, res)=>{
    try {
        let page = 1;
    if(req.query.page) page = req.query.page;
    const limit = 10;
    let search = createSearch(req.query);
    const urlQuery = req._parsedUrl.query;
    const count = await UsedModel.countDocuments(search.findContent);
    const maxPage = Math.ceil(count/limit);
    const useds = await UsedModel.find(search.findContent).populate('author').paginate(page, limit).sort({created_at : -1});
    await res.render('ballers/used/home', {useds : useds, page : page, maxPage : maxPage, search : search, urlQuery : urlQuery});
    } catch (err){
        if(err) console.error(err);
    }   
});

router.get('/used/content/:id', async (req, res)=>{
    const comments = await CommentModel.find({section : "freetalk", target : req.params.id}).populate('author');
    const content = await UsedModel.findOne({id : req.params.id}).populate('author');
    const ip = req.clientIp;
    await UsedModel.update({id : req.params.id}, {$push : {views : ip}});
     res.render('ballers/used/content', {content : content, comments : comments, section : "used"});
});

router.get('/used/register', loginRequired, (req, res)=>{
    res.render('ballers/used/register', {freetalk : ""});
});

router.post('/used/register', loginRequired, upload.single('thumbnail'), (req, res)=>{
    const freetalk = new UsedModel({
        id : Date.now(),
        author : req.user._id,
        subject : req.body.subject,
        price : req.body.price,
        thumbnail : (req.file) ? req.file.filename : "",
        content : req.body.content,
    });
    freetalk.save((err)=>{
        if(err) console.error(err);
        res.redirect('/ballers/used')
    });
});

router.get('/used/editor/:id', loginRequired, (req, res)=>{
    UsedModel.findOne({id : req.params.id}, (err, used)=>{
        if(err) console.error(err);
        res.render('ballers/used/register', {used : used});
    });
});

router.post('/used/editor/:id', loginRequired, async (req, res)=>{
    const used = await UsedModel.findOne({id : req.params.id});
    const thumbnail = used.thumbnail;
    const query = {
        subject : req.body.subject,
        thumbnail : (req.file) ? req.file.filename : thumbnail,
        content : req.body.content,
    };
    UsedModel.update({id : req.params.id}, {$set : query}, (err)=>{
        if(err) console.error(err);
        res.redirect('/used/content/'+req.params.id);
    });
});

router.get('/used/delete/:id', loginRequired, (req, res)=>{
    UsedModel.remove({id : req.params.id}, (err)=>{
        if(err) console.error(err);
        res.redirect('/used');
    });
});

router.post('/properties', upload.single('thumbnail'), (req, res)=>{
    try{
        res.send('/uploads/ballers/' + req.file.filename);
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