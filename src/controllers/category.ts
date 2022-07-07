import { Request, Response } from "express";
import { defaultErrorJson } from "../functions/errorJsonGen.js";
import { TokenPayload } from "../functions/token.js";
import CategoryModel, { CategoryType } from "../models/category.js";

export const getCategory = async (req: Request, res: Response) => {
  try {
    const category = await CategoryModel.find();
    res.status(200).json(category);
  } catch (err: any) {
    res.status(500).json(defaultErrorJson("server error", err));
  }
};

//use token
export const addCategory = async (req: Request, res: Response) => {
  const userData: TokenPayload = req.body.parseToken;

  console.log(userData);
  if (!userData) {
    return res.status(401).json(defaultErrorJson("not signin"));
  }

  const title = req.body.title;
  if (!title) {
    return res.status(400).json(defaultErrorJson("missing data"));
  }

  const newCategory = new CategoryModel({
    creator: {
      username: userData.username,
      id: userData.id,
    },
    title,
  });

  try {
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (err) {
    return res.status(500).json(defaultErrorJson("server error"));
  }
};

//use Token
export const removeCategory = async (req: Request, res: Response) => {
  const userData: TokenPayload = req.body.parseToken;

  if (!userData) {
    return res.status(401).json(defaultErrorJson("not signin"));
  }

  const categoryId = req.body.title;
  if (!categoryId) {
    return res.status(400).json(defaultErrorJson("missing data"));
  }

  const category: CategoryType | null = await CategoryModel.findById({
    _id: categoryId,
  });

  if (!category) {
    return res.status(401).json(defaultErrorJson("not found"));
  }

  if (category.creator.id.toString() !== userData.id.toString()) {
    return res.status(403).json(defaultErrorJson("unauthorized request"));
  }

  try {
    await CategoryModel.findByIdAndRemove(categoryId);
    return res.status(200).send("remove category successfully");
  } catch (err: any) {
    return res.status(500).send(defaultErrorJson("server error", err));
  }
};
