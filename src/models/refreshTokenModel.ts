import mongoose from "mongoose";

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

const RefreshTokenModel = mongoose.model("refresh_tokens", refreshTokenSchema);

export default RefreshTokenModel;
