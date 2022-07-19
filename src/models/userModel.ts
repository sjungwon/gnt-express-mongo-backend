import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  admin: { type: Boolean, default: false },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

userSchema.pre("save", function (next) {
  this.createdAt = new Date();
  next();
});

const UserModel = mongoose.model("users", userSchema);

export default UserModel;
