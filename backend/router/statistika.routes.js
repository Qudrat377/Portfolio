const {Router} = require("express")
const { getAllStatistics, addStatistics } = require("../controller/statistics.controller")

const StatistikaRouter = Router()

StatistikaRouter.get("/get_all_statistiks", getAllStatistics)
// StatistikaRouter.get("/get_one_Statistika/:id", protocol, getOneStatistika)
// StatistikaRouter.get("/getOneStatistika_for_admin_update/:id", authorization, getOneStatistika_for_admin_update)
StatistikaRouter.post("/add_statistik", addStatistics)
// StatistikaRouter.put("/update_Statistika/:id", StatistikaValidationMiddleware, authorization, upload.single("file"), updateStatistika)
// StatistikaRouter.delete("/delete_Statistika/:id", authorization, deleteStatistika)
// StatistikaRouter.put("/All_Updete_Cotegoriys", authorization, AllUpdeteCotegoriys)

module.exports = StatistikaRouter
