import mongoose from "mongoose";
const ImageSchema = new mongoose.Schema({
    URL: String,
    Key: String,
});
const PostSchema = new mongoose.Schema({
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
    blocked: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: new Date(),
    },
});
//post 데이터 쿼리 시 profile, category, user, comment join
//comment join할 때 comment쪽 미들웨어에서 subcomment join함
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
//포스트 저장 시 현재 시간 저장
PostSchema.pre("save", function (next) {
    this.createdAt = new Date();
    next();
});
const PostModel = mongoose.model("posts", PostSchema);
export default PostModel;
