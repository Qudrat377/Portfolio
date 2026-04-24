const router = require('express').Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const groupRoutes = require('./group.routes');
const attendanceRoutes = require('./attendance.routes');
const homeworkRoutes = require('./homework.routes');
const vocabularyRoutes = require('./vocabulary.routes');
const submissionRoutes = require('./submission.routes');
const speakingResultRoutes = require('./speakingResult.routes');
const analyticsRoutes = require('./analytics.routes');
const vocabCheckRoutes = require('./vocabCheck.routes');

const About_Me_Router = require("./cotegory.routes")
const StatistikaRouter = require("./statistika.routes")
const LearnRouter = require("./learn.routes")
const CVandSertificatRouter = require("./cv_sertificat.routes")
const SkillsTitleRouter = require("./skills_title.routes")
const SkillsRouter = require("./skills.routes")
const WorksRouter = require("./works.routes")
const WorkProjectsRouter = require("./work_projects.routes")
const SetMeRouter = require("./set_me.routes")
const SetsRouter = require("./sets.routes")
const studentVocabRoutes = require("./Studentvocab.routes");
const personalWordRoutes = require('./Personalword.routes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/groups', groupRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/homework', homeworkRoutes);
router.use('/vocabulary', vocabularyRoutes);
router.use('/vocab-checks', vocabCheckRoutes);
router.use('/submissions', submissionRoutes);
router.use('/speaking-results', speakingResultRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/student-vocab', studentVocabRoutes);
router.use('/personal-words', personalWordRoutes);

// router 
router.use(About_Me_Router)
router.use(StatistikaRouter)
router.use(LearnRouter)
router.use(CVandSertificatRouter)
router.use(SkillsTitleRouter)
router.use(SkillsRouter)
router.use(WorksRouter)
router.use(WorkProjectsRouter)
router.use(SetMeRouter)
router.use(SetsRouter)

module.exports = router;
