import express from "express";
import {
  addProfiles,
  deleteProfile,
  getProfile,
  getProfilesByUserId,
  getProfilesByUsername,
  updateProfile,
} from "../controllers/profile.js";
import tokenParser from "../middleware/token-parser.js";
import multer from "multer";
import { uploadProfileImageFile } from "../middleware/upload-s3.js";
const formParser = multer();

const router = express.Router();

router.get("/:id", getProfile);

router.get("/id/:id", getProfilesByUserId);

router.get("/username/:username", getProfilesByUsername);

router.post("/", uploadProfileImageFile, addProfiles);

router.patch("/:id", uploadProfileImageFile, updateProfile);

router.delete("/:id", tokenParser, deleteProfile);

export default router;
