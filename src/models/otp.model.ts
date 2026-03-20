import mongoose, { type HydratedDocument, type Model, type Types } from "mongoose";

export interface Otp {
    user: Types.ObjectId;
    email: string;
    otpHash: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

type OtpModel = Model<Otp>;

const otpSchema = new mongoose.Schema<Otp, OtpModel>(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: [true, "User is Required"]
        },
        email: {
            type: String,
            required: [true, "Email is required"]
        },
        otpHash: {
            type: String,
            required: [true, "OTP hash is required"]
        },
        expiresAt: {
            type: Date,
            required: [true, "OTP expiry is required"],
            index: { expires: 0 }
        }
    },
    {
        timestamps: true
    }
);

const otpModel = mongoose.model<Otp, OtpModel>("Otps", otpSchema);

export type OtpDocument = HydratedDocument<Otp>;
export default otpModel;
