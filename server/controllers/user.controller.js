// controllers/user.controller.js
import { userModel as UserModel } from "../models/user.model.js";
import { tokenModel as TokenModel } from "../models/blacklistedToken.model.js";
import { validationResult } from "express-validator";
import { sendResponse } from "../utils/response.util.js";

/**
 * Controller to handle user registration
 */
export const registerFun = async (req, res) => {
  try {
    // Validate request data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, "Validation Error", {
        errors: errors.array(),
      });
    }

    const { firstName, lastName, email, password } = req.body;

    // Ensure all required fields are provided
    if (!firstName || !email || !password) {
      return sendResponse(res, 400, false, "All fields are required");
    }
    const isAlereadyExist = await UserModel.findOne({ email });
    if (isAlereadyExist) {
      return sendResponse(res, 400, false, "User already exist");
    }

    // Create new user
    const user = await UserModel.create({
      fullName: { firstName, lastName },
      email,
      password,
    });

    // Generate access token
    const token = user.generateAccessToken();

    // Respond with user data and token
    return sendResponse(res, 201, true, "User registered successfully", {
      user,
      token,
    });
  } catch (error) {
    // Handle server errors
    return sendResponse(res, 500, false, "Internal Server Error", {
      error: error.message,
    });
  }
};

/**
 * Controller to handle user login
 */
export const loginFun = async (req, res) => {
  try {
    // Validate request data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, "Validation Error", {
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Ensure all required fields are provided
    if (!email || !password) {
      return sendResponse(res, 400, false, "All fields are required");
    }

    // Find user by email
    const user = await UserModel.findOne({ email }).select("+password");
    if (!user) {
      return sendResponse(res, 401, false, "Invalid email or password");
    }

    // Check if password matches
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return sendResponse(res, 401, false, "Invalid email or password");
    }

    // Generate access token
    const token = user.generateAccessToken();

    //Set Token to Cookies
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
    });
    // Respond with token
    return sendResponse(res, 200, true, "Login successful", { token });
  } catch (error) {
    // Handle server errors
    return sendResponse(res, 500, false, "Internal Server Error", {
      error: error.message,
    });
  }
};
/**
 * Controller to handle user logout
 */
export const logoutFun = async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    await TokenModel.create({
      token: token,
    });
    res.clearCookie("token");
    return sendResponse(res, 200, true, "Logout successful");
  } catch (error) {
    // Handle server errors
    return sendResponse(res, 500, false, "Internal Server Error", {
      error: error.message,
    });
  }
};

/**
 * Controller to get the authenticated user's profile
 */
export const getProfileFun = async (req, res) => {
  try {
    // Respond with the user profile
    return sendResponse(res, 200, true, "Profile fetched successfully", {
      user: req.user,
    });
  } catch (error) {
    // Handle server errors
    return sendResponse(res, 500, false, "Internal Server Error", {
      error: error.message,
    });
  }
};
