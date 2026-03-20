import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: [true, "User is Required"]
    },
    refreshTokenHash: {
        type: String,
        required: [true, "Refresh token is Required"]
    },
    ip: {
        type: String,
        required: [true, "Ip is Required"]
    },
    userAgent: {
        type: String,
        required: [true, "User Agent is Required"]
    },
    revoked:{
        type:Boolean,
        default:false,
    }
},{
    timestamps:true
});

const sessionModel = mongoose.model("Sessions", sessionSchema);

export default sessionModel;
