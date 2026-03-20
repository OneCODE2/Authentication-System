import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: [true, "User is Required"]
    },
    email: {
        type: String,
        required: [true, "email is required"]
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

const otpModel = mongoose.model("Otps", otpSchema);

export default otpModel;
