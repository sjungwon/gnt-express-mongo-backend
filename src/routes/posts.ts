import express from "express";
import {
  blockPostWithTokenParser,
  createPostWithUploadS3AndTokenParser,
  deletePostWithTokenParser,
  dislikePostWithTokenParser,
  getPosts,
  getPostsByCategoryId,
  getPostsByProfileId,
  getPostsByUsername,
  likePostWithTokenParser,
  updatePostWithUploadS3AndTokenParser,
} from "../controllers/posts.js";

const router = express.Router();

router.get("/", getPosts);

router.get("/categories/:categoryId", getPostsByCategoryId);

router.get("/profiles/:profileId", getPostsByProfileId);

router.get("/users/:username", getPostsByUsername);

router.post("/", createPostWithUploadS3AndTokenParser);

router.patch("/", updatePostWithUploadS3AndTokenParser);

router.patch("/block/:id", blockPostWithTokenParser);

router.delete("/:id", deletePostWithTokenParser);

router.patch("/likes/:id", likePostWithTokenParser);

router.patch("/dislikes/:id", dislikePostWithTokenParser);

export default router;
