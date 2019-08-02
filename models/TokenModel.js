const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TokenSchema = new Schema({
    // name : String,
    tokens : {},
    created_at : {
      type : Date,
      default : Date.now()
    },
    //please config your db Schema
  });

  module.exports = mongoose.model('token', TokenSchema);
  