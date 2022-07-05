import { Request, Response } from "express";
import bcrypt from "bcrypt";
import UserModel from "../models/userModel.js";
import {
  jwtTokenGen,
  jwtTokenVerify,
  TokenPayload,
} from "../functions/token.js";
import { ErrorResponseType } from "../types/error.type.js";
import RefreshTokenModel from "../models/refreshTokenModel.js";
import mongoose from "mongoose";

interface AuthErrorType extends ErrorResponseType {
  type:
    | "Login fail"
    | "server error"
    | "missing data"
    | "exist email"
    | "exist username"
    | "not signin";
}

export const userSignin = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    //DB에서 유저 조회
    const findedUser = await UserModel.findOne({ username });

    //DB에 존재하지 않는 유저 -> 잘못 입력 혹은 가입되지 않은 유저
    if (!findedUser) {
      const errJson: AuthErrorType = {
        error: "Login fail",
        type: "Login fail",
      };
      return res.status(404).send(errJson);
    }

    //존재하는 경우 -> 비밀번호 검증
    const passwordVerify = await bcrypt.compare(password, findedUser.password);

    //틀린 비밀번호인 경우
    if (!passwordVerify) {
      const errJson: AuthErrorType = {
        error: "Login fail",
        type: "Login fail",
      };
      return res.status(404).send(errJson);
    }

    //로그인 성공
    const tokenPayload: TokenPayload = {
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
        await RefreshTokenModel.findOneAndDelete({ dummyToken });
      } catch {}
    }

    //차후에 토큰 변조 검증을 위해 db에 refreshToken 저장
    const savedToken = new RefreshTokenModel({ refreshToken });
    await savedToken.save();

    //refresh Token은 쿠키에 저장
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
    //access Token은 body로 전송 -> client에서 저장하고 사용
    res.status(200).json({ userData: tokenPayload, accessToken: accessToken });
  } catch (err) {
    const errJson: AuthErrorType = { error: err, type: "server error" };
    res.status(500).json(errJson);
  }
};

export const userSignup = async (req: Request, res: Response) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    const errJson: AuthErrorType = {
      error: "some data missing",
      type: "missing data",
    };
    return res.status(400).json(errJson);
  }

  try {
    const findDupEmail = await UserModel.findOne({ email });
    if (findDupEmail) {
      const errJson: AuthErrorType = {
        error: "email already exist",
        type: "exist email",
      };
      return res.status(409).json(errJson);
    }
    const findDupUsername = await UserModel.findOne({ username });
    if (findDupUsername) {
      const errJson: AuthErrorType = {
        error: "username already exist",
        type: "exist username",
      };
      return res.status(409).json(errJson);
    }

    const salt = await bcrypt.genSalt();
    const encryptPassword = await bcrypt.hash(password, salt);

    const newUser = new UserModel({
      username,
      password: encryptPassword,
      email,
    });

    await newUser.save();

    res.status(201).send("register success");
  } catch (err) {
    const errJson: AuthErrorType = { error: err, type: "server error" };
    res.status(500).json(errJson);
  }
};

export const userSignout = async (req: Request, res: Response) => {
  //refreshToken DB에서 제거
  const refreshToken: string = req.cookies["refreshToken"] || "";
  if (refreshToken) {
    try {
      await RefreshTokenModel.findOneAndDelete({ refreshToken });
    } catch {}
  }
  res.status(202).clearCookie("refreshToken").send("logout success");
};

//첫 페이지 진입 시 로그인 기록 확인 = refresh Token 검증 -> 검증되면 accessToken 전달
//사용자 권한이 필요한 경우 = accessToken 검증 -> 실패한 경우 refresh를 요청
export const refreshAccessToken = async (req: Request, res: Response) => {
  const refreshToken: string = req.cookies.refreshToken || "";
  const refreshKey = process.env.JWT_SECRET_REFRESH || "";
  const errJson: AuthErrorType = {
    error: "user does not signin",
    type: "not signin",
  };

  if (!refreshToken) {
    return res.status(403).send(errJson);
  }

  //저장된 refreshToken인지 확인
  try {
    const isSaved = await RefreshTokenModel.findOne({ refreshToken });
    console.log(isSaved);
    if (!isSaved) {
      return res.status(403).send(errJson);
    }
  } catch (err) {
    const serverErrJson: AuthErrorType = { error: err, type: "server error" };
    return res.status(500).send(serverErrJson);
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
  return res.status(403).send(errJson);
};
