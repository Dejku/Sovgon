import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const sessionSchema = new Schema({
  sessionTAG: {
    type: Number,
    required: true,
  },
  channelID: {
    type: mongoose.Decimal128,
    required: true,
  },
  createdBy: {
    type: mongoose.Decimal128,
    required: true,
  },
  startingDate: {
    type: Number,
    required: true,
  },
  endingDate: {
    type: Number,
    required: true,
  },
  isFinished: {
    type: Boolean,
    default: false,
  },
});

const Session = mongoose.model('Session', sessionSchema);
export default Session;