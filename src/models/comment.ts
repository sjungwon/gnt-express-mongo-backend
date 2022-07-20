import mongoose from "mongoose";
import PostModel from "./post.js";

export interface CommentType {
  postId: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  profile: mongoose.Types.ObjectId;
  text: string;
  subcomments?: mongoose.Types.ObjectId[];
  subcommentsCount?: number;
  createdAt?: Date;
}

const CommentSchema = new mongoose.Schema<CommentType>({
  postId: {
    type: mongoose.SchemaTypes.ObjectId,
    require: true,
  },
  user: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "users",
    require: true,
  },
  profile: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "profiles",
    require: true,
  },
  text: {
    type: String,
    require: true,
  },
  subcomments: {
    type: [mongoose.SchemaTypes.ObjectId],
    ref: "subcomments",
    default: [],
  },
  subcommentsCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

CommentSchema.pre(/^find/, function (next) {
  this.populate({ path: "profile" });
  this.populate({ path: "user", select: "username" });
  this.populate({
    path: "subcomments",
    options: { sort: { createdAt: -1 }, limit: 1 },
  });
  next();
});

CommentSchema.pre("save", async function (next) {
  this.createdAt = new Date();
  const postId = this.postId;
  const commentId = this._id;
  await PostModel.findByIdAndUpdate(postId, {
    $push: {
      comments: commentId,
    },
    $inc: {
      commentsCount: 1,
    },
  });
  next();
});

//model 정의 + 컨트롤러에서 comment 추가되면 -> commnet collection에 추가 + post에 commentid 남기기
const CommentModel = mongoose.model("comments", CommentSchema);

export default CommentModel;
