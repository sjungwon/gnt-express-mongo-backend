import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  defaultErrorCode,
  defaultErrorJson,
} from "../functions/errorJsonGen.js";
import { TokenPayload } from "../functions/token.js";
import tokenParser from "../middleware/token-parser.js";
import { uploadPostImageFilesWithTokenParser } from "../middleware/upload-s3.js";
import CategoryModel from "../models/category.js";
import CommentModel from "../models/comment.js";
import PostModel, { PostType } from "../models/post.js";
import SubcommentModel from "../models/subcomment.js";
import UserModel from "../models/userModel.js";
import S3 from "../storage/s3.js";

interface AddPostReqData {
  profile: string;
  category: string;
  text: string;
}

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
export const getPosts = async (req: Request, res: Response) => {
  const lastPost: string = (req.query.last as string) || "";

  try {
    if (!lastPost) {
      //첫 요청인 경우
      //생성일을 기준으로 정렬
      //6개씩 전송
      const posts = await PostModel.find(
        {},
        {},
        { sort: { createdAt: -1 }, limit: 6 }
      );
      return res.status(200).json(posts);
    }
    //첫 요청이 아닌 경우
    //받아간 데이터의 생성일 이전 데이터 쿼리
    //생성일로 정렬, 6개 전송
    const posts = await PostModel.find(
      {
        createdAt: { $lt: new Date(lastPost) },
      },
      {},
      { sort: { createdAt: -1 }, limit: 6 }
    );
    return res.status(200).json(posts);
  } catch (err) {
    return res
      .status(defaultErrorCode["server error"])
      .json(defaultErrorJson("server error", err));
  }
};

//카테고리별 포스트 요청
export const getPostsByCategoryId = async (req: Request, res: Response) => {
  const categoryId: string = (req.params.categoryId as string) || "";

  if (!categoryId) {
    return res
      .status(defaultErrorCode["missing data"])
      .json(defaultErrorJson("missing data"));
  }

  const lastPost: string = (req.query.last as string) || "";

  try {
    if (!lastPost) {
      const posts = await PostModel.find(
        { category: categoryId },
        {},
        { sort: { createdAt: -1 }, limit: 6 }
      );
      return res.status(200).json(posts);
    }
    const posts = await PostModel.find(
      {
        category: categoryId,
        createdAt: { $lt: new Date(lastPost) },
      },
      {},
      { sort: { createdAt: -1 }, limit: 6 }
    );
    return res.status(200).json(posts);
  } catch (err) {
    return res
      .status(defaultErrorCode["server error"])
      .json(defaultErrorJson("server error", err));
  }
};

//프로필별 포스트 요청
export const getPostsByProfileId = async (req: Request, res: Response) => {
  const profileId: string = (req.params.profileId as string) || "";

  if (!profileId) {
    return res
      .status(defaultErrorCode["missing data"])
      .json(defaultErrorJson("missing data"));
  }

  const lastPost: string = (req.query.last as string) || "";

  try {
    if (!lastPost) {
      const posts = await PostModel.find(
        { profile: profileId },
        {},
        { sort: { createdAt: -1 }, limit: 6 }
      );
      return res.status(200).json(posts);
    }
    const posts = await PostModel.find(
      {
        profile: profileId,
        createdAt: { $lt: new Date(lastPost) },
      },
      {},
      { sort: { createdAt: -1 }, limit: 6 }
    );
    return res.status(200).json(posts);
  } catch (err) {
    return res
      .status(defaultErrorCode["server error"])
      .json(defaultErrorJson("server error", err));
  }
};

//유저별 포스트 요청
export const getPostsByUsername = async (req: Request, res: Response) => {
  const username: string = (req.params.username as string) || "";

  if (!username) {
    return res
      .status(defaultErrorCode["missing data"])
      .json(defaultErrorJson("missing data"));
  }

  const decodeUsername = decodeURIComponent(username);

  const lastPost: string = (req.query.last as string) || "";

  try {
    //존재하는 유저인지 확인
    const user = await UserModel.findOne(
      { username: decodeUsername },
      { select: "_id" }
    );
    if (!user) {
      return res
        .status(defaultErrorCode["not found"])
        .json(defaultErrorJson("not found"));
    }
    //존재하는 경우
    if (!lastPost) {
      const posts = await PostModel.find(
        { user: user._id },
        {},
        { sort: { createdAt: -1 }, limit: 6 }
      );
      return res.status(200).json(posts);
    }
    const posts = await PostModel.find(
      {
        user: user._id,
        createdAt: { $lt: new Date(lastPost) },
      },
      {},
      { sort: { createdAt: -1 }, limit: 6 }
    );
    return res.status(200).json(posts);
  } catch (err) {
    return res
      .status(defaultErrorCode["server error"])
      .json(defaultErrorJson("server error", err));
  }
};

