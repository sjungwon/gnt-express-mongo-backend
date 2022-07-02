import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  creator: String,
  message: String,
  images: [String],
  likes: [String],
  disLikes: [String],
  createAt: {
    type: Date,
    default: new Date(),
  },
});

const PostMessage = mongoose.model("PostMessage", postSchema);

export default PostMessage;
