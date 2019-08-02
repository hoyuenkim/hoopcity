const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AggregatePaginate= require('mongoose-aggregate-paginate');

const PickupSchema = new Schema({
    id : {
        type : String,
        default : Date.now()
    },
    host : { type: mongoose.Schema.Types.ObjectId, ref : 'user'},
    date : Date,
    time : String,
    court : String,
    addr : String,
    geometry : {type : {type : String, 'default' : "Point"},
        coordinates : [{type : "Number"}]
    },
    daytime : Date,
    members : [{type : mongoose.Schema.Types.ObjectId, ref : 'user'}],
    createdAt : {
        type : Date,
        default : Date.now()
    }
});

PickupSchema.virtual('getRegion').get(function(){
    var addr = this.addr.split(' ');
    var region = addr[0] + ' ' + addr[1];
    return region;
});

module.exports = mongoose.model('pickup', PickupSchema);
