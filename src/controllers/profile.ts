import { RequestHandler } from "express";
import { Types } from "mongoose";
import { defaultErrorJson } from "../functions/errorJsonGen.js";
import { TokenPayload } from "../functions/token.js";
import ProfileModel, { ProfileType } from "../models/profile.js";
import UserModel from "../models/userModel.js";

//profile id로 특정 profile get
export const getProfile: RequestHandler = async (req, res) => {
  const profileId = req.params["id"];

  if (!profileId) {
    return res.status(400).json(defaultErrorJson("missing data"));
  }

  try {
    const profile = await ProfileModel.findOne({ _id: profileId })
      .populate({
        path: "category",
        select: "title",
      })
      .populate({ path: "user", select: "username" });
    if (!profile) {
      return res.status(404).json(defaultErrorJson("not found"));
    }
    return res.status(200).send(profile);
  } catch (err) {
    return res.status(500).json(defaultErrorJson("server error"));
  }
};

//user의 profile 정보 get
export const getProfilesByUserId: RequestHandler = async (req, res) => {
  const userId = req.params["id"];

  if (!userId) {
    return res.status(400).json(defaultErrorJson("missing data"));
  }

  try {
    const profiles = await ProfileModel.find({
      user: userId,
    })
      .populate({
        path: "category",
        select: "title",
      })
      .populate({ path: "user", select: "username" });
    return res.status(200).send(profiles);
  } catch (err) {
    return res.status(500).json(defaultErrorJson("server error", err));
  }
};

export const getProfilesByUsername: RequestHandler = async (req, res) => {
  const username = decodeURIComponent(req.params["username"]);
  if (!username) {
    return res.status(400).json(defaultErrorJson("missing data"));
  }

  try {
    const user = await UserModel.findOne({ username });
    if (!user) {
      return res.status(404).json(defaultErrorJson("not found"));
    }
    const profiles = await ProfileModel.find({
      user: user._id,
    })
      .populate({
        path: "category",
        select: "title",
      })
      .populate({ path: "user", select: "username" });
    return res.status(200).send(profiles);
  } catch (err) {
    return res.status(500).json(defaultErrorJson("server error", err));
  }
};

//profile 추가
//tokenparser
export const addProfiles: RequestHandler = async (req, res) => {
  const userData: TokenPayload | undefined = req.body.parseToken;

  if (!userData) {
    return res.status(401).json(defaultErrorJson("not signin"));
  }
  const reqProfileData: {
    category: Types.ObjectId;
    name: string;
  } = req.body;

  const userId = userData.id;

  //중복 방지 -> 못하고 있음 -> 아마 중첩객체는 못찾는듯 -> 카테고리 id로 비교 + create도 id로
  try {
    const dupProfile = await ProfileModel.findOne({
      user: userId,
      category: reqProfileData.category,
      name: reqProfileData.name,
    }).exec();
    if (dupProfile) {
      return res.status(409).json(defaultErrorJson("data conflict"));
    }
  } catch (err) {
    return res.status(500).json(defaultErrorJson("server error", err));
  }

  const profileData: ProfileType = {
    ...reqProfileData,
    user: userId,
  };

  try {
    const newProfile = new ProfileModel(profileData);

    await newProfile.save();

    const newProfileRes = await ProfileModel.findOne({ _id: newProfile._id })
      .populate({ path: "category", select: "title" })
      .populate({ path: "user", select: "username" });

    return res.status(201).json(newProfileRes);
  } catch (err: any) {
    return res.status(500).json(defaultErrorJson("server error", err));
  }
};

//profile update
export const updateProfile: RequestHandler = async (req, res) => {
  const userData: TokenPayload = req.body.parseToken;

  if (!userData) {
    return res.status(401).json(defaultErrorJson("not signin"));
  }

  const profileId: string = req.params["id"];

  //닉네임 변경이 안되고 있음 -> 변경처리 해야함
  const { name: newName }: { name: string } = req.body;

  if (!newName) {
    return res.status(400).json(defaultErrorJson("missing data"));
  }

  try {
    const prevProfile = await ProfileModel.findById(profileId).exec();
    if (!prevProfile) {
      return res.status(404).json(defaultErrorJson("not found"));
    }
    if (prevProfile.user.toString() !== userData.id.toString()) {
      return res.status(403).json(defaultErrorJson("unauthorized request"));
    }

    const updatedProfile = await ProfileModel.findByIdAndUpdate(
      profileId,
      {
        name: newName,
      },
      { new: true }
    )
      .populate({ path: "category", select: "title" })
      .populate({ path: "user", select: "username" });

    return res.status(201).json(updatedProfile);
  } catch (err: any) {
    return res.status(500).json(defaultErrorJson("server error", err));
  }
};

//profile 제거
export const deleteProfile: RequestHandler = async (req, res) => {
  const userData: TokenPayload = req.body.parseToken;

  if (!userData) {
    return res.status(401).json(defaultErrorJson("not signin"));
  }

  const profileId = req.params["id"];
  if (!profileId) {
    return res.status(400).json(defaultErrorJson("missing data"));
  }

  try {
    const profile = await ProfileModel.findById(profileId).exec();
    if (!profile) {
      return res.status(404).json(defaultErrorJson("not found"));
    }

    if (profile.user.toString() !== userData.id.toString()) {
      return res.status(403).json(defaultErrorJson("unauthorized request"));
    }
    await ProfileModel.findByIdAndDelete(profileId);
    return res.status(200).send("delete profile successfully");
  } catch (err) {
    return res.status(500).json(defaultErrorJson("server error", err));
  }
};
