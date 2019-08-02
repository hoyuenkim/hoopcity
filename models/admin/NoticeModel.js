const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NoticeSchema = new Schema({
  id : {
    type: String,
  },
  author : {type : mongoose.Schema.Types.ObjectId, ref : 'user'},
  subject : String,
  content : String,
  thumbnail : String,
  created_at : {
    type : Date,
    default : Date.now()
  },
  views : [],
});

module.exports = mongoose.model('notice', NoticeSchema);
