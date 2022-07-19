import mongoose from "mongoose";

interface ImageType {
  URL: string;
  Key: string;
}

export interface PostType {
  category: mongoose.Types.ObjectId;
  profile: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  text: string;
  postImages: ImageType[];
  likes?: number;
  likeUsers?: mongoose.Types.ObjectId[];
  dislikes?: number;
  dislikeUsers?: mongoose.Types.ObjectId[];
  createdAt?: Date;
  comments?: mongoose.Types.ObjectId[];
  commentsCount?: number;
}

const ImageSchema = new mongoose.Schema<ImageType>({
  URL: String,
  Key: String,
});

const PostSchema = new mongoose.Schema<PostType>({
  category: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "categories",
    required: true,
  },
  profile: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "profiles",
    required: true,
  },
  user: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "users",
    required: true,
  },
  text: {
    type: String,
    default: "",
  },
  postImages: [ImageSchema],
  likes: {
    type: Number,
    default: 0,
  },
  likeUsers: {
    type: [mongoose.SchemaTypes.ObjectId],
    default: [],
  },
  dislikes: {
    type: Number,
    default: 0,
  },
  dislikeUsers: {
    type: [mongoose.SchemaTypes.ObjectId],
    default: [],
  },
  comments: {
    type: [mongoose.SchemaTypes.ObjectId],
    default: [],
    ref: "comments",
  },
  commentsCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

PostSchema.pre(/^find/, function (next) {
  this.populate({ path: "profile" });
  this.populate({ path: "category", select: "title" });
  this.populate({ path: "user", select: "username" });
  this.populate({
    path: "comments",
    options: { sort: { createdAt: -1 }, limit: 3 },
  });
  next();
});

PostSchema.pre("save", function (next) {
  this.createdAt = new Date();
  next();
});

const PostModel = mongoose.model("posts", PostSchema);

export default PostModel;
