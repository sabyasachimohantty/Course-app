import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({
            validateBeforeSave: false
        })

        return { accessToken, refreshToken }


    } catch (error) {
        throw new ApiError(500, "Something went wrong during generation of access and refresh token")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    const { username, email, fullName, password } = req.body

    if (
        [username, email, fullName, password].some((field) =>
        field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    if (!email.includes("@")) {
        throw new ApiError(400, "Invalid email")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser) {
        throw new ApiError(409, "User already exists")
    }

    const user = await User.create({
        fullName,
        username,
        email,
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user")
    }
    
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

})

const loginUser = asyncHandler( async (req, res) => {

    const { email, username, password } = req.body

    if (!(email || username)) {
        throw new ApiError(400, "Username or email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const validPassword = user.isPasswordCorrect(password)

    if (!validPassword) {
        throw new ApiError(401, "Incorrect password")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, loggedInUser, "User logged in successfully")
    )

})

const logoutUser = asyncHandler( async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {refreshToken: undefined}
        },
        {
            new: true
        }
    )

    res
    .status(200)
    .clearCookie("accessToken", {httpOnly: true})
    .clearCookie("refreshToken", {httpOnly: true})
    .json(
        new ApiResponse(200, {}, "User logged out successfully")
    )

})

const refreshAccessToken = asyncHandler( async (req, res) => {

    const incommingRefreshToken = req.cookies.refreshToken

    const decodedToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id)

    if(!user) {
        throw new ApiError(401, "Invalid refresh token")
    }

    if(incommingRefreshToken !== user.refreshToken) {
        throw new ApiError(401, "Refresh token is expired or Unauthorised request")
    }

    const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)

    res
    .status(200)
    .cookie("accessToken", accessToken, {httpOnly: true})
    .cookie("refreshToken", newRefreshToken, {httpOnly: true})
    .json(
        new ApiResponse(200, {accessToken, refreshToken: newRefreshToken}, "Access token refreshed")
    )

})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}