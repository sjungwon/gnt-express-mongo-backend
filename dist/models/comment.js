var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import mongoose from "mongoose";
import PostModel from "./post.js";
const CommentSchema = new mongoose.Schema({
    postId: {
        type: mongoose.SchemaTypes.ObjectId,
        require: true,
    },
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "users",
        require: true,
    },
    category: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "categories",
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
    blocked: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: new Date(),
    },
});
//댓글 쿼리 시
//프로필, 유저, 카테고리, 대댓글 join
CommentSchema.pre(/^find/, function (next) {
    this.populate({ path: "profile" });
    this.populate({ path: "user", select: "username" });
    this.populate({ path: "category", select: "title" });
    this.populate({
        path: "subcomments",
        options: { sort: { createdAt: -1 }, limit: 1 },
    });
    next();
});
//댓글 저장 시
//포스트 데이터 댓글 리스트에 추가, count + 1
CommentSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        this.createdAt = new Date();
        const postId = this.postId;
        const commentId = this._id;
        yield PostModel.findByIdAndUpdate(postId, {
            $push: {
                comments: commentId,
            },
            $inc: {
                commentsCount: 1,
            },
        });
        next();
    });
});
const CommentModel = mongoose.model("comments", CommentSchema);
export default CommentModel;
