import mongoose, { Schema } from "mongoose";

export interface CategoryType {
  _id: mongoose.Schema.Types.ObjectId;
  creator: {
    id: mongoose.Schema.Types.ObjectId;
    username: string;
  };
  title: string;
  createdAt: Date;
}

const categorySchema = new mongoose.Schema<CategoryType>({
  creator: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
  },
  title: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

const CategoryModel = mongoose.model("category", categorySchema);

export default CategoryModel;
