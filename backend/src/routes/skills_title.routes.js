const {Router} = require("express")
const { getAllSkillsTitle, addSkillsTitle } = require("../controllers/skillls_title.controller")

const SkillsTitleRouter = Router()

SkillsTitleRouter.get("/get_skills_title", getAllSkillsTitle)
// SkillsTitleRouter.get("/get_one_SkillsTitle/:id", protocol, getOneSkillsTitle)
// SkillsTitleRouter.get("/getOneSkillsTitle_for_admin_update/:id", authorization, getOneSkillsTitle_for_admin_update)
SkillsTitleRouter.post("/add_skills_title", addSkillsTitle)
// SkillsTitleRouter.put("/update_SkillsTitle/:id", SkillsTitleValidationMiddleware, authorization, upload.single("file"), updateSkillsTitle)
// SkillsTitleRouter.delete("/delete_SkillsTitle/:id", authorization, deleteSkillsTitle)
// SkillsTitleRouter.put("/All_Updete_Cotegoriys", authorization, AllUpdeteCotegoriys)

module.exports = SkillsTitleRouter




