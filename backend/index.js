const express = require("express")
const cors = require("cors")
require("dotenv").config()
// const requestLogger = require("./middleware/middleware.logger") //logger
const connectDB = require("./config/db.config")
const About_Me_Router = require("./router/cotegory.routes")
const StatistikaRouter = require("./router/statistika.routes")
const LearnRouter = require("./router/learn.routes")
const CVandSertificatRouter = require("./router/cv_sertificat.routes")
const SkillsTitleRouter = require("./router/skills_title.routes")
const SkillsRouter = require("./router/skills.routes")
const WorksRouter = require("./router/works.routes")
const WorkProjectsRouter = require("./router/work_projects.routes")
const SetMeRouter = require("./router/set_me.routes")
const SetsRouter = require("./router/sets.routes")
const app = express()

const PORT = process.env.PORT || 3000
app.use(cors({origin: true, credentials: true}))
app.use(express.json()) 

connectDB()

// router 
app.use(About_Me_Router)
app.use(StatistikaRouter)
app.use(LearnRouter)
app.use(CVandSertificatRouter)
app.use(SkillsTitleRouter)
app.use(SkillsRouter)
app.use(WorksRouter)
app.use(WorkProjectsRouter)
app.use(SetMeRouter)
app.use(SetsRouter)

app.listen(PORT, () => {
    console.log("Ishladi: " + PORT);
})