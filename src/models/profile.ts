import mongoose, { Types } from "mongoose";

export interface ProfileType {
  //user & category are refs for join collections
  user: Types.ObjectId;
  category: Types.ObjectId;
  name: string;
  createdAt?: Date;
}

const profileSchema = new mongoose.Schema<ProfileType>({
  user: {
    type: mongoose.SchemaTypes.ObjectId,
    required: true,
    ref: "users",
  },
  category: {
    type: mongoose.SchemaTypes.ObjectId,
    required: true,
    ref: "categories",
  },
  name: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

const ProfileModel = mongoose.model("profiles", profileSchema);

export default ProfileModel;
