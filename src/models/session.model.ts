import mongoose, { type HydratedDocument, type Model, type Types } from "mongoose";

export interface Session {
    user: Types.ObjectId;
    refreshTokenHash: string;
    ip: string;
    userAgent: string;
    revoked: boolean;
    createdAt: Date;
    updatedAt: Date;
}

type SessionModel = Model<Session>;

const sessionSchema = new mongoose.Schema<Session, SessionModel>(
    {
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
        revoked: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

const sessionModel = mongoose.model<Session, SessionModel>("Sessions", sessionSchema);

export type SessionDocument = HydratedDocument<Session>;
export default sessionModel;
