const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UsedSchema = new Schema({
  id : {
    type: String,
  },
  author : {type : mongoose.Schema.Types.ObjectId, ref : 'user'},
  subject : String,
  content : String,
  price : String,
  thumbnail : String,
  created_at : {
    type : Date,
    default : Date.now()
  },
  views : [],
});

UsedSchema.virtual('getAmountFormat').get(function(){
    // 1000원을 1,000원으로 바꿔준다.
    return new Intl.NumberFormat().format(this.price);
});

UsedSchema.virtual('getRegion').get(function(){
  var addr = this.addr.split(' ');
  var region = addr[0] + ' ' + addr[1];
  return region;
});

module.exports = mongoose.model('used', UsedSchema);
