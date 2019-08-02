const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AggregatePaginate= require('mongoose-aggregate-paginate');

const ChallengeSchema = new Schema({
    id : String,
    home : {type : mongoose.Schema.Types.ObjectId, ref : 'team'},
    away : {type : mongoose.Schema.Types.ObjectId, ref : 'team'},
    homename : String,
    awayname : String,
    addr : String,
    date : Date,
    time : String,
    status : {type : Number,
                default : 0},
    geometry : {type : {type : String, 'default' : "Point"},
        coordinates : [{type : "Number"}]
    },
    createdAt : {
        type : Date,
        default : Date.now
    }
});

ChallengeSchema.virtual('getDate').get(function(){
    var month = this.date.getMonth();
    var day = this.date.getDate();
    var date = month+1 + '월 ' + day + '일';
    return date;
});

ChallengeSchema.virtual('getRegion').get(function(){
    var addr = this.addr.split(' ');
    var region = addr[0] + ' ' + addr[1];
    return region;
});


module.exports = mongoose.model('challenge', ChallengeSchema);