//포스트 생성
//token parser
//formdata - multer
//s3 upload
const createPost = async (req: Request, res: Response) => {
  const userData = req.parseToken as TokenPayload;

  const postReqData = req.body as AddPostReqData;
  if (!postReqData.profile || !postReqData.category) {
    return res
      .status(defaultErrorCode["missing data"])
      .json(defaultErrorJson("missing data"));
  }

  //middleware에서 처리한 포스트 이미지 배열
  //s3에 업로드 후 Key, URL 형태의 객체로 들어옴
  const postImages = req.postImageObjArr || [];

  //포스트 데이터
  const newPostData: PostType = {
    profile: new mongoose.Types.ObjectId(postReqData.profile),
    category: new mongoose.Types.ObjectId(postReqData.category),
    text: postReqData.text,
    user: new mongoose.Types.ObjectId(userData.id),
    postImages,
  };

  const newPost = new PostModel(newPostData);

  try {
    await newPost.save();

    const resPostData = await PostModel.findOne({ _id: newPost._id }).exec();

    return res.status(201).json(resPostData);
  } catch (error: any) {
    res.status(409).json({ error: error.message });
  }
};

export const createPostWithUploadS3AndTokenParser = [
  ...uploadPostImageFilesWithTokenParser,
  createPost,
];

interface ImageType {
  URL: string;
  Key: string;
}

interface UpdatePostReqData extends AddPostReqData {
  removedImages?: string[] | string;
  _id: string;
}

//tokenParser
//form - multer
//upload s3
const updatePost = async (req: Request, res: Response) => {
  const userData = req.parseToken as TokenPayload;

  const updatePostReqData = req.body as UpdatePostReqData;

  const postId = updatePostReqData._id;

  try {
    const prevPost = await PostModel.findById(postId);

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

    interface UpdatePostDataType {
      profile: string;
      text: string;
      postImages: ImageType[];
    }

    //업데이트할 데이터
    let updateData: UpdatePostDataType = {
      postImages: prevPost.postImages,
      text: updatePostReqData.text,
      profile: updatePostReqData.profile,
    };

    //제거된 이미지가 있으면 제거
    if (updatePostReqData.removedImages) {
      const removedImages = updatePostReqData.removedImages;
      let parsedRemovedImages: undefined | { Key: string }[];
      if (removedImages instanceof Array) {
        parsedRemovedImages = removedImages.map((imageString) => {
          const parsedData = JSON.parse(imageString) as ImageType;
          return {
            Key: parsedData.Key,
          };
        });
      } else {
        parsedRemovedImages = [
          {
            Key: (JSON.parse(removedImages) as ImageType).Key,
          },
        ];
      }
      const deleteParams: AWS.S3.DeleteObjectsRequest = {
        Bucket: process.env.S3_BUCKET_NAME,
        Delete: {
          Objects: parsedRemovedImages,
        },
      };
      await S3.deleteObjects(deleteParams).promise();
      updateData = {
        ...updateData,
        postImages: updateData.postImages.filter(
          (image) =>
            !parsedRemovedImages?.find(
              (removedImage) => removedImage.Key === image.Key
            )
        ),
      };
    }

    //추가된 이미지가 있으면 추가
    const newPostImages = req.postImageObjArr || [];
    updateData = {
      ...updateData,
      postImages: [...updateData.postImages, ...newPostImages],
    };

    const updatedPost = await PostModel.findByIdAndUpdate(postId, updateData, {
      new: true,
    });

    res.status(201).json(updatedPost);
  } catch (error: any) {
    res.status(409).json({ error: error.message });
  }
};

export const updatePostWithUploadS3AndTokenParser = [
  ...uploadPostImageFilesWithTokenParser,
  updatePost,
];

const blockPost = async (req: Request, res: Response) => {
  const userData = req.parseToken as TokenPayload;

  const postId = req.params["id"] as string;

  try {
    const post = await PostModel.findById(postId);

    //포스트가 없는 경우
    if (!post) {
      return res
        .status(defaultErrorCode["not found"])
        .json(defaultErrorJson("not found"));
    }

    //포스트 카테고리 쿼리 - 카테고리 관리자 확인
    const category = await CategoryModel.findById(post.category._id);
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
      const deleteParams: AWS.S3.DeleteObjectsRequest = {
        Bucket: process.env.S3_BUCKET_NAME,
        Delete: {
          Objects: removeKeys,
        },
      };
      await S3.deleteObjects(deleteParams).promise();
    }

    //차단
    await PostModel.findByIdAndUpdate(postId, {
      postImages: [],
      text: "차단된 포스트",
      blocked: true,
    });
    return res.status(201).send("block post successfully");
  } catch (err) {
    return res
      .status(defaultErrorCode["server error"])
      .json(defaultErrorJson("server error", err));
  }
};

