const {Router} = require("express")
const { getAllCVandSertificat, addCVandSertificat } = require("../controllers/cv_sertificat.controller")

const CVandSertificatRouter = Router()

CVandSertificatRouter.get("/get_all_CVandSertificat", getAllCVandSertificat)
// CVandSertificatRouter.get("/get_one_CVandSertificat/:id", protocol, getOneCVandSertificat)
// CVandSertificatRouter.get("/getOneCVandSertificat_for_admin_update/:id", authorization, getOneCVandSertificat_for_admin_update)
CVandSertificatRouter.post("/add_CVandSertificat", addCVandSertificat)
// CVandSertificatRouter.put("/update_CVandSertificat/:id", CVandSertificatValidationMiddleware, authorization, upload.single("file"), updateCVandSertificat)
// CVandSertificatRouter.delete("/delete_CVandSertificat/:id", authorization, deleteCVandSertificat)
// CVandSertificatRouter.put("/All_Updete_Cotegoriys", authorization, AllUpdeteCotegoriys)

module.exports = CVandSertificatRouter
