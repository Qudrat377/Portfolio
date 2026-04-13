const SkillsSchema = require("../models/skills.schema");
const CustomErrorHandler = require("../utils/custom-error-handler");
const logger = require("../utils/logger");

const getAllSkills = async (req, res, next) => {
  try {
    const learn = await SkillsSchema.find();

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

const addSkills = async (req, res, next) => {
  try {
    const { title_skill, skill_items, icon } = req.body;

    const newCategory = await SkillsSchema.create({
      title_skill, 
      skill_items, 
      icon
    });

    logger.info(
      `Yangi Skills qo'shildi: Name - ${title_skill}, Oner ID - ${skill_items}`
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
  getAllSkills,
  addSkills
};
