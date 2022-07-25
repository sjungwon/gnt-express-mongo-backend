var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { defaultErrorCode, defaultErrorJson, } from "../functions/errorJsonGen.js";
import tokenParser from "../middleware/token-parser.js";
import CategoryModel from "../models/category.js";
import CommentModel from "../models/comment.js";
import SubcommentModel from "../models/subcomment.js";
//대댓글 더보기
//댓글 id, 마지막 대댓글 날짜
export const getMoreSubcomments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const commentId = req.params["commentId"];
    const lastSubcommentDate = req.params["lastDate"];
    if (!commentId || !lastSubcommentDate) {
        return res
            .status(defaultErrorCode["missing data"])
            .json(defaultErrorJson("missing data"));
    }
    try {
        const subcomments = yield SubcommentModel.find({ commentId, createdAt: { $lt: new Date(lastSubcommentDate) } }, {}, { sort: { createdAt: -1 }, limit: 3 });
        return res.status(200).json(subcomments);
    }
    catch (err) {
        return res
            .status(defaultErrorCode["server error"])
            .json(defaultErrorJson("server error", err));
    }
});
//대댓글 생성
//tokenParser
const createSubcomment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = req.parseToken;
    const createSubCommentData = req.body;
    if (!createSubCommentData.postId ||
        !createSubCommentData.commentId ||
        !createSubCommentData.category ||
        !createSubCommentData.profile ||
        !createSubCommentData.text) {
        return res
            .status(defaultErrorCode["missing data"])
            .json(defaultErrorJson("missing data"));
    }
    const data = {
        user: userData.id,
        postId: createSubCommentData.postId,
        commentId: createSubCommentData.commentId,
        category: createSubCommentData.category,
        profile: createSubCommentData.profile,
        text: createSubCommentData.text,
    };
    try {
        const newSubcomment = new SubcommentModel(data);
        yield newSubcomment.save();
        const resData = yield SubcommentModel.findById(newSubcomment._id);
        return res.status(201).json(resData);
    }
    catch (err) {
        return res
            .status(defaultErrorCode["server error"])
            .json(defaultErrorJson("server error", err));
    }
});
export const createSubcommentWithParsedToken = [tokenParser, createSubcomment];
//댓글 제거
//tokenParser
const deleteSubcomment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = req.parseToken;
    const subcommentId = req.params["id"];
    if (!subcommentId) {
        return res
            .status(defaultErrorCode["missing data"])
            .json(defaultErrorJson("missing data"));
    }
    try {
        const findedSubcomment = yield SubcommentModel.findById(subcommentId);
        //대댓글이 없는 경우
        if (!findedSubcomment) {
            return res
                .status(defaultErrorCode["not found"])
                .json(defaultErrorJson("not found"));
        }
        //대댓글 작성자가 아닌 경우
        if (findedSubcomment.user._id.toString() !== userData.id.toString()) {
            return res
                .status(defaultErrorCode["unauthorized request"])
                .json(defaultErrorJson("unauthorized request"));
        }
        //댓글 데이터 대댓글 리스트에서 제거할 대댓글 제거, 대댓글 count - 1
        yield CommentModel.findByIdAndUpdate(findedSubcomment.commentId, {
            $inc: {
                subcommentsCount: -1,
            },
            $pull: {
                subcomments: findedSubcomment._id,
            },
        });
        //제거
        yield SubcommentModel.findByIdAndDelete(subcommentId);
        return res.status(200).send(findedSubcomment);
    }
    catch (err) {
        return res
            .status(defaultErrorCode["server error"])
            .json(defaultErrorJson("server error", err));
    }
});
export const deleteSubcommentWithParsedToken = [tokenParser, deleteSubcomment];
//대댓글 수정
//tokenParser
const updateSubcomment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = req.parseToken;
    const updateSubcommentData = req.body;
    if (!updateSubcommentData._id ||
        !updateSubcommentData.profile ||
        !updateSubcommentData.text) {
        return res
            .status(defaultErrorCode["missing data"])
            .json(defaultErrorJson("missing data"));
    }
    try {
        const findedSubcomment = yield SubcommentModel.findById(updateSubcommentData._id);
        //대댓글이 없는 경우
        if (!findedSubcomment) {
            return res
                .status(defaultErrorCode["not found"])
                .json(defaultErrorJson("not found"));
        }
        //대댓글 작성자가 아닌 경우
        if (findedSubcomment.user._id.toString() !== userData.id.toString()) {
            return res
                .status(defaultErrorCode["unauthorized request"])
                .json(defaultErrorJson("unauthorized request"));
        }
        const updateData = {
            profile: updateSubcommentData.profile,
            text: updateSubcommentData.text,
        };
        const resData = yield SubcommentModel.findByIdAndUpdate(updateSubcommentData._id, updateData, { new: true });
        return res.status(201).json(resData);
    }
    catch (err) {
        return res
            .status(defaultErrorCode["server error"])
            .json(defaultErrorJson("server error", err));
    }
});
export const updateSubcommentWithParsedToken = [tokenParser, updateSubcomment];
//대댓글 차단
//tokenParser
const blockSubcomment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = req.parseToken;
    const subcommentId = req.params["id"];
    if (!subcommentId) {
        return res
            .status(defaultErrorCode["missing data"])
            .json(defaultErrorJson("missing data"));
    }
    try {
        const subcomment = yield SubcommentModel.findById(subcommentId);
        //대댓글 없는 경우
        if (!subcomment) {
            return res
                .status(defaultErrorCode["not found"])
                .json(defaultErrorJson("not found"));
        }
        const category = yield CategoryModel.findById(subcomment.category._id);
        //카테고리 없는 경우
        if (!category) {
            return res
                .status(defaultErrorCode["not found"])
                .json(defaultErrorJson("not found"));
        }
        //관리자가 아닌 경우
        if (category.user._id.toString() !== userData.id.toString()) {
            return res
                .status(defaultErrorCode["unauthorized request"])
                .json(defaultErrorJson("unauthorized request"));
        }
        //댓글 차단
        yield SubcommentModel.findByIdAndUpdate(subcommentId, {
            text: "차단된 댓글",
            blocked: true,
        });
        return res.status(201).send("block subcomment successfully");
    }
    catch (err) {
        return res
            .status(defaultErrorCode["server error"])
            .json(defaultErrorJson("server error", err));
    }
});
export const blockSubcommentWithParsedToken = [tokenParser, blockSubcomment];
