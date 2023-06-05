import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const postSchema = new Schema({
  postID: {
    type: mongoose.Decimal128,
    required: true,
  },
  claimedBy: Array,
  claimMessageID: mongoose.Decimal128,
  lockMessageID: mongoose.Decimal128,
  code: Number,
});

const Post = mongoose.model('Post', postSchema);
export default Post;