const {Router} = require("express")
const { getAllAboutMe, addAboutMe } = require("../controller/about_me.controller")

const About_Me_Router = Router()

About_Me_Router.get("/get_all_about_me", getAllAboutMe)
// About_Me_Router.get("/get_one_About_Me_/:id", protocol, getOneAbout_Me_)
// About_Me_Router.get("/getOneAbout_Me__for_admin_update/:id", authorization, getOneAbout_Me__for_admin_update)
About_Me_Router.post("/add_about_me", addAboutMe)
// About_Me_Router.put("/update_About_Me_/:id", About_Me_ValidationMiddleware, authorization, upload.single("file"), updateAbout_Me_)
// About_Me_Router.delete("/delete_About_Me_/:id", authorization, deleteAbout_Me_)
// About_Me_Router.put("/All_Updete_Cotegoriys", authorization, AllUpdeteCotegoriys)

module.exports = About_Me_Router




