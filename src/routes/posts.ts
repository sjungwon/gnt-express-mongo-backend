import express from "express";
import {
  createPost,
  deletePost,
  getPosts,
  postDislikeHandler,
  postLikeHandler,
  updatePost,
} from "../controllers/posts.js";
import tokenParser from "../middleware/token-parser.js";
import { uploadPostImageFiles } from "../middleware/upload-s3.js";

const router = express.Router();

router.get("/", getPosts);

router.post("/", uploadPostImageFiles, createPost);

router.patch("/", uploadPostImageFiles, updatePost);

router.delete("/:id", tokenParser, deletePost);

router.patch("/likes/:id", tokenParser, postLikeHandler);

router.patch("/dislikes/:id", tokenParser, postDislikeHandler);

export default router;
