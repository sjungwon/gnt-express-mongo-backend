import { Request, Response } from "express";
import mongoose, { ClientSession } from "mongoose";
import {
  defaultErrorCode,
  defaultErrorJson,
} from "../functions/errorJsonGen.js";
import { TokenPayload } from "../functions/token.js";
import CategoryModel, { CategoryType } from "../models/category.js";
import ProfileModel, { ProfileType } from "../models/profile.js";

//카테고리(게시판) get
export const getCategory = async (req: Request, res: Response) => {
  try {
    const category = await CategoryModel.find();
    res.status(200).json(category);
  } catch (err: any) {
    res.status(500).json(defaultErrorJson("server error", err));
  }
};

export const getCategoryByTitle = async (req: Request, res: Response) => {
  const title = req.params["title"];

  if (!title) {
    return res
      .status(defaultErrorCode["missing data"])
      .json(defaultErrorJson("missing data"));
  }

  try {
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

//use token
export const addCategory = async (req: Request, res: Response) => {
  const userData: TokenPayload | undefined = req.parseToken;

  if (!userData) {
    return res.status(401).json(defaultErrorJson("not signin"));
  }

  const title = req.body.title;
  if (!title) {
    return res.status(400).json(defaultErrorJson("missing data"));
  }

  try {
    const dupCategory = await CategoryModel.findOne({ title }).exec();

    if (dupCategory) {
      return res.status(409).json(defaultErrorJson("data conflict"));
    }

    const categoryData: CategoryType = {
      user: userData.id,
      title,
    };

    const newCategory = new CategoryModel(categoryData);

    await newCategory.save();

    const resData = await CategoryModel.findById(newCategory._id);

    res.status(201).json(resData);
  } catch (err: any) {
    return res.status(500).json(defaultErrorJson("server error", err));
  }
};

//use Token
export const removeCategory = async (req: Request, res: Response) => {
  const userData: TokenPayload | undefined = req.parseToken;

  if (!userData) {
    return res.status(401).json(defaultErrorJson("not signin"));
  }

  const categoryId = req.params["id"];
  if (!categoryId) {
    return res.status(400).json(defaultErrorJson("missing data"));
  }

  const category: CategoryType | null = await CategoryModel.findById({
    _id: categoryId,
  });

  if (!category) {
    return res.status(401).json(defaultErrorJson("not found"));
  }

  if (category.user._id.toString() !== userData.id.toString()) {
    return res.status(403).json(defaultErrorJson("unauthorized request"));
  }

  try {
    await CategoryModel.findByIdAndRemove(categoryId);
    await ProfileModel.deleteMany({ "category.id": categoryId });
    return res.status(200).send("remove category successfully");
  } catch (err: any) {
    return res.status(500).send(defaultErrorJson("server error", err));
  }
};
