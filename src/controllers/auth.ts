import { Request, Response } from "express";
import bcrypt from "bcrypt";
import UserModel from "../models/userModel.js";
import {
  jwtTokenGen,
  jwtTokenVerify,
  TokenPayload,
} from "../functions/token.js";

export const userSignin = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    //DB에서 유저 조회
    const findedUser = await UserModel.findOne({ username });

    //DB에 존재하지 않는 유저 -> 잘못 입력 혹은 가입되지 않은 유저
    if (!findedUser) {
      return res.status(404).send("Login Failed");
    }

    //존재하는 경우 -> 비밀번호 검증
    const passwordVerify = await bcrypt.compare(password, findedUser.password);

    //틀린 비밀번호인 경우
    if (!passwordVerify) {
      return res.status(404).send("Login Failed");
    }

    //로그인 성공
    const tokenPayload: TokenPayload = {
      username: findedUser.username,
      id: findedUser._id,
      admin: findedUser.admin,
    };

    const accessToken = jwtTokenGen(tokenPayload, "access");
    const refreshToken = jwtTokenGen(tokenPayload, "refresh");

    //refresh Token은 쿠키에 저장
    res.cookie("refreshToken", refreshToken, { httpOnly: true });
    //access Token은 body로 전송 -> client에서 저장하고 사용
    res.status(200).json({ token: accessToken });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

export const userSignup = async (req: Request, res: Response) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res
      .status(400)
      .json({ error: "some data missing", type: "missing data" });
  }

  try {
    const findDupEmail = await UserModel.findOne({ email });
    if (findDupEmail) {
      return res
        .status(409)
        .json({ error: "email already exist", type: "exist email" });
    }
    const findDupUsername = await UserModel.findOne({ username });
    if (findDupUsername) {
      return res
        .status(409)
        .json({ error: "username already exist", type: "exist username" });
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
    res.status(500).json({ error: err });
  }
};

export const userSignout = (req: Request, res: Response) => {
  res.status(202).clearCookie("refreshToken").send("logout success");
};

//access token 재발급 + access가 살아있는 경우 refresh가 만료됐으면 refresh도 재설정
export const userSigninCheck = (req: Request, res: Response) => {
  const refreshToken: string = req.cookies.refreshToken || "";
  const refreshKey = process.env.JWT_SECRET_REFRESH || "";

  //refresh 토큰 검증
  const refreshVerify = jwtTokenVerify(refreshToken, refreshKey);

  //refresh가 유효하면 access만 재발급
  if (refreshVerify) {
    const newAccessToken = jwtTokenGen(refreshVerify, "access");
    return res.status(202).json({ accessToken: newAccessToken });
  }

  //refresh가 만료 혹은 오류이면
  //access 검증
  const accessToken: string = req.headers.authorization?.split(" ")[1] || "";
  const accessKey = process.env.JWT_SECRET_ACCESS || "";
  const accessVerify = jwtTokenVerify(accessToken, accessKey);

  //access가 만료 혹은 오류이면 = refresh & access 토큰 유효하지 않음
  if (!accessVerify) {
    return res.status(403).send("token expired");
  }

  //access가 유효하면 -> refresh만 만료됨 -> 둘 다 갱신
  const newAccessToken = jwtTokenGen(accessVerify, "access");
  const newRefreshToken = jwtTokenGen(accessVerify, "refresh");

  res.cookie("refreshToken", newRefreshToken, { httpOnly: true });
  res.status(202).json({ accessToken: newAccessToken });
};
