const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BoardSchema = new Schema({
  id : String,
  author : {type : mongoose.Schema.Types.ObjectId, ref : 'user'},
  team : {type : mongoose.Schema.Types.ObjectId, ref : 'team'},
  subject : String,
  content : String,
  thumbnail : String,
  created_at : {
    type : Date,
    default : Date.now()
  },
  views : [],
});

module.exports = mongoose.model('board', BoardSchema);
