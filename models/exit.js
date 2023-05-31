const mongoose = require('mongoose'),
    MoneyBox = require('./money_parts'),
    Schema = mongoose.Schema;

const ExitSchema = new Schema({
    name: { type: String, required:true },
    clearDate: { type: Date,default: Date.now},
    category: { type: String, default:'General'},
    moneyAmount: { type: Number, required: true, get: p => `${p}.00` },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    relatedBoxes: [{ type: Schema.Types.ObjectId, ref: 'MoneyBox' }],
});

module.exports = mongoose.model("Exit", ExitSchema)

