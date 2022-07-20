import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  defaultErrorCode,
  defaultErrorJson,
} from "../functions/errorJsonGen.js";
import { TokenPayload } from "../functions/token.js";
import tokenParser from "../middleware/token-parser.js";
import CommentModel from "../models/comment.js";
import SubcommentModel from "../models/subcomment.js";

export const getMoreSubcomments = async (req: Request, res: Response) => {
  const commentId = req.params["commentId"];
  const lastSubcommentDate = req.params["lastDate"];

  if (!commentId || !lastSubcommentDate) {
    return res
      .status(defaultErrorCode["missing data"])
      .json(defaultErrorJson("missing data"));
  }

  try {
    const subcomments = await SubcommentModel.find(
      { commentId, createdAt: { $lt: new Date(lastSubcommentDate) } },
      {},
      { sort: { createdAt: -1 }, limit: 3 }
    );
    return res.status(200).json(subcomments);
  } catch (err) {
    return res
      .status(defaultErrorCode["server error"])
      .json(defaultErrorJson("server error", err));
  }
};

interface CreateSubcommentData {
  postId?: string;
  commentId?: string;
  profile?: string;
  text?: string;
}

const createSubcomment = async (req: Request, res: Response) => {
  const userData = req.parseToken as TokenPayload;

  const createSubCommentData = req.body as CreateSubcommentData;

  if (
    !createSubCommentData.postId ||
    !createSubCommentData.commentId ||
    !createSubCommentData.profile ||
    !createSubCommentData.text
  ) {
    return res
      .status(defaultErrorCode["missing data"])
      .json(defaultErrorJson("missing data"));
  }

  const data = {
    user: userData.id,
    postId: createSubCommentData.postId,
    commentId: createSubCommentData.commentId,
    profile: createSubCommentData.profile,
    text: createSubCommentData.text,
  };

  try {
    const newSubcomment = new SubcommentModel(data);
    await newSubcomment.save();

    const resData = await SubcommentModel.findById(newSubcomment._id);
    return res.status(201).json(resData);
  } catch (err) {
    return res
      .status(defaultErrorCode["server error"])
      .json(defaultErrorJson("server error", err));
  }
};

export const createSubcommentWithParsedToken = [tokenParser, createSubcomment];

const deleteSubcomment = async (req: Request, res: Response) => {
  const userData = req.parseToken as TokenPayload;

  const subcommentId = req.params["id"];

  if (!subcommentId) {
    return res
      .status(defaultErrorCode["missing data"])
      .json(defaultErrorJson("missing data"));
  }

  try {
    const findedSubcomment = await SubcommentModel.findById(subcommentId);

    if (!findedSubcomment) {
      return res
        .status(defaultErrorCode["not found"])
        .json(defaultErrorJson("not found"));
    }

    if (findedSubcomment.user._id.toString() !== userData.id.toString()) {
      return res
        .status(defaultErrorCode["unauthorized request"])
        .json(defaultErrorJson("unauthorized request"));
    }

    await CommentModel.findByIdAndUpdate(findedSubcomment.commentId, {
      $inc: {
        subcommentsCount: -1,
      },
      $pull: {
        subcomments: findedSubcomment._id,
      },
    });

    await SubcommentModel.findByIdAndDelete(subcommentId);
    return res.status(200).send(findedSubcomment);
  } catch (err) {
    return res
      .status(defaultErrorCode["server error"])
      .json(defaultErrorJson("server error", err));
  }
};

export const deleteSubcommentWithParsedToken = [tokenParser, deleteSubcomment];

interface UpdateSubcommentData {
  _id?: string;
  profile?: string;
  text?: string;
}

const updateSubcomment = async (req: Request, res: Response) => {
  const userData = req.parseToken as TokenPayload;

  const updateSubcommentData = req.body as UpdateSubcommentData;

  if (
    !updateSubcommentData._id ||
    !updateSubcommentData.profile ||
    !updateSubcommentData.text
  ) {
    return res
      .status(defaultErrorCode["missing data"])
      .json(defaultErrorJson("missing data"));
  }

  try {
    const findedSubcomment = await SubcommentModel.findById(
      updateSubcommentData._id
    );

    if (!findedSubcomment) {
      return res
        .status(defaultErrorCode["not found"])
        .json(defaultErrorJson("not found"));
    }

    if (findedSubcomment.user._id.toString() !== userData.id.toString()) {
      return res
        .status(defaultErrorCode["unauthorized request"])
        .json(defaultErrorJson("unauthorized request"));
    }

    const updateData = {
      profile: updateSubcommentData.profile,
      text: updateSubcommentData.text,
    };

    const resData = await SubcommentModel.findByIdAndUpdate(
      updateSubcommentData._id,
      updateData,
      { new: true }
    );

    return res.status(201).json(resData);
  } catch (err) {
    return res
      .status(defaultErrorCode["server error"])
      .json(defaultErrorJson("server error", err));
  }
};

export const updateSubcommentWithParsedToken = [tokenParser, updateSubcomment];
