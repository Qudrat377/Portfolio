const jwt = require("jsonwebtoken")
const CustomErrorHandler = require("../Utils/custom-error-handler")

module.exports = function(req, res, next) {
    try {
       const access_token = req.cookies.access_token 

       if (!access_token) {
        throw CustomErrorHandler.UnAuthorized("Access token not found")
       }

       const decode = jwt.verify(access_token, process.env.SECRET)
       
       req.user = decode

       if (!["superadmin", "admin"].includes(req.user.role)) {
        throw CustomErrorHandler.Forbidden("You are not admin, superadmin")
       }

       next()
    } catch (error) {
        next(error)
    }
}