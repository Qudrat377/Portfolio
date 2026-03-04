const CustomErrorHandler = require("../Utils/custom-error-handler")
const { CotegoriyaValidator } = require("../validator/cotegoriya.validation")

module.exports = function(req, res, next) {
    const {error} = CotegoriyaValidator(req.body)

    if (error) {
       throw CustomErrorHandler.BadRequest(error.message)
    } 
    
    next()
}