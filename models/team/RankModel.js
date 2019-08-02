const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AggregatePaginate= require('mongoose-aggregate-paginate');

const RankSchema = new Schema({
    team : {type : mongoose.Schema.Types.ObjectId, ref : 'team'},
    point : {
        type : Number,
        default : 0,
    },
    win : {
        type : Number,
        default : 0,
    },
    lose : {
        type : Number,
        default : 0,
    },
    deleted : {
        type : Boolean,
        default : false,
    },
    created_at : {
        type : Date,
        default : Date.now()
    }
});

RankSchema.virtual('getShift').get(function(){
const win = this.win;
const lose = this.lose    

var shift = win/(win+lose)

    if(isNaN(shift)){
    shift = 0;
    } else if (isFinite(shift)){
    shift = 100;
    }
    return shift;
});

module.exports = mongoose.model('rank', RankSchema);