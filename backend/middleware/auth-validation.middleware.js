const CustomErrorHandler = require("../Utils/custom-error-handler")
const { AuthValidator } = require("../validator/auth.validator")

module.exports = function(req, res, next) {
    const {error} = AuthValidator(req.body)

    if (error) {
       throw CustomErrorHandler.BadRequest(error.message)
    } 
    
    next()
}