import connectDB from "./db/index.js";
import dotenv from 'dotenv';
import app from "./app.js";

dotenv.config({
    path: "./.env"
})

connectDB()
.then(() => {
    try {
        app.listen(process.env.PORT || 8000, () => {
            console.log(` Server up and running on port ${process.env.PORT} `)
        })
    } catch (error) {
        console.log(" Server creation Failed!! ")
        throw error
    }
})
.catch((err) => {
    console.log("MongoDB connection error", err)
    process.exit(1)
})