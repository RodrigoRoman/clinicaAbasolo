const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

const PointSchema = new Schema({
    name:{type:String},
    setPoint: { type:Date },
    servicesCar: [ {
        type: Schema.Types.ObjectId,
        ref: "Transaction"
     }
    ]
    });

module.exports = mongoose.model("Point", PointSchema)