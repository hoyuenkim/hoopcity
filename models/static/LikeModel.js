const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LikeSchema = new Schema({
  id : {
    type: String,
  },
  section : String,
  likes : {type : mongoose.Schema.Types.ObjectId, ref : 'user'},
  created_at : {
    type : Date,
    default : Date.now()
  },
  views : [],
});

module.exports = mongoose.model('like', LikeSchema);
