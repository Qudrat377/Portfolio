const {Router} = require("express")
const { getAllSetMe, addSetMe } = require("../controller/set_me.controller")

const SetMeRouter = Router()

SetMeRouter.get("/get_all_SetMe", getAllSetMe)
// SetMeRouter.get("/get_one_SetMe/:id", protocol, getOneSetMe)
// SetMeRouter.get("/getOneSetMe_for_admin_update/:id", authorization, getOneSetMe_for_admin_update)
SetMeRouter.post("/add_SetMe", addSetMe)
// SetMeRouter.put("/update_SetMe/:id", SetMeValidationMiddleware, authorization, upload.single("file"), updateSetMe)
// SetMeRouter.delete("/delete_SetMe/:id", authorization, deleteSetMe)
// SetMeRouter.put("/All_Updete_Cotegoriys", authorization, AllUpdeteCotegoriys)

module.exports = SetMeRouter




