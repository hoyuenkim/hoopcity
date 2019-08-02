const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  id : {
    type: String,
  },
  from : {type : mongoose.Schema.Types.ObjectId, ref : 'user'},
  to : {type : mongoose.Schema.Types.ObjectId, ref : 'user'},
  username : String,
  subject : String,
  content : String,
  views : {type : Boolean, default : false},
  deleted : {type : Boolean, default : false},
  created_at : {
    type : Date,
    default : Date.now()
  },
  views : [],
});

module.exports = mongoose.model('message', MessageSchema);
