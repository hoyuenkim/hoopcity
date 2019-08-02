const mongoose = require('mongoose');
require('mongoose-type-url');
const Schema = mongoose.Schema;
const AggregatePaginate= require('mongoose-aggregate-paginate');

const MediaSchema = new Schema({
    team : {type : mongoose.Schema.Types.ObjectId, ref : 'team'},
    subject : String,
    content : String,
    url : {type : mongoose.SchemaTypes.Url},
    created_at : {
        type : Date,
        default : Date.now()
    }
});

module.exports = mongoose.model('media', MediaSchema);
