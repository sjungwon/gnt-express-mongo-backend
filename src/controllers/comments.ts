import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  defaultErrorCode,
  defaultErrorJson,
} from "../functions/errorJsonGen.js";
import { TokenPayload } from "../functions/token.js";
import CommentModel, { CommentType } from "../models/comment.js";
import PostModel from "../models/post.js";
import SubcommentModel from "../models/subcomment.js";

interface AddCommentReqData {
  postId?: string;
  profile?: string;
  text?: string;
}

export const getMoreComment = async (req: Request, res: Response) => {
  const postId = req.params["postId"];
  const lastCommentDate = req.params["lastDate"];

  if (!postId || !lastCommentDate) {
    return res
      .status(defaultErrorCode["missing data"])
      .json(defaultErrorJson("missing data"));
  }

  try {
    const comments = await CommentModel.find(
      {
        postId,
        createdAt: { $lt: new Date(lastCommentDate) },
      },
      {},
      { sort: { createdAt: -1 }, limit: 3 }
    );
    return res.status(200).json(comments);
  } catch (err) {
    return res.status(500).json(defaultErrorJson("server error", err));
  }
};

export const addComment = async (req: Request, res: Response) => {
  const userData = req.parseToken as TokenPayload;

  const reqData: AddCommentReqData = req.body;

  if (!reqData?.profile || !reqData.text || !reqData.postId) {
    return res
      .status(defaultErrorCode["missing data"])
      .json(defaultErrorJson("missing data"));
  }

  const commentData: CommentType = {
    user: userData.id,
    postId: new mongoose.Types.ObjectId(reqData.postId),
    profile: new mongoose.Types.ObjectId(reqData.profile),
    text: reqData.text,
  };

  //데이터 삽입 + post에 commentid 삽입
  try {
    const newComment = new CommentModel(commentData);

    await newComment.save();

    const resData = await CommentModel.findById(newComment._id);
    return res.status(201).json(resData);
  } catch (err) {
    return res
      .status(defaultErrorCode["server error"])
      .json(defaultErrorJson("server error"));
  }
};

export const updateComment = async (req: Request, res: Response) => {
  const userData = req.parseToken as TokenPayload;

  const commentId = req.params["id"];
  if (!commentId) {
    return res
      .status(defaultErrorCode["missing data"])
      .json(defaultErrorJson("missing data"));
  }

  interface UpdateCommentReqData {
    text?: string;
    profile?: string;
  }

  const reqData = req.body as UpdateCommentReqData;

  if (!reqData.profile || !reqData.text) {
    return res
      .status(defaultErrorCode["missing data"])
      .json(defaultErrorJson("missing data"));
  }

  try {
    const updateComment = await CommentModel.findByIdAndUpdate(
      commentId,
      reqData,
      {
        new: true,
      }
    );

    return res.status(201).json(updateComment);
  } catch (err) {
    return res
      .status(defaultErrorCode["server error"])
      .json(defaultErrorJson("server error", err));
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  const userData = req.parseToken as TokenPayload;

  const commentId = req.params["id"];
  if (!commentId) {
    return res
      .status(defaultErrorCode["missing data"])
      .json(defaultErrorJson("missing data"));
  }

  try {
    const comment = await CommentModel.findById(commentId);

    if (!comment) {
      return res
        .status(defaultErrorCode["not found"])
        .json(defaultErrorJson("not found"));
    }

    if (comment.user._id.toString() !== userData.id.toString()) {
      return res
        .status(defaultErrorCode["unauthorized request"])
        .json(defaultErrorJson("unauthorized request"));
    }

    await PostModel.findByIdAndUpdate(comment.postId, {
      $pull: {
        comments: commentId,
      },
      $inc: {
        commentsCount: -1,
      },
    });

    await SubcommentModel.deleteMany({ commentId });

    await CommentModel.findByIdAndDelete(commentId);

    return res.status(200).json(comment);
  } catch (err) {
    return res
      .status(defaultErrorCode["server error"])
      .json(defaultErrorJson("server error", err));
  }
};
