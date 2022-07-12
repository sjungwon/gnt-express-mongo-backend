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

const router = express.Router();

router.get("/:id", getProfile);

router.get("/id/:id", getProfilesByUserId);

router.get("/username/:username", getProfilesByUsername);

router.post("/", tokenParser, addProfiles);

router.patch("/:id", tokenParser, updateProfile);

router.delete("/:id", tokenParser, deleteProfile);

export default router;
