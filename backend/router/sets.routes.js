const {Router} = require("express")
const { getAllSets, addSets } = require("../controller/sets.controller")

const SetsRouter = Router()

SetsRouter.get("/get_all_sets", getAllSets)
// SetsRouter.get("/get_one_Sets/:id", protocol, getOneSets)
// SetsRouter.get("/getOneSets_for_admin_update/:id", authorization, getOneSets_for_admin_update)
SetsRouter.post("/add_sets", addSets)
// SetsRouter.put("/update_Sets/:id", SetsValidationMiddleware, authorization, upload.single("file"), updateSets)
// SetsRouter.delete("/delete_Sets/:id", authorization, deleteSets)
// SetsRouter.put("/All_Updete_Cotegoriys", authorization, AllUpdeteCotegoriys)

module.exports = SetsRouter




