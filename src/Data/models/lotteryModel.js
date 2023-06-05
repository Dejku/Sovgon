import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const lotterySchema = new Schema({
  person: {
    type: String,
    required: true,
  },
  personID: {
    type: mongoose.Decimal128,
    required: true,
  },
});

const Lottery = mongoose.model('Lottery', lotterySchema);
export default Lottery;