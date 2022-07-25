import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  defaultErrorCode,
  defaultErrorJson,
} from "../functions/errorJsonGen.js";
import { TokenPayload } from "../functions/token.js";
import tokenParser from "../middleware/token-parser.js";
import CategoryModel from "../models/category.js";
import CommentModel from "../models/comment.js";
import SubcommentModel from "../models/subcomment.js";

//대댓글 더보기
//댓글 id, 마지막 대댓글 날짜
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
  category?: string;
  profile?: string;
  text?: string;
}

//대댓글 생성
//tokenParser
const createSubcomment = async (req: Request, res: Response) => {
  const userData = req.parseToken as TokenPayload;

  const createSubCommentData = req.body as CreateSubcommentData;

  if (
    !createSubCommentData.postId ||
    !createSubCommentData.commentId ||
    !createSubCommentData.category ||
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
    category: createSubCommentData.category,
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

//댓글 제거
//tokenParser
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
    await CommentModel.findByIdAndUpdate(findedSubcomment.commentId, {
      $inc: {
        subcommentsCount: -1,
      },
      $pull: {
        subcomments: findedSubcomment._id,
      },
    });

    //제거
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

//대댓글 수정
//tokenParser
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

//대댓글 차단
//tokenParser
const blockSubcomment = async (req: Request, res: Response) => {
  const userData = req.parseToken as TokenPayload;

  const subcommentId = req.params["id"];
  if (!subcommentId) {
    return res
      .status(defaultErrorCode["missing data"])
      .json(defaultErrorJson("missing data"));
  }

  try {
    const subcomment = await SubcommentModel.findById(subcommentId);
    //대댓글 없는 경우
    if (!subcomment) {
      return res
        .status(defaultErrorCode["not found"])
        .json(defaultErrorJson("not found"));
    }
    const category = await CategoryModel.findById(subcomment.category._id);
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
    await SubcommentModel.findByIdAndUpdate(subcommentId, {
      text: "차단된 댓글",
      blocked: true,
    });
    return res.status(201).send("block subcomment successfully");
  } catch (err) {
    return res
      .status(defaultErrorCode["server error"])
      .json(defaultErrorJson("server error", err));
  }
};

export const blockSubcommentWithParsedToken = [tokenParser, blockSubcomment];
