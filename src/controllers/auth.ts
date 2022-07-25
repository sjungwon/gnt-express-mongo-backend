import { Request, Response } from "express";
import bcrypt from "bcrypt";
import UserModel from "../models/userModel.js";
import {
  jwtTokenGen,
  jwtTokenVerify,
  TokenPayload,
} from "../functions/token.js";
import RefreshTokenModel from "../models/refreshTokenModel.js";
import { authErrorJson, defaultErrorJson } from "../functions/errorJsonGen.js";

export const userSignin = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    //DB에서 유저 조회
    const findedUser = await UserModel.findOne({ username }).exec();

    //DB에 존재하지 않는 유저 -> 잘못 입력 혹은 가입되지 않은 유저
    if (!findedUser) {
      return res.status(404).send(authErrorJson("Login fail"));
    }

    //존재하는 경우 -> 비밀번호 검증
    const passwordVerify = await bcrypt.compare(password, findedUser.password);

    //틀린 비밀번호인 경우
    if (!passwordVerify) {
      return res.status(404).send(authErrorJson("Login fail"));
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
    //브라우저에서 JS로 토큰 접근 못하게 httpOnly 설정
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
    //access Token은 body로 전송 -> client에서 저장하고 사용
    res.status(200).json({ userData: tokenPayload, accessToken: accessToken });
  } catch (err: any) {
    res.status(500).json(defaultErrorJson("server error", err));
  }
};

//회원 가입
export const userSignup = async (req: Request, res: Response) => {
  const { username, password, email } = req.body;

  //가입 데이터 중 하나라도 없으면 에러 반환
  if (!username || !password || !email) {
    return res.status(400).json(defaultErrorJson("missing data"));
  }

  try {
    //이미 존재하는 이메일인지 확인
    const findDupEmail = await UserModel.findOne({ email }).exec();
    if (findDupEmail) {
      return res.status(409).json(authErrorJson("exist email"));
    }
    //이미 존재하는 사용자 이름인지 확인
    const findDupUsername = await UserModel.findOne({ username }).exec();
    if (findDupUsername) {
      return res.status(409).json(authErrorJson("exist username"));
    }

    //비밀번호 암호화
    const salt = await bcrypt.genSalt();
    const encryptPassword = await bcrypt.hash(password, salt);

    //유저 모델 생성
    const newUser = new UserModel({
      username,
      password: encryptPassword,
      email,
    });

    //db에 저장
    await newUser.save();

    //성공 반환
    res.status(201).send("register success");
  } catch (err: any) {
    //에러 반환
    res.status(500).json(defaultErrorJson("server error", err));
  }
};

//로그아웃
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

  //토큰이 없으면 에러 반환
  if (!refreshToken) {
    return res.status(403).send(defaultErrorJson("not signin"));
  }

  //저장된 refreshToken인지 확인
  try {
    const isSaved = await RefreshTokenModel.findOne({ refreshToken }).exec();
    if (!isSaved) {
      return res.status(403).send(defaultErrorJson("not signin"));
    }
  } catch (err: any) {
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
};

//비밀번호 찾기 요청
//사용자 이름, 이메일로 존재하는 계정인지 확인
export const findUserForFindPassword = async (req: Request, res: Response) => {
  const { username, email }: { username: string; email: string } = req.body;

  try {
    const isValid = await UserModel.findOne({ username, email }).exec();
    if (!isValid) {
      return res.status(404).json(defaultErrorJson("not found"));
    }

    res.status(200).send("confirmed");
  } catch (err: any) {
    return res.status(500).json(defaultErrorJson("server error", err));
  }
};

//비밀번호 찾기 요청에서 존재하는 계정이면
//암호 변경 요청
export const changePassword = async (req: Request, res: Response) => {
  const {
    username,
    email,
    password,
  }: { username: string; email: string; password: string } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json(defaultErrorJson("missing data"));
  }

  try {
    const hasUser = await UserModel.findOne({ username, email });
    if (!hasUser) {
      return res.status(404).json(defaultErrorJson("not found"));
    }
    const salt = await bcrypt.genSalt();
    const encryptPassword = await bcrypt.hash(password, salt);
    await UserModel.findOneAndUpdate(
      { username, email },
      { password: encryptPassword }
    );
    return res.status(201).send("password changed successfully");
  } catch (err: any) {
    return res.status(500).json(defaultErrorJson("server error", err));
  }
};
