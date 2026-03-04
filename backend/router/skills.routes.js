const {Router} = require("express")
const { getAllSkills, addSkills } = require("../controller/skills.controller")

const SkillsRouter = Router()

SkillsRouter.get("/get_all_skills", getAllSkills)
// SkillsRouter.get("/get_one_Skills/:id", protocol, getOneSkills)
// SkillsRouter.get("/getOneSkills_for_admin_update/:id", authorization, getOneSkills_for_admin_update)
SkillsRouter.post("/add_skills", addSkills)
// SkillsRouter.put("/update_Skills/:id", SkillsValidationMiddleware, authorization, upload.single("file"), updateSkills)
// SkillsRouter.delete("/delete_Skills/:id", authorization, deleteSkills)
// SkillsRouter.put("/All_Updete_Cotegoriys", authorization, AllUpdeteCotegoriys)

module.exports = SkillsRouter




