var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { defaultErrorJson } from "../functions/errorJsonGen.js";
import tokenParser from "../middleware/token-parser.js";
import { uploadProfileImageFileWithTokenParser, } from "../middleware/upload-s3.js";
import ProfileModel from "../models/profile.js";
import UserModel from "../models/userModel.js";
import S3 from "../storage/s3.js";
//profile id로 특정 profile get
export const getProfileById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const profileId = req.params["id"];
    if (!profileId) {
        return res.status(400).json(defaultErrorJson("missing data"));
    }
    try {
        const profile = yield ProfileModel.findOne({ _id: profileId });
        if (!profile) {
            return res.status(404).json(defaultErrorJson("not found"));
        }
        return res.status(200).send(profile);
    }
    catch (err) {
        return res.status(500).json(defaultErrorJson("server error"));
    }
});
//user id로 유저의 profiles get
export const getProfilesByUserId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params["id"];
    if (!userId) {
        return res.status(400).json(defaultErrorJson("missing data"));
    }
    try {
        const profiles = yield ProfileModel.find({
            user: userId,
        });
        return res.status(200).send(profiles);
    }
    catch (err) {
        return res.status(500).json(defaultErrorJson("server error", err));
    }
});
//username으로 profiles 정보 get
export const getProfilesByUsername = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = decodeURIComponent(req.params["username"]);
    if (!username) {
        return res.status(400).json(defaultErrorJson("missing data"));
    }
    try {
        //유저가 존재하는지 확인
        const user = yield UserModel.findOne({ username });
        if (!user) {
            return res.status(404).json(defaultErrorJson("not found"));
        }
        const profiles = yield ProfileModel.find({
            user: user._id,
        });
        return res.status(200).send(profiles);
    }
    catch (err) {
        return res.status(500).json(defaultErrorJson("server error", err));
    }
});
//profile 추가
//tokenparser
//s3
//multer
//s3 middleware에 multer, tokenparser 들어있음
const createProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = req.parseToken;
    const reqProfileData = req.body;
    const userId = userData.id;
    try {
        //중복된 프로필 있는지 확인
        const dupProfile = yield ProfileModel.findOne({
            user: userId,
            category: reqProfileData.category,
            nickname: reqProfileData.nickname,
        }).exec();
        if (dupProfile) {
            return res.status(409).json(defaultErrorJson("data conflict"));
        }
    }
    catch (err) {
        return res.status(500).json(defaultErrorJson("server error", err));
    }
    //이미지 있는 경우 middleware에서 s3에 이미지 저장 후 전달된 객체
    const profileImageObj = req.profileImageObj;
    const profileData = Object.assign(Object.assign({}, reqProfileData), { user: userId, profileImage: {
            URL: (profileImageObj === null || profileImageObj === void 0 ? void 0 : profileImageObj.URL) || "",
            Key: (profileImageObj === null || profileImageObj === void 0 ? void 0 : profileImageObj.Key) || "",
        } });
    try {
        const newProfile = new ProfileModel(profileData);
        yield newProfile.save();
        const newProfileRes = yield ProfileModel.findOne({ _id: newProfile._id });
        return res.status(201).json(newProfileRes);
    }
    catch (err) {
        return res.status(500).json(defaultErrorJson("server error", err));
    }
});
export const createProfileWithUploadS3AndTokenParser = [
    ...uploadProfileImageFileWithTokenParser,
    createProfile,
];
//profile update
//profileImage 여부에 따라 동작 달라야함
//있다면 -> 이전 이미지 있는지 확인 후 이전 이미지 제거 -> db 업데이트
//없다면 -> 이건 명확하게 없는거 -> null 처리를 해야할듯 -> undefined이면 그냥 기본, null이면 이전 데이터를 제거
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = req.parseToken;
    const profileId = req.params["id"];
    const profileData = req.body;
    if (!profileData || !profileId) {
        return res.status(400).json(defaultErrorJson("missing data"));
    }
    const newProfileImage = req.profileImageObj;
    try {
        //이전 프로필 데이터가 있는지 확인
        const prevProfile = yield ProfileModel.findById(profileId).exec();
        if (!prevProfile) {
            return res.status(404).json(defaultErrorJson("not found"));
        }
        //요청한 유저 프로필인지 확인
        if (prevProfile.user._id.toString() !== userData.id.toString()) {
            return res.status(403).json(defaultErrorJson("unauthorized request"));
        }
        //S3 설정 확인
        if (!process.env.S3_BUCKET_NAME) {
            return res.status(500).send("bucket name missing");
        }
        //업데이트 데이터
        let updateData = {};
        //업데이트 프로필의 카테고리가 변경됐으면 카테고리 데이터 설정
        if (prevProfile.category._id.toString() !== profileData.category.toString()) {
            updateData.category = profileData.category;
        }
        //닉네임 변경됐으면 닉네임 데이터 설정
        if (prevProfile.nickname !== profileData.nickname) {
            updateData.nickname = profileData.nickname;
        }
        //업데이트 데이터에 profileImage가 null(제거된 경우)거나 새로운 이미지가 설정된 경우
        if (profileData.profileImage === "null" || newProfileImage) {
            //이전 프로필 정보로 이미지 제거
            if (prevProfile.profileImage.Key) {
                const deleteParams = {
                    Bucket: process.env.S3_BUCKET_NAME,
                    Key: prevProfile.profileImage.Key,
                };
                yield S3.deleteObject(deleteParams).promise();
                updateData.profileImage = { URL: "", Key: "" };
            }
        }
        //새로운 이미지 데이터에 설정
        if (newProfileImage) {
            updateData.profileImage = newProfileImage;
        }
        //데이터 업데이트
        const updatedProfile = yield ProfileModel.findByIdAndUpdate(profileId, updateData, { new: true });
        return res.status(201).json(updatedProfile);
    }
    catch (err) {
        return res.status(500).json(defaultErrorJson("server error", err));
    }
});
export const updateProfileWithUploadS3AndTokenParser = [
    ...uploadProfileImageFileWithTokenParser,
    updateProfile,
];
//profile 제거
//token parser
const deleteProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = req.parseToken;
    const profileId = req.params["id"];
    if (!profileId) {
        return res.status(400).json(defaultErrorJson("missing data"));
    }
    try {
        const profile = yield ProfileModel.findById(profileId).exec();
        if (!profile) {
            return res.status(404).json(defaultErrorJson("not found"));
        }
        if (profile.user._id.toString() !== userData.id.toString()) {
            return res.status(403).json(defaultErrorJson("unauthorized request"));
        }
        if (profile.profileImage.Key) {
            if (!process.env.S3_BUCKET_NAME) {
                return res.status(500).send("bucket name missing");
            }
            const deleteParam = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: profile.profileImage.Key,
            };
            yield S3.deleteObject(deleteParam).promise();
        }
        yield ProfileModel.findByIdAndDelete(profileId);
        return res.status(200).send("delete profile successfully");
    }
    catch (err) {
        return res.status(500).json(defaultErrorJson("server error", err));
    }
});
export const deleteProfileWithTokenParser = [tokenParser, deleteProfile];
