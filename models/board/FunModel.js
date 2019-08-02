const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FunSchema = new Schema({
  id : {
    type: String,
  },
  author : String,
  subject : String,
  content : String,
  created_at : {
    type : Date,
    default : Date.now()
  },
  views : [],
});

module.exports = mongoose.model('fun', FunSchema);
