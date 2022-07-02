import { Request, Response } from "express";
import mongoose from "mongoose";
import PostMessage, { PostDataType } from "../models/postMessage.js";

export const getPosts = async (req: Request, res: Response) => {
  try {
    const postMessages = await PostMessage.find();
    res.status(200).json(postMessages);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const createPost = async (req: Request, res: Response) => {
  const post = req.body as Object & PostDataType;

  const newPost = new PostMessage(post);

  try {
    await newPost.save();

    res.status(201).json(newPost);
  } catch (error: any) {
    res.status(409).json({ error: error.message });
  }
};

export const updatePost = async (req: Request, res: Response) => {
  const { id: _id } = req.params;
  const post = req.body as Object & PostDataType;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("No post found with requested id");
  }

  try {
    const updatedPost = await PostMessage.findByIdAndUpdate(
      _id,
      { ...post, _id },
      {
        new: true,
      }
    );
    res.status(201).json(updatedPost);
  } catch (error: any) {
    res.status(409).json({ error: error.message });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  const { id: _id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("No post found with requested id");
  }

  try {
    await PostMessage.findByIdAndDelete(_id);
    res.status(200).send("post deleted successfully");
  } catch (error: any) {
    res.status(409).json({ error: error.message });
  }
};
