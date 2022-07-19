import mongoose from "mongoose";
import CommentModel from "./comment.js";

export interface SubcommentType {
  postId: mongoose.Types.ObjectId;
  commentId: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  profile: mongoose.Types.ObjectId;
  text: string;
  createdAt?: Date;
}

const SubcommentSchema = new mongoose.Schema<SubcommentType>({
  postId: {
    type: mongoose.SchemaTypes.ObjectId,
    requrie: true,
  },
  commentId: {
    type: mongoose.SchemaTypes.ObjectId,
    requrie: true,
  },
  user: {
    type: mongoose.SchemaTypes.ObjectId,
    requrie: true,
    ref: "users",
  },
  profile: {
    type: mongoose.SchemaTypes.ObjectId,
    requrie: true,
    ref: "profiles",
  },
  text: {
    type: String,
    require: true,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

SubcommentSchema.pre("save", async function (next) {
  this.createdAt = new Date();
  const commentId = this.commentId;
  await CommentModel.findByIdAndUpdate(commentId, {
    $inc: {
      subcommentsCount: 1,
    },
    $push: {
      subcomments: this._id,
    },
  });
  next();
});

SubcommentSchema.pre(/^find/, function (next) {
  this.populate({ path: "profile" });
  this.populate({ path: "user", select: "username" });
  next();
});

const SubcommentModel = mongoose.model("subcomments", SubcommentSchema);

export default SubcommentModel;
