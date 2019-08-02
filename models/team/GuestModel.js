const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AggregatePaginate= require('mongoose-aggregate-paginate');

const GuestSchema = new Schema({
    id : {
        type : String,
        default : Date.now()
    },
    host : {type : mongoose.Schema.Types.ObjectId, ref : 'user'},
    team : {type : mongoose.Schema.Types.ObjectId, ref : 'team'},
    homename : String,
    addr : String,
    court : String,
    date : Date,
    time : String,
    geometry : {type : {type : String, 'default' : "Point"},
        coordinates : [{type : "Number"}]
    },
    status : {
        type : Number,
        default : 0,
    },
    members : [{type : mongoose.Schema.Types.ObjectId, ref : 'user'}],
    createdAt : {
        type : Date,
        default : Date.now()
    }
});

GuestSchema.virtual('getRegion').get(function(){
    var addr = this.addr.split(' ');
    var region = addr[0] + ' ' + addr[1];
    return region;
});

GuestSchema.virtual('getDate').get(function(){
    var month = this.date.getMonth();
    var day = this.date.getDate();
    var date = month+1 + '월 ' + day + '일';
    return date;
});

module.exports = mongoose.model('guest', GuestSchema);
