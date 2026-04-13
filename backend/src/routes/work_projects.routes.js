const {Router} = require("express")
const { getAllWorksProjects, addWorksProjects } = require("../controllers/work_projects.controller")

const WorkProjectsRouter = Router()

WorkProjectsRouter.get("/get_all_WorkProjects", getAllWorksProjects)
// WorkProjectsRouter.get("/get_one_WorkProjects/:id", protocol, getOneWorkProjects)
// WorkProjectsRouter.get("/getOneWorkProjects_for_admin_update/:id", authorization, getOneWorkProjects_for_admin_update)
WorkProjectsRouter.post("/add_WorkProjects", addWorksProjects)
// WorkProjectsRouter.put("/update_WorkProjects/:id", WorkProjectsValidationMiddleware, authorization, upload.single("file"), updateWorkProjects)
// WorkProjectsRouter.delete("/delete_WorkProjects/:id", authorization, deleteWorkProjects)
// WorkProjectsRouter.put("/All_Updete_Cotegoriys", authorization, AllUpdeteCotegoriys)

module.exports = WorkProjectsRouter




