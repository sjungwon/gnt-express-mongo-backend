var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import bcrypt from "bcrypt";
import UserModel from "../models/userModel.js";
import { jwtTokenGen, jwtTokenVerify, } from "../functions/token.js";
import RefreshTokenModel from "../models/refreshTokenModel.js";
import { authErrorJson, defaultErrorJson } from "../functions/errorJsonGen.js";
export const userSignin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    try {
        //DB에서 유저 조회
        const findedUser = yield UserModel.findOne({ username }).exec();
        //DB에 존재하지 않는 유저 -> 잘못 입력 혹은 가입되지 않은 유저
        if (!findedUser) {
            return res.status(404).send(authErrorJson("Login fail"));
        }
        //존재하는 경우 -> 비밀번호 검증
        const passwordVerify = yield bcrypt.compare(password, findedUser.password);
        //틀린 비밀번호인 경우
        if (!passwordVerify) {
            return res.status(404).send(authErrorJson("Login fail"));
        }
        //로그인 성공
        const tokenPayload = {
            username: findedUser.username,
            id: findedUser._id,
            admin: findedUser.admin,
        };
        const accessToken = jwtTokenGen(tokenPayload, "access");
        const refreshToken = jwtTokenGen(tokenPayload, "refresh");
        //혹시 쿠키에 이전에 사용하던 refreshToken이 있으면 해당 토큰은 DB에서 제거
        //이전 토큰 제거에서 발생한 오류는 로그인 로직과 큰 상관이 없으므로 오류 처리는 안함
        const dummyToken = req.cookies["refreshToken"] || "";
        if (dummyToken) {
            try {
                yield RefreshTokenModel.findOneAndDelete({ dummyToken });
            }
            catch (_a) { }
        }
        //차후에 토큰 변조 검증을 위해 db에 refreshToken 저장
        const savedToken = new RefreshTokenModel({ refreshToken });
        yield savedToken.save();
        //refresh Token은 쿠키에 저장
        //브라우저에서 JS로 토큰 접근 못하게 httpOnly 설정
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7,
        });
        //access Token은 body로 전송 -> client에서 저장하고 사용
        res.status(200).json({ userData: tokenPayload, accessToken: accessToken });
    }
    catch (err) {
        res.status(500).json(defaultErrorJson("server error", err));
    }
});
//회원 가입
export const userSignup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password, email } = req.body;
    //가입 데이터 중 하나라도 없으면 에러 반환
    if (!username || !password || !email) {
        return res.status(400).json(defaultErrorJson("missing data"));
    }
    try {
        //이미 존재하는 이메일인지 확인
        const findDupEmail = yield UserModel.findOne({ email }).exec();
        if (findDupEmail) {
            return res.status(409).json(authErrorJson("exist email"));
        }
        //이미 존재하는 사용자 이름인지 확인
        const findDupUsername = yield UserModel.findOne({ username }).exec();
        if (findDupUsername) {
            return res.status(409).json(authErrorJson("exist username"));
        }
        //비밀번호 암호화
        const salt = yield bcrypt.genSalt();
        const encryptPassword = yield bcrypt.hash(password, salt);
        //유저 모델 생성
        const newUser = new UserModel({
            username,
            password: encryptPassword,
            email,
        });
        //db에 저장
        yield newUser.save();
        //성공 반환
        res.status(201).send("register success");
    }
    catch (err) {
        //에러 반환
        res.status(500).json(defaultErrorJson("server error", err));
    }
});
//로그아웃
export const userSignout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //refreshToken DB에서 제거
    const refreshToken = req.cookies["refreshToken"] || "";
    if (refreshToken) {
        try {
            yield RefreshTokenModel.findOneAndDelete({ refreshToken });
        }
        catch (_b) { }
    }
    res.status(202).clearCookie("refreshToken").send("logout success");
});
//첫 페이지 진입 시 로그인 기록 확인 = refresh Token 검증 -> 검증되면 accessToken 전달
//사용자 권한이 필요한 경우 = accessToken 검증 -> 실패한 경우 refresh를 요청
export const refreshAccessToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const refreshToken = req.cookies.refreshToken || "";
    const refreshKey = process.env.JWT_SECRET_REFRESH || "";
    //토큰이 없으면 에러 반환
    if (!refreshToken) {
        return res.status(403).send(defaultErrorJson("not signin"));
    }
    //저장된 refreshToken인지 확인
    try {
        const isSaved = yield RefreshTokenModel.findOne({ refreshToken }).exec();
        if (!isSaved) {
            return res.status(403).send(defaultErrorJson("not signin"));
        }
    }
    catch (err) {
        return res.status(500).send(defaultErrorJson("server error", err));
    }
    //refresh 토큰 검증
    const refreshVerify = jwtTokenVerify(refreshToken, refreshKey);
    //refresh가 유효하면 access 재발급
    if (refreshVerify) {
        const newAccessToken = jwtTokenGen(refreshVerify, "access");
        return res
            .status(202)
            .json({ accessToken: newAccessToken, userData: refreshVerify });
    }
    //refresh가 만료 혹은 오류이면
    return res.status(403).send(defaultErrorJson("not signin"));
});
//비밀번호 찾기 요청
//사용자 이름, 이메일로 존재하는 계정인지 확인
export const findUserForFindPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email } = req.body;
    try {
        const isValid = yield UserModel.findOne({ username, email }).exec();
        if (!isValid) {
            return res.status(404).json(defaultErrorJson("not found"));
        }
        res.status(200).send("confirmed");
    }
    catch (err) {
        return res.status(500).json(defaultErrorJson("server error", err));
    }
});
//비밀번호 찾기 요청에서 존재하는 계정이면
//암호 변경 요청
export const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password, } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json(defaultErrorJson("missing data"));
    }
    try {
        const hasUser = yield UserModel.findOne({ username, email });
        if (!hasUser) {
            return res.status(404).json(defaultErrorJson("not found"));
        }
        const salt = yield bcrypt.genSalt();
        const encryptPassword = yield bcrypt.hash(password, salt);
        yield UserModel.findOneAndUpdate({ username, email }, { password: encryptPassword });
        return res.status(201).send("password changed successfully");
    }
    catch (err) {
        return res.status(500).json(defaultErrorJson("server error", err));
    }
});
