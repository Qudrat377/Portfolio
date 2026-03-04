const CustomErrorHandler = require("../Utils/custom-error-handler")
const jwt = require("jsonwebtoken")
const { accessToken } = require("../Utils/token-generator")

module.exports = function(req, res, next) {
    try {
        const refresh_token = req.cookies.refresh_token
        
        if (!refresh_token) {
            throw CustomErrorHandler.UnAuthorized("Refresh token not found")
        }

        const decode = jwt.verify(refresh_token, process.env.REFRESH_SECRET)

        const payload = {
        username: decode.username,
        email: decode.email,
        role: decode.role,
        id: decode._id,
      };
      const access_Token = accessToken(payload);

      res.cookie("access_token", access_Token, {
        httpOnly: true,
        secure: false, // Localhostda false bo'lishi kerak (HTTPS bo'lsa true)
        sameSite: 'lax', // Brauzer qabul qilishi uchun
        // maxAge: 1000 * 60 * 15,
          maxAge: 3600 * 1000 * 24 * 15, // o'chirish kerak
      });

      // res.cookie("access_token", access_Token, {
      //   httpOnly: true,
      //   maxAge: 1000 * 60 * 15,
      // });

      return res.status(200).json({
        message: "Success",
        access_Token,
      });
    } catch (error) {
        next(error)
    }
}