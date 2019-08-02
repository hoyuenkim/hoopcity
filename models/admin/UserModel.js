const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  id : {
    type: String,
    default : Date.now(),
  },
  username : String,
  password : String,
  provider : String,
  teamleader : Boolean,
  kakao : {},
  profile : {},
  status : {type : Number,
    default : 0
  },
  geometry : {type : {type : String, 'default' : "Point"},
  coordinates : [{type : "Number"}]
  },
  deleted : {
    type : Boolean,
    default : false
  },
  auth : {
    type : Boolean,
    default : false
  },
  created_at : {
    type : Date,
    default : Date.now()
  },
});


UserSchema.virtual('getRegion').get(function(){
  var addr = this.profile.addr.split(' ');
  var region = addr[0] + ' ' + addr[1];
  return region;
});


module.exports = mongoose.model('user', UserSchema);
