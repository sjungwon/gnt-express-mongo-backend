import mongoose, { Types } from "mongoose";

export interface ProfileType {
  //user & category are refs for join collections
  user: Types.ObjectId;
  category: Types.ObjectId;
  nickname: string;
  profileImage: {
    URL?: string;
    Key?: string;
  };
  profileImageURL?: string;
  profileImageKey?: string;
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
  nickname: {
    type: String,
    required: true,
  },
  profileImage: {
    URL: {
      type: String,
      default: "",
    },
    Key: {
      type: String,
      default: "",
    },
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

const ProfileModel = mongoose.model("profiles", profileSchema);

export default ProfileModel;
