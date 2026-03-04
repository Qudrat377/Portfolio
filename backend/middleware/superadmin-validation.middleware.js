const CustomErrorHandler = require("../Utils/custom-error-handler")
const { SuperadminValidator } = require("../validator/superadmin.validator")

module.exports = function(req, res, next) {
    const {error} = SuperadminValidator(req.body)

    if (error) {
       throw CustomErrorHandler.BadRequest(error.message)
    } 
    
    next()
}