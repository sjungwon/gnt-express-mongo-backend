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
import CommentModel from "./comment.js";
const SubcommentSchema = new mongoose.Schema({
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
    category: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "categories",
        require: true,
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
    blocked: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: new Date(),
    },
});
//저장시
//현재 날짜 저장
//댓글 데이터의 대댓글 리스트에 추가 & 대댓글 count + 1
SubcommentSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        this.createdAt = new Date();
        const commentId = this.commentId;
        yield CommentModel.findByIdAndUpdate(commentId, {
            $inc: {
                subcommentsCount: 1,
            },
            $push: {
                subcomments: this._id,
            },
        });
        next();
    });
});
//대댓글 쿼리시
//프로필, 유저, 카테고리 조인
SubcommentSchema.pre(/^find/, function (next) {
    this.populate({ path: "profile" });
    this.populate({ path: "user", select: "username" });
    this.populate({ path: "category", select: "title" });
    next();
});
const SubcommentModel = mongoose.model("subcomments", SubcommentSchema);
export default SubcommentModel;
