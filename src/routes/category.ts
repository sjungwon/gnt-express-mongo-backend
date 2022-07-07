import express from "express";
import {
  addCategory,
  getCategory,
  removeCategory,
} from "../controllers/category.js";
import tokenParser from "../middleware/token-parser.js";

const router = express.Router();

router.get("/", getCategory);

router.post("/", tokenParser, addCategory);

router.delete("/", tokenParser, removeCategory);

export default router;
