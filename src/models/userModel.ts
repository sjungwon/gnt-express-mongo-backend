import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  refreshToken: String,
  admin: { type: Boolean, default: false },
});

const UserModel = mongoose.model("UserModel", userSchema);

export default UserModel;
