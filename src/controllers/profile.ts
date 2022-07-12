import { RequestHandler } from "express";
import { Types } from "mongoose";
import { defaultErrorJson } from "../functions/errorJsonGen.js";
import { TokenPayload } from "../functions/token.js";
import { ProfileImageObj } from "../middleware/upload-s3.js";
import ProfileModel, { ProfileType } from "../models/profile.js";
import UserModel from "../models/userModel.js";
import S3 from "../storage/s3.js";

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
  const userData: TokenPayload | undefined = req.parseToken;

  if (!userData) {
    return res.status(401).json(defaultErrorJson("not signin"));
  }

  console.log(req.body, req.file);

  const reqProfileData: {
    category: Types.ObjectId;
    nickname: string;
  } = req.body;

  const userId = userData.id;

  //중복 방지 -> 못하고 있음 -> 아마 중첩객체는 못찾는듯 -> 카테고리 id로 비교 + create도 id로
  try {
    const dupProfile = await ProfileModel.findOne({
      user: userId,
      category: reqProfileData.category,
      nickname: reqProfileData.nickname,
    }).exec();
    if (dupProfile) {
      return res.status(409).json(defaultErrorJson("data conflict"));
    }
  } catch (err) {
    return res.status(500).json(defaultErrorJson("server error", err));
  }

  const profileImageObj: ProfileImageObj | undefined = req.profileImageObj;

  const profileData: ProfileType = {
    ...reqProfileData,
    user: userId,
    profileImage: {
      URL: profileImageObj?.URL || "",
      Key: profileImageObj?.Key || "",
    },
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

interface UpdateProfileReqType {
  category: string;
  nickname: string;
  profileImage?: "null";
}

//profile update
//profileImage 여부에 따라 동작 달라야함
//있다면 -> 이전 이미지 있는지 확인 후 이전 이미지 제거 -> db 업데이트
//없다면 -> 이건 명확하게 없는거 -> null 처리를 해야할듯 -> undefined이면 그냥 기본, null이면 이전 데이터를 제거
export const updateProfile: RequestHandler = async (req, res) => {
  const userData: TokenPayload | undefined = req.parseToken;

  if (!userData) {
    return res.status(401).json(defaultErrorJson("not signin"));
  }

  const profileId: string = req.params["id"];

  const profileData: UpdateProfileReqType = req.body;

  if (!profileData) {
    return res.status(400).json(defaultErrorJson("missing data"));
  }

  const newProfileImage: ProfileImageObj | undefined = req.profileImageObj;

  try {
    const prevProfile = await ProfileModel.findById(profileId).exec();
    if (!prevProfile) {
      return res.status(404).json(defaultErrorJson("not found"));
    }
    if (prevProfile.user.toString() !== userData.id.toString()) {
      return res.status(403).json(defaultErrorJson("unauthorized request"));
    }

    if (!process.env.S3_BUCKET_NAME) {
      return res.status(500).send("bucket name missing");
    }

    let updateData: {
      category?: string;
      nickname?: string;
      profileImage?: ProfileImageObj;
    } = {};
    console.log(prevProfile.category, profileData);
    if (prevProfile.category.toString() !== profileData.category.toString()) {
      updateData.category = profileData.category;
    }
    if (prevProfile.nickname !== profileData.nickname) {
      updateData.nickname = profileData.nickname;
    }
    if (profileData.profileImage === "null" || newProfileImage) {
      if (prevProfile.profileImage.Key) {
        const deleteParams: AWS.S3.DeleteObjectRequest = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: prevProfile.profileImage.Key,
        };
        await S3.deleteObject(deleteParams).promise();
        updateData.profileImage = { URL: "", Key: "" };
      }
    }
    if (newProfileImage) {
      updateData.profileImage = newProfileImage;
    }

    const updatedProfile = await ProfileModel.findByIdAndUpdate(
      profileId,
      updateData,
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
  const userData: TokenPayload | undefined = req.parseToken;

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

    if (profile.profileImage.Key) {
      if (!process.env.S3_BUCKET_NAME) {
        return res.status(500).send("bucket name missing");
      }
      const deleteParam: AWS.S3.DeleteObjectRequest = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: profile.profileImage.Key,
      };
      await S3.deleteObject(deleteParam).promise();
    }

    await ProfileModel.findByIdAndDelete(profileId);
    return res.status(200).send("delete profile successfully");
  } catch (err) {
    return res.status(500).json(defaultErrorJson("server error", err));
  }
};
