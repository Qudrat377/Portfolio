const WorkProjectSchema = require("../models/work_project.schema");
const CustomErrorHandler = require("../utils/custom-error-handler");
const logger = require("../utils/logger");

const getAllWorksProjects = async (req, res, next) => {
  try {
    const learn = await WorkProjectSchema.find();

    logger.info(`Works so'raldi: DATA - ${req.headers['user-agent']}`, {
      metadata: { ip: req.ip, language: req.headers['accept-language'] },
    });
    
    res.status(200).json(learn);
  } catch (error) {
    logger.error(`Works olishda xatolik: ${error.message}`, {
      metadata: {
        // userId: req.user?.id,
        stack: error.stack,
        params: req.params,
      },
    });

    next(error);
  }
};

const addWorksProjects = async (req, res, next) => {
  try {
    const { work_image, work_content, work_title, work_stack, github_link } = req.body;

    const newCategory = await WorkProjectSchema.create({
      work_image, 
      work_content, 
      work_title, 
      work_stack,
      github_link
    });

    logger.info(
      `Yangi Works qo'shildi: Name - ${work_image}, Oner ID - ${work_title}`
    );

    res.status(201).json({
      message: "Added new Works",
    });
  } catch (error) {
    logger.error(`Works qo'shishda tizim xatosi: ${error.message}`, {
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
    });

    next(error);
  }
};

module.exports = {
  getAllWorksProjects,
  addWorksProjects
};
