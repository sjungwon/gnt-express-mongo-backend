import { Request, Response } from "express";
import mongoose, { ClientSession } from "mongoose";
import {
  defaultErrorCode,
  defaultErrorJson,
} from "../functions/errorJsonGen.js";
import { TokenPayload } from "../functions/token.js";
import tokenParser from "../middleware/token-parser.js";
import CategoryModel, { CategoryType } from "../models/category.js";
import CommentModel from "../models/comment.js";
import PostModel from "../models/post.js";
import ProfileModel, { ProfileType } from "../models/profile.js";
import SubcommentModel from "../models/subcomment.js";

//카테고리(게시판) get
export const getCategory = async (req: Request, res: Response) => {
  try {
    //카테고리 전체 find - title로 정렬
    const category = await CategoryModel.find({}, {}, { sort: { title: 1 } });
    res.status(200).json(category);
  } catch (err: any) {
    res.status(500).json(defaultErrorJson("server error", err));
  }
};

//특정 카테고리 데이터 반환 - title 데이터로 가져감
export const getCategoryByTitle = async (req: Request, res: Response) => {
  const title = req.params["title"];

  if (!title) {
    return res
      .status(defaultErrorCode["missing data"])
      .json(defaultErrorJson("missing data"));
  }

  try {
    //한글일 수 있어 encodeURIComponent로 프론트에서 전달
    const decodedTitle = decodeURIComponent(title);
    const category = await CategoryModel.findOne({ title: decodedTitle });
    if (!category) {
      return res
        .status(defaultErrorCode["not found"])
        .json(defaultErrorJson("not found"));
    }
    return res.status(200).json(category);
  } catch (err) {
    return res
      .status(defaultErrorCode["server error"])
      .json(defaultErrorJson("server error", err));
  }
};

//카테고리
const addCategory = async (req: Request, res: Response) => {
  const userData = req.parseToken as TokenPayload;

  const title = req.body.title;
  if (!title) {
    return res.status(400).json(defaultErrorJson("missing data"));
  }

  try {
    //이미 존재하는지 확인
    const dupCategory = await CategoryModel.findOne({ title }).exec();

    if (dupCategory) {
      return res.status(409).json(defaultErrorJson("data conflict"));
    }

    const categoryData: CategoryType = {
      user: userData.id,
      title,
    };

    const newCategory = new CategoryModel(categoryData);

    //db에 저장
    await newCategory.save();

    //저장된 category find해서 username이 populate된 데이터를 반환
    const resData = await CategoryModel.findById(newCategory._id);

    res.status(201).json(resData);
  } catch (err: any) {
    return res.status(500).json(defaultErrorJson("server error", err));
  }
};

//토큰 필요한 작업이므로 합쳐서 export
export const addCategoryWithTokenParser = [tokenParser, addCategory];

//카테고리 제거
const deleteCategory = async (req: Request, res: Response) => {
  const userData = req.parseToken as TokenPayload;

  const categoryId = req.params["id"];
  if (!categoryId) {
    return res.status(400).json(defaultErrorJson("missing data"));
  }

  try {
    //존재하는 카테고리인지 확인
    const category: CategoryType | null = await CategoryModel.findById({
      _id: categoryId,
    });

    if (!category) {
      return res.status(401).json(defaultErrorJson("not found"));
    }

    //카테고리를 생성한 유저인지 확인
    if (category.user._id.toString() !== userData.id.toString()) {
      return res.status(403).json(defaultErrorJson("unauthorized request"));
    }

    //카테고리에 존재하는 프로필 있는지 확인
    const profiles = await ProfileModel.find({ category: categoryId });

    if (profiles.length) {
      return res.status(403).json({
        type: "unauthorized request",
        error: "can't delete category with content",
      });
    }

    //카테고리에 존재하는 포스트 있는지 확인 -> 포스트 없으면 댓글, 대댓글도 없음
    const posts = await PostModel.find({ category: categoryId });
    if (posts.length) {
      return res.status(403).json({
        type: "unauthorized request",
        error: "can't delete category with content",
      });
    }

    //카테고리에 포함된 데이터가 없으면 제거
    await CategoryModel.findByIdAndRemove(categoryId);

    return res.status(200).send("delete category successfully");
  } catch (err: any) {
    return res.status(500).send(defaultErrorJson("server error", err));
  }
};

//토큰 필요한 작업이므로 합쳐서 export
export const deleteCategoryWithTokenParser = [tokenParser, deleteCategory];
