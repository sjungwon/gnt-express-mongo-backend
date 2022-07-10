import express from "express";
import {
  addProfiles,
  deleteProfile,
  getMyProfile,
  getProfile,
  updateProfile,
} from "../controllers/profile.js";
import tokenParser from "../middleware/token-parser.js";

const router = express.Router();

router.get("/user", tokenParser, getMyProfile);

router.get("/:id", getProfile);

router.post("/", tokenParser, addProfiles);

router.patch("/:id", tokenParser, updateProfile);

router.delete("/:id", tokenParser, deleteProfile);

export default router;
