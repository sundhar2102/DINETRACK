const authService = require('../services/auth.service');
const { successResponse, errorResponse } = require('../utils/response');

const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;
    if (!name || !email || !password) {
      return errorResponse(res, 'Name, email, and password are required', 400);
    }
    const result = await authService.register({ name, email, password, phone, role });
    return successResponse(res, result, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 400);
    }
    const result = await authService.login({ email, password });
    return successResponse(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { idToken, role } = req.body;
    if (!idToken) {
      return errorResponse(res, 'Google ID token is required', 400);
    }
    const result = await authService.googleLogin({ idToken, role });
    return successResponse(res, result, 'Google Login successful');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    return successResponse(res, user);
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  return successResponse(res, null, 'Logged out successfully');
};

module.exports = {
  register,
  login,
  googleLogin,
  getMe,
  logout
};
