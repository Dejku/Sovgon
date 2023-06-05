import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const birthdaySchema = new Schema({
  person: {
    type: String,
    required: true,
  },
  personID: {
    type: mongoose.Decimal128,
    required: true,
  },
  day: {
    type: Number,
    required: true,
  },
  month: {
    type: Number,
    required: true,
  },
});

const Birthday = mongoose.model('Birthday', birthdaySchema);
export default Birthday;