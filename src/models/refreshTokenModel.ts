import mongoose from "mongoose";

//Refresh 토큰 - 토큰 검증할 때 토큰이 변조됐는지 검증하기 위해 저장
const refreshTokenSchema = new mongoose.Schema({
  refreshToken: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

//refreshToken TTL 설정 -> 만료 기간
refreshTokenSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 7 }
);

//저장 시 현재 시간으로 저장
refreshTokenSchema.pre("save", function (next) {
  this.createdAt = new Date();
  next();
});

const RefreshTokenModel = mongoose.model("refresh_tokens", refreshTokenSchema);

export default RefreshTokenModel;
