const {Router} = require("express")
const { getAllLearn, addLearn } = require("../controller/learn.controller")

const LearnRouter = Router()

LearnRouter.get("/get_all_learn", getAllLearn)
// LearnRouter.get("/get_one_Learn/:id", protocol, getOneLearn)
// LearnRouter.get("/getOneLearn_for_admin_update/:id", authorization, getOneLearn_for_admin_update)
LearnRouter.post("/add_learn", addLearn)
// LearnRouter.put("/update_Learn/:id", LearnValidationMiddleware, authorization, upload.single("file"), updateLearn)
// LearnRouter.delete("/delete_Learn/:id", authorization, deleteLearn)
// LearnRouter.put("/All_Updete_Cotegoriys", authorization, AllUpdeteCotegoriys)

module.exports = LearnRouter
