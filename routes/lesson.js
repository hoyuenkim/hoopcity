const express = require('express');
const router = express.Router();
const Youtube = require('youtube-node');

const youTube = new Youtube();
youTube.setKey('AIzaSyDnkt_3nEiMvGgDrr9iF2RgPF_94_nc1dQ');

const LessonModel = require('../models/admin/LessonModel');

router.get('/', async (req, res)=>{
   const lesson = await LessonModel.find({auth : 1});
   res.render('admin/lesson/home', {lesson : lesson});
});

router.get('/professor', async (req, res)=>{
    // const prof = req.params.prof;
    // const lesson = await LessonModel.findOne({prof : prof});
    youTube.getById('HcwTxRuq-uk', (err, result)=>{
        if(err) console.error(err);
        // res.render('admin/lesson/prof', {result : result});\
        res.send(result)
    })
});

module.exports = router;