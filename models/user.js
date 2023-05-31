const mongoose = require('mongoose'),     
 MoneyBox = require('./money_parts'),
 Schema = mongoose.Schema;

const passportLocalMongoose = require('passport-local-mongoose');

const ImageSchema = new Schema({
    url: String,
    filename: String
});

ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200');
});

const opts = { toJSON: { virtuals: true } };

const UserSchema = new Schema({
    photo: [ImageSchema],
    email: {
        type: String,
        required: true,
        unique: true
    },
    role:{
        type: String,
        required: true
    },
    stockLocation:{
        type: String,
        default:'Central'
    },
    serviceType:{
        type: String,
        default:'Consulta'
    },
    color: {
        type: String,
        default: '#00DD00' // default color value (black)
    },
    moneyBox: { type: Schema.Types.ObjectId, ref: 'MoneyBox' },

});


UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);