export const blockPostWithTokenParser = [tokenParser, blockPost];

const deletePost = async (req: Request, res: Response) => {
  const userData = req.parseToken as TokenPayload;

  const postId = req.params["id"] as string;

  try {
    const post = await PostModel.findById(postId);
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
      const deleteParams: AWS.S3.DeleteObjectsRequest = {
        Bucket: process.env.S3_BUCKET_NAME,
        Delete: {
          Objects: removeKeys,
        },
      };
      await S3.deleteObjects(deleteParams).promise();
    }
    //포스트에 포함된 댓글 제거, 대댓글 제거
    await SubcommentModel.deleteMany({ postId });
    await CommentModel.deleteMany({ postId });

    //포스트 제거
    await PostModel.findByIdAndDelete(postId);
    return res.status(200).send("delete post successfully");
  } catch (err) {
    return res
      .status(defaultErrorCode["server error"])
      .json(defaultErrorJson("server error", err));
  }
};

export const deletePostWithTokenParser = [tokenParser, deletePost];

//좋아요 처리
//token parser
export const likePost = async (req: Request, res: Response) => {
  const userData = req.parseToken as TokenPayload;

  const postId = req.params["id"];

  const type = req.body.type as "create" | "update" | "delete";

  if (!postId || !type) {
    return res
      .status(defaultErrorCode["missing data"])
      .json(defaultErrorJson("missing data"));
  }

  try {
    const prevLikeData = await PostModel.findById(postId);

    //post가 없는 경우
    if (!prevLikeData) {
      return res
        .status(defaultErrorCode["not found"])
        .json(defaultErrorJson("not found"));
    }

    switch (type) {
      case "create": {
        await PostModel.findByIdAndUpdate(
          postId,
          {
            $inc: { likes: 1 },
            $push: { likeUsers: userData.id },
          },
          { new: true }
        );
        break;
      }
      case "delete": {
        await PostModel.findByIdAndUpdate(
          postId,
          {
            $inc: { likes: -1 },
            $pull: { likeUsers: userData.id },
          },
          { new: true }
        );
        break;
      }
      default: {
        await PostModel.findByIdAndUpdate(
          postId,
          {
            $inc: { likes: 1, dislikes: -1 },
            $pull: { dislikeUsers: userData.id },
            $push: { likeUsers: userData.id },
          },
          { new: true }
        );
        break;
      }
    }

    return res.status(201).send("handle like successfully");
  } catch (err) {
    return res
      .status(defaultErrorCode["server error"])
      .json(defaultErrorJson("server error", err));
  }
};

export const likePostWithTokenParser = [tokenParser, likePost];

//포스트 싫어요
export const dislikePost = async (req: Request, res: Response) => {
  const userData = req.parseToken as TokenPayload;

  const postId = req.params["id"];

  const type = req.body.type as "create" | "update" | "delete";

  if (!postId || !type) {
    return res
      .status(defaultErrorCode["missing data"])
      .json(defaultErrorJson("missing data"));
  }

  try {
    const prevLikeData = await PostModel.findById(postId);

    //포스트가 없는 경우
    if (!prevLikeData) {
      return res
        .status(defaultErrorCode["not found"])
        .json(defaultErrorJson("not found"));
    }

    switch (type) {
      case "create": {
        await PostModel.findByIdAndUpdate(
          postId,
          {
            $inc: { dislikes: 1 },
            $push: { dislikeUsers: userData.id },
          },
          { new: true }
        );
        break;
      }
      case "delete": {
        await PostModel.findByIdAndUpdate(
          postId,
          {
            $inc: { dislikes: -1 },
            $pull: { dislikeUsers: userData.id },
          },
          { new: true }
        );
        break;
      }
      default: {
        await PostModel.findByIdAndUpdate(
          postId,
          {
            $inc: { likes: -1, dislikes: 1 },
            $pull: { likeUsers: userData.id },
            $push: { dislikeUsers: userData.id },
          },
          { new: true }
        );
        break;
      }
    }

    return res.status(201).send("handle dislike successfully");
  } catch (err) {
    return res
      .status(defaultErrorCode["server error"])
      .json(defaultErrorJson("server error", err));
  }
};

export const dislikePostWithTokenParser = [tokenParser, dislikePost];
