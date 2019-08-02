const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AggregatePaginate= require('mongoose-aggregate-paginate');

const CommentSchema = new Schema({
    id : String,
    section : {
        type : String,
    },
    target : String,
    content : {
        type : String,
    },
    author : {type : mongoose.Schema.Types.ObjectId, ref : 'user'},
    createdAt : {
        type : Date,
        default : Date.now()
    }
});

module.exports = mongoose.model('comment', CommentSchema);
