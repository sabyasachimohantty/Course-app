import mongoose, { Schema } from "mongoose";

const courseSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true,
        },
        thumbnail: {
            type: String, // cloudinary url
            required: true
        },
        price: {
            type: Number,
            default: 0,
        },
        topics: [
            {
                type: mongoose.Types.ObjectId,
                ref: "Topic"
            }
        ],
        isPublished: {
            type: Boolean,
            default: False
        }
    },
    {
        timestamps: true
    }
)


export const Course = mongoose.model("Course", courseSchema)