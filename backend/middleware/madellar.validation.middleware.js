const CustomErrorHandler = require("../Utils/custom-error-handler")
const { MadellarValidator } = require("../validator/modellar.validation")

module.exports = function(req, res, next) {
    const {error} = MadellarValidator(req.body)

    if (error) {
       throw CustomErrorHandler.BadRequest(error.message)
    } 
    
    next()
}