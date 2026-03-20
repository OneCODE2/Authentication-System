import mongoose, { type HydratedDocument, type Model } from "mongoose";

export interface User {
    username: string;
    email: string;
    password: string;
    verified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

type UserModel = Model<User>;

const userSchema = new mongoose.Schema<User, UserModel>(
    {
        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
            trim: true
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            trim: true,
            lowercase: true
        },
        password: {
            type: String,
            required: [true, "Password is required"]
        },
        verified: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

const userModel = mongoose.model<User, UserModel>("users", userSchema);

export type UserDocument = HydratedDocument<User>;
export default userModel;
