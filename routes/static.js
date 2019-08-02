//essential modules
const express = require('express');
const router = express.Router();

//mongodb
const CommentModel = require('../models/static/CommentModel');

router.post('/comment/write/:section', async (req, res)=>{
    const comment = new CommentModel({
        id : Date.now(),
        section : req.params.section,
        target : req.body.target,
        content : req.body.comment,
        author : req.user._id,
    })
    comment.save(function(err){
        if(err) console.error;
        res.json({message : 1, name : req.user.profile.name, comment : req.body.comment, id : comment.id})
    });
});

router.post('/comment/delete/:section', (req, res)=>{
    CommentModel.remove({section : req.params.section, id : req.body.id}, (err)=>{
        if(err) console.error;
        res.json({message : 1});
    });
});

module.exports = router;