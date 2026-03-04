const SkillsTitleSchema = require("../schema/skills.title.schema");
const CustomErrorHandler = require("../Utils/custom-error-handler");
const logger = require("../Utils/logger");

const getAllSkillsTitle = async (req, res, next) => {
  try {
    const learn = await SkillsTitleSchema.find();

    logger.info(`Skills so'raldi: DATA - ${req.headers['user-agent']}`, {
      metadata: { ip: req.ip, language: req.headers['accept-language'] },
    });
    
    res.status(200).json(learn);
  } catch (error) {
    logger.error(`Skills olishda xatolik: ${error.message}`, {
      metadata: {
        // userId: req.user?.id,
        stack: error.stack,
        params: req.params,
      },
    });

    next(error);
  }
};

const addSkillsTitle = async (req, res, next) => {
  try {
    const { title_skill_header, title_skill_color, skill_description } = req.body;

    const newCategory = await SkillsTitleSchema.create({
      title_skill_header, 
      title_skill_color, 
      skill_description
    });

    logger.info(
      `Yangi Skills qo'shildi: Name - ${title_skill_header}, Oner ID - ${title_skill_color}`
    );

    res.status(201).json({
      message: "Added new Skills",
    });
  } catch (error) {
    logger.error(`Skills qo'shishda tizim xatosi: ${error.message}`, {
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
    });

    next(error);
  }
};


module.exports = {
  getAllSkillsTitle,
  addSkillsTitle
};
