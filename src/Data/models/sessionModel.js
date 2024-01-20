import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const sessionSchema = new Schema({
  sessionTAG: {
    type: Number,
    required: true,
  },
});

const Session = mongoose.model('Session', sessionSchema);
export default Session;