const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TestSchema = new Schema({
    // name : String,
    num : Number,
    //please config your db Schema
  });

  module.exports = mongoose.model('test', TestSchema);