import jwt from "jsonwebtoken";
import { tokenErrorJson } from "../functions/errorJsonGen.js";
//유저 요청에서 유저 정보는 accessToken만으로 처리
//client 쪽에서 유저 정보가 필요한 요청인 경우
//token expire 오류 전달 받으면
//refresh 토큰으로 으로 access 토큰을 재발급 받은 후에
//요청하도록 구현
export default function tokenParser(req, res, next) {
    var _a;
    const accessToken = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    //토큰이 없는 경우
    if (!accessToken) {
        return res.status(403).send(tokenErrorJson());
    }
    const accessKey = process.env.JWT_SECRET_ACCESS || "";
    try {
        //토큰 검증 - 만료된 토큰이면 오류 반환
        const verify = jwt.verify(accessToken, accessKey, {
            ignoreExpiration: false,
        });
        //요청 데이터에 토큰 유저 정보 전달
        req.parseToken = verify;
        next();
    }
    catch (err) {
        return res.status(403).send(tokenErrorJson());
    }
}
