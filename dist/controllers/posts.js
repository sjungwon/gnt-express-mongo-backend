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
import { uploadPostImageFilesWithTokenParser } from "../middleware/upload-s3.js";
import CategoryModel from "../models/category.js";
import CommentModel from "../models/comment.js";
import PostModel from "../models/post.js";
import SubcommentModel from "../models/subcomment.js";
import UserModel from "../models/userModel.js";
import S3 from "../storage/s3.js";
//최신 데이터 순으로 데이터를 전송하기 때문에
//단순 skip으로 페이지 구현하면
//첫번째 페이지를 전송한 이후에
//새로운 post가 추가되면
//다음 페이지 가져갈 때 첫번째 페이지 중 마지막 post를
//포함한 데이터를 전송하게 됨
// export const getTest = async (req: Request, res: Response) => {
//   const lastPost: string = (req.query.last as string) || "";
//   const limit = 3;
//   try {
//     if (!lastPost) {
//       const posts = await PostModel.find(
//         {},
//         {},
//         { sort: { createdAt: -1 }, limit }
//       );
//       return res.status(200).json(posts);
//     }
//     const posts = await PostModel.find(
//       {},
//       {},
//       { sort: { createdAt: -1 }, skip: limit * Number(lastPost), limit }
//     );
//     return res.status(200).json(posts);
//   } catch (err) {
//     return res
//       .status(defaultErrorCode["server error"])
//       .json(defaultErrorJson("server error", err));
//   }
// };
//페이지 구분 -> 특정 날짜를 기준으로 데이터 전송
//front에서 처음 요청한 경우가 아니면 마지막 데이터의 날짜를 ?last={value} 쿼리 스트링으로 전달
//해당 날 이후의 데이터를 전송
export const getPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const lastPost = req.query.last || "";
    try {
        if (!lastPost) {
            //첫 요청인 경우
            //생성일을 기준으로 정렬
            //6개씩 전송
            const posts = yield PostModel.find({}, {}, { sort: { createdAt: -1 }, limit: 6 });
            return res.status(200).json(posts);
        }
        //첫 요청이 아닌 경우
        //받아간 데이터의 생성일 이전 데이터 쿼리
        //생성일로 정렬, 6개 전송
        const posts = yield PostModel.find({
            createdAt: { $lt: new Date(lastPost) },
        }, {}, { sort: { createdAt: -1 }, limit: 6 });
        return res.status(200).json(posts);
    }
    catch (err) {
        return res
            .status(defaultErrorCode["server error"])
            .json(defaultErrorJson("server error", err));
    }
});
//카테고리별 포스트 요청 - 카테고리 아이디
export const getPostsByCategoryId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const categoryId = req.params.categoryId || "";
    if (!categoryId) {
        return res
            .status(defaultErrorCode["missing data"])
            .json(defaultErrorJson("missing data"));
    }
    const lastPost = req.query.last || "";
    try {
        if (!lastPost) {
            const posts = yield PostModel.find({ category: categoryId }, {}, { sort: { createdAt: -1 }, limit: 6 });
            return res.status(200).json(posts);
        }
        const posts = yield PostModel.find({
            category: categoryId,
            createdAt: { $lt: new Date(lastPost) },
        }, {}, { sort: { createdAt: -1 }, limit: 6 });
        return res.status(200).json(posts);
    }
    catch (err) {
        return res
            .status(defaultErrorCode["server error"])
            .json(defaultErrorJson("server error", err));
    }
});
//카테고리별 포스트 요청 - 카테고리 이름
export const getPostsByCategoryTitle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const categoryTitle = req.params.categoryTitle || "";
    if (!categoryTitle) {
        return res
            .status(defaultErrorCode["missing data"])
            .json(defaultErrorJson("missing data"));
    }
    const lastPost = req.query.last || "";
    try {
        const decodedTitle = decodeURIComponent(categoryTitle);
        const category = yield CategoryModel.findOne({ title: decodedTitle });
        if (!category) {
            return res
                .status(defaultErrorCode["not found"])
                .json(defaultErrorJson("not found"));
        }
        if (!lastPost) {
            const posts = yield PostModel.find({ category: category._id }, {}, { sort: { createdAt: -1 }, limit: 6 });
            return res.status(200).json(posts);
        }
        const posts = yield PostModel.find({
            category: category._id,
            createdAt: { $lt: new Date(lastPost) },
        }, {}, { sort: { createdAt: -1 }, limit: 6 });
        return res.status(200).json(posts);
    }
    catch (err) {
        return res
            .status(defaultErrorCode["server error"])
            .json(defaultErrorJson("server error", err));
    }
});
//프로필별 포스트 요청
export const getPostsByProfileId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const profileId = req.params.profileId || "";
    if (!profileId) {
        return res
            .status(defaultErrorCode["missing data"])
            .json(defaultErrorJson("missing data"));
    }
    const lastPost = req.query.last || "";
    try {
        if (!lastPost) {
            const posts = yield PostModel.find({ profile: profileId }, {}, { sort: { createdAt: -1 }, limit: 6 });
            return res.status(200).json(posts);
        }
        const posts = yield PostModel.find({
            profile: profileId,
            createdAt: { $lt: new Date(lastPost) },
        }, {}, { sort: { createdAt: -1 }, limit: 6 });
        return res.status(200).json(posts);
    }
    catch (err) {
        return res
            .status(defaultErrorCode["server error"])
            .json(defaultErrorJson("server error", err));
    }
});
//유저별 포스트 요청
export const getPostsByUsername = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.params.username || "";
    if (!username) {
        return res
            .status(defaultErrorCode["missing data"])
            .json(defaultErrorJson("missing data"));
    }
    const decodeUsername = decodeURIComponent(username);
    const lastPost = req.query.last || "";
    try {
        //존재하는 유저인지 확인
        const user = yield UserModel.findOne({ username: decodeUsername }, { select: "_id" });
        if (!user) {
            return res
                .status(defaultErrorCode["not found"])
                .json(defaultErrorJson("not found"));
        }
        //존재하는 경우
        if (!lastPost) {
            const posts = yield PostModel.find({ user: user._id }, {}, { sort: { createdAt: -1 }, limit: 6 });
            return res.status(200).json(posts);
        }
        const posts = yield PostModel.find({
            user: user._id,
            createdAt: { $lt: new Date(lastPost) },
        }, {}, { sort: { createdAt: -1 }, limit: 6 });
        return res.status(200).json(posts);
    }
    catch (err) {
        return res
            .status(defaultErrorCode["server error"])
            .json(defaultErrorJson("server error", err));
    }
});
//포스트 생성
//token parser
//formdata - multer
//s3 upload
const createPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = req.parseToken;
    const postReqData = req.body;
    if (!postReqData.profile || !postReqData.category) {
        return res
            .status(defaultErrorCode["missing data"])
            .json(defaultErrorJson("missing data"));
    }
    //middleware에서 처리한 포스트 이미지 배열
    //s3에 업로드 후 Key, URL 형태의 객체로 들어옴
    const postImages = req.postImageObjArr || [];
    //포스트 데이터
    const newPostData = {
        profile: new mongoose.Types.ObjectId(postReqData.profile),
        category: new mongoose.Types.ObjectId(postReqData.category),
        text: postReqData.text,
        user: new mongoose.Types.ObjectId(userData.id),
        postImages,
    };
    const newPost = new PostModel(newPostData);
    try {
        yield newPost.save();
        const resPostData = yield PostModel.findOne({ _id: newPost._id }).exec();
        return res.status(201).json(resPostData);
    }
    catch (error) {
        res.status(409).json({ error: error.message });
    }
});
export const createPostWithUploadS3AndTokenParser = [
    ...uploadPostImageFilesWithTokenParser,
    createPost,
];
//tokenParser
//form - multer
//upload s3
const updatePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = req.parseToken;
    const updatePostReqData = req.body;
    const postId = updatePostReqData._id;
    try {
        const prevPost = yield PostModel.findById(postId);
        //이전 데이터가 없는 경우
        if (!prevPost) {
            return res
                .status(defaultErrorCode["not found"])
                .json(defaultErrorJson("not found"));
        }
        //작성한 유저가 아닌 경우
        if (prevPost.user._id.toString() !== userData.id.toString()) {
            return res
                .status(defaultErrorCode["unauthorized request"])
                .json(defaultErrorJson("unauthorized request"));
        }
        //버켓 설정 안된 경우
        if (!process.env.S3_BUCKET_NAME) {
            return res.status(500).send("bucket name missing");
        }
        //업데이트할 데이터
        let updateData = {
            postImages: prevPost.postImages,
            text: updatePostReqData.text,
            profile: updatePostReqData.profile,
        };
        //제거된 이미지가 있으면 제거
        if (updatePostReqData.removedImages) {
            const removedImages = updatePostReqData.removedImages;
            let parsedRemovedImages;
            if (removedImages instanceof Array) {
                parsedRemovedImages = removedImages.map((imageString) => {
                    const parsedData = JSON.parse(imageString);
                    return {
                        Key: parsedData.Key,
                    };
                });
            }
            else {
                parsedRemovedImages = [
                    {
                        Key: JSON.parse(removedImages).Key,
                    },
                ];
            }
            const deleteParams = {
                Bucket: process.env.S3_BUCKET_NAME,
                Delete: {
                    Objects: parsedRemovedImages,
                },
            };
            yield S3.deleteObjects(deleteParams).promise();
            updateData = Object.assign(Object.assign({}, updateData), { postImages: updateData.postImages.filter((image) => !(parsedRemovedImages === null || parsedRemovedImages === void 0 ? void 0 : parsedRemovedImages.find((removedImage) => removedImage.Key === image.Key))) });
        }
        //추가된 이미지가 있으면 추가
        const newPostImages = req.postImageObjArr || [];
        updateData = Object.assign(Object.assign({}, updateData), { postImages: [...updateData.postImages, ...newPostImages] });
        const updatedPost = yield PostModel.findByIdAndUpdate(postId, updateData, {
            new: true,
        });
        res.status(201).json(updatedPost);
    }
    catch (error) {
        res.status(409).json({ error: error.message });
    }
});
export const updatePostWithUploadS3AndTokenParser = [
    ...uploadPostImageFilesWithTokenParser,
    updatePost,
];
const blockPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = req.parseToken;
    const postId = req.params["id"];
    try {
        const post = yield PostModel.findById(postId);
        //포스트가 없는 경우
        if (!post) {
            return res
                .status(defaultErrorCode["not found"])
                .json(defaultErrorJson("not found"));
        }
        //포스트 카테고리 쿼리 - 카테고리 관리자 확인
        const category = yield CategoryModel.findById(post.category._id);
        if (!category) {
            return res
                .status(defaultErrorCode["not found"])
                .json(defaultErrorJson("not found"));
        }
        //관리자 확인
        if (category.user._id.toString() !== userData.id.toString()) {
            return res
                .status(defaultErrorCode["unauthorized request"])
                .json(defaultErrorJson("unauthorized request"));
        }
        //이미지 제거
        if (post.postImages.length) {
            if (!process.env.S3_BUCKET_NAME) {
                return res.status(500).send("bucket name missing");
            }
            const removeKeys = post.postImages.map((imageObj) => ({
                Key: imageObj.Key,
            }));
            const deleteParams = {
                Bucket: process.env.S3_BUCKET_NAME,
                Delete: {
                    Objects: removeKeys,
                },
            };
            yield S3.deleteObjects(deleteParams).promise();
        }
        //차단
        yield PostModel.findByIdAndUpdate(postId, {
            postImages: [],
            text: "차단된 포스트",
            blocked: true,
        });
        return res.status(201).send("block post successfully");
    }
    catch (err) {
        return res
            .status(defaultErrorCode["server error"])
            .json(defaultErrorJson("server error", err));
    }
});
export const blockPostWithTokenParser = [tokenParser, blockPost];
const deletePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = req.parseToken;
    const postId = req.params["id"];
    try {
        const post = yield PostModel.findById(postId);
        //포스트 없는 경우
        if (!post) {
            return res
                .status(defaultErrorCode["not found"])
                .json(defaultErrorJson("not found"));
        }
        //작성자가 아닌 경우
        if (post.user._id.toString() !== userData.id.toString()) {
            return res
                .status(defaultErrorCode["unauthorized request"])
                .json(defaultErrorJson("unauthorized request"));
        }
        //이미지 제거
        if (post.postImages.length) {
            if (!process.env.S3_BUCKET_NAME) {
                return res.status(500).send("bucket name missing");
            }
            const removeKeys = post.postImages.map((imageObj) => ({
                Key: imageObj.Key,
            }));
            const deleteParams = {
                Bucket: process.env.S3_BUCKET_NAME,
                Delete: {
                    Objects: removeKeys,
                },
            };
            yield S3.deleteObjects(deleteParams).promise();
        }
        //포스트에 포함된 댓글 제거, 대댓글 제거
        yield SubcommentModel.deleteMany({ postId });
        yield CommentModel.deleteMany({ postId });
        //포스트 제거
        yield PostModel.findByIdAndDelete(postId);
        return res.status(200).send("delete post successfully");
    }
    catch (err) {
        return res
            .status(defaultErrorCode["server error"])
            .json(defaultErrorJson("server error", err));
    }
});
export const deletePostWithTokenParser = [tokenParser, deletePost];
//좋아요 처리
//token parser
export const likePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = req.parseToken;
    const postId = req.params["id"];
    const type = req.body.type;
    if (!postId || !type) {
        return res
            .status(defaultErrorCode["missing data"])
            .json(defaultErrorJson("missing data"));
    }
    try {
        const prevLikeData = yield PostModel.findById(postId);
        //post가 없는 경우
        if (!prevLikeData) {
            return res
                .status(defaultErrorCode["not found"])
                .json(defaultErrorJson("not found"));
        }
        switch (type) {
            case "create": {
                yield PostModel.findByIdAndUpdate(postId, {
                    $inc: { likes: 1 },
                    $push: { likeUsers: userData.id },
                }, { new: true });
                break;
            }
            case "delete": {
                yield PostModel.findByIdAndUpdate(postId, {
                    $inc: { likes: -1 },
                    $pull: { likeUsers: userData.id },
                }, { new: true });
                break;
            }
            default: {
                yield PostModel.findByIdAndUpdate(postId, {
                    $inc: { likes: 1, dislikes: -1 },
                    $pull: { dislikeUsers: userData.id },
                    $push: { likeUsers: userData.id },
                }, { new: true });
                break;
            }
        }
        return res.status(201).send("handle like successfully");
    }
    catch (err) {
        return res
            .status(defaultErrorCode["server error"])
            .json(defaultErrorJson("server error", err));
    }
});
export const likePostWithTokenParser = [tokenParser, likePost];
//포스트 싫어요
export const dislikePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = req.parseToken;
    const postId = req.params["id"];
    const type = req.body.type;
    if (!postId || !type) {
        return res
            .status(defaultErrorCode["missing data"])
            .json(defaultErrorJson("missing data"));
    }
    try {
        const prevLikeData = yield PostModel.findById(postId);
        //포스트가 없는 경우
        if (!prevLikeData) {
            return res
                .status(defaultErrorCode["not found"])
                .json(defaultErrorJson("not found"));
        }
        switch (type) {
            case "create": {
                yield PostModel.findByIdAndUpdate(postId, {
                    $inc: { dislikes: 1 },
                    $push: { dislikeUsers: userData.id },
                }, { new: true });
                break;
            }
            case "delete": {
                yield PostModel.findByIdAndUpdate(postId, {
                    $inc: { dislikes: -1 },
                    $pull: { dislikeUsers: userData.id },
                }, { new: true });
                break;
            }
            default: {
                yield PostModel.findByIdAndUpdate(postId, {
                    $inc: { likes: -1, dislikes: 1 },
                    $pull: { likeUsers: userData.id },
                    $push: { dislikeUsers: userData.id },
                }, { new: true });
                break;
            }
        }
        return res.status(201).send("handle dislike successfully");
    }
    catch (err) {
        return res
            .status(defaultErrorCode["server error"])
            .json(defaultErrorJson("server error", err));
    }
});
export const dislikePostWithTokenParser = [tokenParser, dislikePost];
