import express from "express";
import {
  userSignin,
  refreshAccessToken,
  userSignout,
  userSignup,
  changePassword,
  findUserForFindPassword,
} from "../controllers/auth.js";

const router = express.Router();

router.post("/signin", userSignin);

router.post("/signup", userSignup);

router.post("/signout", userSignout);

router.post("/refresh", refreshAccessToken);

router.post("/find", findUserForFindPassword);

router.post("/change", changePassword);

export default router;
