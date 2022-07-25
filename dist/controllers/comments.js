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
import { defaultErrorCode, defaultErrorJson, } from "../functions/errorJsonGen.js";
import tokenParser from "../middleware/token-parser.js";
import CategoryModel from "../models/category.js";
import CommentModel from "../models/comment.js";
import PostModel from "../models/post.js";
import SubcommentModel from "../models/subcomment.js";
//댓글 더보기
//포스트 전송시에 3개만 전송
//추가 댓글은 더보기로 요청
export const getMoreComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const postId = req.params["postId"];
    const lastCommentDate = req.params["lastDate"];
    //포스트 또는 마지막 요소의 날짜가 없는 경우
    if (!postId || !lastCommentDate) {
        return res
            .status(defaultErrorCode["missing data"])
            .json(defaultErrorJson("missing data"));
    }
    //댓글 반환
    try {
        const comments = yield CommentModel.find({
            postId,
            createdAt: { $lt: new Date(lastCommentDate) },
        }, {}, { sort: { createdAt: -1 }, limit: 3 });
        return res.status(200).json(comments);
    }
    catch (err) {
        return res.status(500).json(defaultErrorJson("server error", err));
    }
});
//댓글 추가
//token parser
const createComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = req.parseToken;
    const reqData = req.body;
    if (!(reqData === null || reqData === void 0 ? void 0 : reqData.profile) ||
        !reqData.text ||
        !reqData.postId ||
        !reqData.category) {
        return res
            .status(defaultErrorCode["missing data"])
            .json(defaultErrorJson("missing data"));
    }
    const commentData = {
        user: userData.id,
        category: new mongoose.Types.ObjectId(reqData.category),
        postId: new mongoose.Types.ObjectId(reqData.postId),
        profile: new mongoose.Types.ObjectId(reqData.profile),
        text: reqData.text,
    };
    //데이터 삽입 + mongoose middleware에서 post에 commentid 삽입, commentsCount 증가시킴
    try {
        const newComment = new CommentModel(commentData);
        yield newComment.save();
        const resData = yield CommentModel.findById(newComment._id);
        return res.status(201).json(resData);
    }
    catch (err) {
        return res
            .status(defaultErrorCode["server error"])
            .json(defaultErrorJson("server error"));
    }
});
export const createCommentWithTokenParser = [tokenParser, createComment];
//댓글 수정
const updateComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = req.parseToken;
    const commentId = req.params["id"];
    if (!commentId) {
        return res
            .status(defaultErrorCode["missing data"])
            .json(defaultErrorJson("missing data"));
    }
    const reqData = req.body;
    if (!reqData.profile || !reqData.text) {
        return res
            .status(defaultErrorCode["missing data"])
            .json(defaultErrorJson("missing data"));
    }
    try {
        const updateComment = yield CommentModel.findByIdAndUpdate(commentId, reqData, {
            new: true,
        });
        return res.status(201).json(updateComment);
    }
    catch (err) {
        return res
            .status(defaultErrorCode["server error"])
            .json(defaultErrorJson("server error", err));
    }
});
export const updateCommentWithTokenParser = [tokenParser, updateComment];
//댓글 차단
const blockComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = req.parseToken;
    const commentId = req.params["id"];
    if (!commentId) {
        return res
            .status(defaultErrorCode["missing data"])
            .json(defaultErrorJson("missing data"));
    }
    try {
        const comment = yield CommentModel.findById(commentId);
        //차단하려는 댓글이 없는 경우
        if (!comment) {
            return res
                .status(defaultErrorCode["not found"])
                .json(defaultErrorJson("not found"));
        }
        const category = yield CategoryModel.findById(comment.category._id);
        //댓글이 포함된 카테고리가 존재하지 않는 경우
        if (!category) {
            return res
                .status(defaultErrorCode["not found"])
                .json(defaultErrorJson("not found"));
        }
        //카테고리 관리자가 아닌 경우
        if (category.user._id.toString() !== userData.id.toString()) {
            return res
                .status(defaultErrorCode["unauthorized request"])
                .json(defaultErrorJson("unauthorized request"));
        }
        //차단
        yield CommentModel.findByIdAndUpdate(commentId, {
            text: "차단된 댓글",
            blocked: true,
        });
        return res.status(201).send("block comment successfully");
    }
    catch (err) {
        return res
            .status(defaultErrorCode["server error"])
            .json(defaultErrorJson("server error", err));
    }
});
export const blockCommentWithTokenParser = [tokenParser, blockComment];
//댓글 삭제
const deleteComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = req.parseToken;
    const commentId = req.params["id"];
    if (!commentId) {
        return res
            .status(defaultErrorCode["missing data"])
            .json(defaultErrorJson("missing data"));
    }
    try {
        const comment = yield CommentModel.findById(commentId);
        //댓글이 없는 경우
        if (!comment) {
            return res
                .status(defaultErrorCode["not found"])
                .json(defaultErrorJson("not found"));
        }
        //작성자가 아닌 경우
        if (comment.user._id.toString() !== userData.id.toString()) {
            return res
                .status(defaultErrorCode["unauthorized request"])
                .json(defaultErrorJson("unauthorized request"));
        }
        //포스트 데이터 댓글 목록에서 제거, count - 1
        yield PostModel.findByIdAndUpdate(comment.postId, {
            $pull: {
                comments: commentId,
            },
            $inc: {
                commentsCount: -1,
            },
        });
        //댓글에 달린 대댓글 모두 제거
        yield SubcommentModel.deleteMany({ commentId });
        //댓글 제거
        yield CommentModel.findByIdAndDelete(commentId);
        return res.status(200).json(comment);
    }
    catch (err) {
        return res
            .status(defaultErrorCode["server error"])
            .json(defaultErrorJson("server error", err));
    }
});
export const deleteCommentWithTokenParser = [tokenParser, deleteComment];
