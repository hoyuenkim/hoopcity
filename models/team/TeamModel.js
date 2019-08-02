const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AggregatePaginate= require('mongoose-aggregate-paginate');

const TeamSchema = new Schema({
    name : String,
    leader : { type : mongoose.Schema.Types.ObjectId, ref: 'user' },
    desc : String,
    teamicon : String,
    court : String,
    geometry : {type : {type : String, 'default' : "Point"},
        coordinates : [{type : "Number"}]
    },
    addr : String,
    addr_detail : String,
    training : {},
    members : [{type : mongoose.Schema.Types.ObjectId, ref : 'user'}],
    createdAt : {
        type : Date,
        default : Date.now
    },
    options : [],
    deleted : {
        type : Boolean,
        default : false,
    }
});

TeamSchema.virtual('getRegion').get(function(){
    var addr = this.addr.split(' ');
    var region = addr[0] + ' ' + addr[1];
    return region;
});

TeamSchema.virtual('getDay').get(function(){
    var day;
    // console.log(this.training.day);
    switch(Number(this.training.day)) {
    case 0:
        day = "Sun";
        break;
    case 1:
        day = "Mon";
        break;
    case 2:
        day = "Tue";
        break;
    case 3:
        day = "Wed";
        break;
    case 4:
        day = "Thu";
        break;
    case 5:
        day = "Fri";
        break;
    case  6:
        day = "Sat";
    }
    return day;
});

// { type: Schema.Types.ObjectId, ref: 'team' },
module.exports = mongoose.model('team', TeamSchema);
