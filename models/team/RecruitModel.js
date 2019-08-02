const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RecruitSchema = new Schema({
    id : String,
    subject : String,
    content : String,
    team : {type : mongoose.Schema.Types.ObjectId, ref : 'team'},
    position : [],
    members : [{type : mongoose.Schema.Types.ObjectId, ref : 'user'}],
});

module.exports = mongoose.model('recruit', RecruitSchema)