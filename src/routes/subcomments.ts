import express from "express";
import {
  blockSubcommentWithParsedToken,
  createSubcommentWithParsedToken,
  deleteSubcommentWithParsedToken,
  getMoreSubcomments,
  updateSubcommentWithParsedToken,
} from "../controllers/subcomments.js";

const router = express.Router();

router.get("/:commentId/:lastDate", getMoreSubcomments);

router.post("/", createSubcommentWithParsedToken);

router.patch("/", updateSubcommentWithParsedToken);

router.patch("/block/:id", blockSubcommentWithParsedToken);

router.delete("/:id", deleteSubcommentWithParsedToken);

export default router;
