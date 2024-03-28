import mongoose, { Schema } from "mongoose";

const topicSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        thumbnail: {
            type: String, // cloudinary url
            required: true
        },
        video: {
            type: String, // cloudinary url
            required: true
        },
        duration: {
            type: Number // taken from cloudinary response
        }
    },
    {
        timestamps: true
    }
)


export const Topic = mongoose.model("Topic", topicSchema)