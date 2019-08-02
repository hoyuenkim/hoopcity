const express = require('express');
const router = express.Router();

const multer = require('multer');
const path = require('path');
const adminRequired = require('../libs/adminRequired');
const loginRequired = require('../libs/loginRequired');

const NoticeModel = require('../models/admin/NoticeModel');
// const LessonModel = require('../models/admin/LessonModel');
// const NewsModel = require('../models/admin/NewsModel');
const UserModel = require('../models/admin/UserModel');
const PickupModel = require('../models/game/PickupModel');
const MenuModel = require('../models/admin/MenuModel');
const CommentModel = require('../models/static/CommentModel');

const uploadDir = path.join(__dirname, '../uploads/admin');
const storage  = multer.diskStorage({
    destination : (req, file, callback) =>{
        callback(null, uploadDir);
    },
    filename : (req, file, callback) =>{
        callback(null, 'admin' + Date.now() + '.'+ file.mimetype.split('/')[1])
    }
})
const upload = multer({storage : storage});

router.get('/notice', async (req, res)=>{
    try {
        let page = 1;
    if(req.query.page) page = req.query.page;
    const limit = 10;
    let search = createSearch(req.query);
    const urlQuery = req._parsedUrl.query;
    const count = await NoticeModel.countDocuments(search.findContent);
    const maxPage = Math.ceil(count/limit);
    const notices = await NoticeModel.find(search.findContent).paginate(page, limit).sort({created_at : -1})
    await res.render('admin/notice/home', {notices : notices, page : page, maxPage : maxPage, search : search, urlQuery : urlQuery});
    } catch (err){
        if(err) console.error(err);
    }   
});

router.get('/notice/content/:id', async (req, res)=>{
    const comments = await CommentModel.find({section : "notice", target : req.params.id}).populate('author');
    const content = await NoticeModel.findOne({id : req.params.id});
    const ip = req.clientIp;
    await NoticeModel.update({id : req.params.id}, {$push : {views : ip}});
     res.render('admin/notice/content', {content : content, comments : comments, section : "notice"});
});

router.get('/notice/register', adminRequired, (req, res)=>{
    res.render('admin/notice/register', {notice : ""});
});

router.post('/notice/register', adminRequired, upload.single('thumbnail'), (req, res)=>{
    const notice = new NoticeModel({
        id : Date.now(),
        author : req.user._id,
        subject : req.body.subject,
        thumbnail : (req.file) ? req.file.filename : "",
        content : req.body.content,
    });
    notice.save((err)=>{
        if(err) console.error({message : "Error is occured at notice register"});
        res.redirect('/admin/notice')
    });
});

router.get('/notice/edit/:id', adminRequired, (req, res)=>{
    NoticeModel.findOne({id : req.params.id}, (err, notice)=>{
        if(err) console.error(err);
        res.render('admin/notice/register', {notice : notice});
    });
});

router.post('/notice/edit/:id', adminRequired, (req, res)=>{
    const notice = {
        subject : req.body.subject,
        content : req.body.content,
    };
    NoticeModel.update({id : req.params.id}, {$set : notice}, (err)=>{
        res.redirect('/notice/content/'+req.params.id);
    });
});

router.get('/notice/delete/:id', adminRequired, (req, res)=>{
    NoticeModel.remove({id : req.params.id}, (err)=>{
        if(err) console.error(err);
        res.redirect('/admin/notice');
    });
});

router.get('/menu', adminRequired, (req, res)=>{
    MenuModel.find({status : 1}, (err, menus)=>{
        if(err) console.error(err);
        res.render('admin/menu/home', {menus : menus});
    });
});

router.post('/notice/comment', loginRequired, async (req, res)=>{
    const writer = req.user.profile.name;
    const comment = new CommentModel({
        author : req.user._id,
        content : req.body.comment,
        target : req.body.target,
        section : "notice"
    });
    comment.save(function(err){
        if(err) console.error(err);
        res.json({message : 1, name : writer, comment : req.body.comment, id : comment.id});
    });
});

router.get('/notice/comment/delete/:id', loginRequired, (req, res)=>{
    CommentModel.remove({id : req.params.id}, (err)=>{
        if(err) console.error(err);
        res.redirect('/notice');
    });
});

router.post('/properties', upload.single('thumbnail'), (req, res)=>{
    try{
        res.send('/uploads/admin/' + req.file.filename);
    } catch(err){
        console.error({message : "Error is occured at summernote image upload"});
    }
});

router.post('/subject/auth', async (req, res)=>{
    const auth = await MenuModel.findOne({subject : req.body.subject});
    if(auth) res.json({message : 1});
    res.json({message : 0});
});

router.post('/subject/submit', async (req, res)=>{
    const subject = new MenuModel({
        subject : req.body.subject,
    });
    subject.save((err)=>{
        res.json({message : 1, subject : req.body.subject})
    });
});

router.post('/subject/delete', (req, res)=>{
    MenuModel.remove({subject : req.body.subject}, (err)=>{
        res.json({message : 1});
    });
});

router.post('/subject/list', (req, res)=>{
    MenuModel.findOne({subject : req.body.content}, (err, subject)=>{
        if(err) console.error(err);
        res.json({subject : subject});
    });
});

router.post('/subordinate/submit', async (req, res)=>{
    const subject = await MenuModel.findOne({subject : req.body.subject}); 
    MenuModel.update({subject : req.body.subject}, {$push : {subordinate : req.body.content}}, (err)=>{
        if(err) res.json({message : 0});
        res.json({message : 1, subordinate : req.body.content, subject : subject.subject});
    });
});

router.post('/subordinate/auth', (req, res)=>{
    MenuModel.findOne({subject : req.body.subject, subordinate : {$in: [req.body.subordinate]}}, (err, subordinate)=>{
        if(err) console.error(err);
        if(subordinate){
            res.json({message : 1});
        } 
    });
});

router.post('/subordinate/delete', (req, res)=>{
    MenuModel.update({subject : req.body.subject}, {$pull : {subordinate : req.body.subordinate}}, (err)=>{
        if(err) console.error(err);
        res.json({message : 1});
    });
});

//search fucntion
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