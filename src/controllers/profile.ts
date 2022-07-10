import { RequestHandler } from "express";
import { Types } from "mongoose";
import { defaultErrorJson } from "../functions/errorJsonGen.js";
import { TokenPayload } from "../functions/token.js";
import ProfileModel, { ProfileType } from "../models/profile.js";

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
//user 정보 token parser 이용
export const getMyProfile: RequestHandler = async (req, res) => {
  const userData: TokenPayload | undefined = req.body.parseToken;

  if (!userData) {
    return res.status(401).json(defaultErrorJson("not signin"));
  }

  const creator = {
    username: userData.username,
    id: userData.id,
  };

  try {
    const profiles = await ProfileModel.find({
      "creator.id": creator.id,
    })
      .populate({
        path: "category",
        select: "title",
      })
      .populate({ path: "user", select: "username" });
    return res.status(200).send(profiles);
  } catch (err) {
    console.log(err);
    return res.status(500).json(defaultErrorJson("server error"));
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

    return res.status(201).json(newProfile);
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
    prevProfile.update(undefined, {
      name: newName,
    });
    return res.status(201).json("update profile successfully");
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
    await profile.delete().exec();
    return res.status(200).send("delete profile successfully");
  } catch (err) {
    return res.status(500).json(defaultErrorJson("server error"));
  }
};
