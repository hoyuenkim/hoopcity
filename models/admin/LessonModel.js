const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LessonSchema = new Schema({
  subject : String,
  subordinate : [],
  created_at : {
    type : Date,
    default : Date.now()
  },
  status : {
    type : Number,
    default : 1
  }
});

module.exports = mongoose.model('lesson', LessonSchema);
