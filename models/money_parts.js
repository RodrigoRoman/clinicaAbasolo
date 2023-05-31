const mongoose = require('mongoose'),
      Exit = require("./exit"),
      Transaction = require('./transaction'),
      Schema = mongoose.Schema;


const MoneyBoxSchema = new Schema({
    name: { type: String, required:true },
    dependantMoneyBoxes: [{ type: Schema.Types.ObjectId, ref: 'MoneyBox' }],
    hierarchy: { type: String, default:'3'},
    color: {
        type: String,
        default: '#00DD00' // default color value (black)
    },
    cutDate:[{ type: Date}],
    transactionsActive:[ {
          type: Schema.Types.ObjectId,
          ref: "Transaction"
      }
    ],
    exitsActive:[ {
          type: Schema.Types.ObjectId,
          ref: "Exit"
        }
    ]
});

MoneyBoxSchema.post('remove', function(doc) {
    var deletedMoneyBoxId = doc._id;
    // Find any MoneyBox document that contains the removed MoneyBox in its dependantMoneyBoxes
    this.model('MoneyBox').update(
      { dependantMoneyBoxes: deletedMoneyBoxId },
      { $pull: { dependantMoneyBoxes: deletedMoneyBoxId } },
      { multi: true },
      function(err, boxes) {
        if (err) {
          console.log(err);
        }
      }
    );
  });

module.exports = mongoose.model("MoneyBox", MoneyBoxSchema);