import express from "express";
import {
  blockPost,
  createPost,
  deletePost,
  getPosts,
  getPostsByCategoryId,
  getPostsByProfileId,
  getPostsByUsername,
  postDislikeHandler,
  postLikeHandler,
  updatePost,
} from "../controllers/posts.js";
import tokenParser from "../middleware/token-parser.js";
import { uploadPostImageFiles } from "../middleware/upload-s3.js";

const router = express.Router();

router.get("/", getPosts);

router.get("/categories/:categoryId", getPostsByCategoryId);

router.get("/profiles/:profileId", getPostsByProfileId);

router.get("/users/:username", getPostsByUsername);

router.post("/", uploadPostImageFiles, createPost);

router.patch("/", uploadPostImageFiles, updatePost);

router.patch("/block/:id", tokenParser, blockPost);

router.delete("/:id", tokenParser, deletePost);

router.patch("/likes/:id", tokenParser, postLikeHandler);

router.patch("/dislikes/:id", tokenParser, postDislikeHandler);

export default router;
