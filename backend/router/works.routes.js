const {Router} = require("express")
const { getAllWorks, addWorks } = require("../controller/works.controller")

const WorksRouter = Router()

WorksRouter.get("/get_all_works", getAllWorks)
// WorksRouter.get("/get_one_Works/:id", protocol, getOneWorks)
// WorksRouter.get("/getOneWorks_for_admin_update/:id", authorization, getOneWorks_for_admin_update)
WorksRouter.post("/add_works", addWorks)
// WorksRouter.put("/update_Works/:id", WorksValidationMiddleware, authorization, upload.single("file"), updateWorks)
// WorksRouter.delete("/delete_Works/:id", authorization, deleteWorks)
// WorksRouter.put("/All_Updete_Cotegoriys", authorization, AllUpdeteCotegoriys)

module.exports = WorksRouter




