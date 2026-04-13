const WorksSchema = require("../models/works.schema");
const CustomErrorHandler = require("../utils/custom-error-handler");
const logger = require("../utils/logger");

const getAllWorks = async (req, res, next) => {
  try {
    const learn = await WorksSchema.find();

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

const addWorks = async (req, res, next) => {
  try {
    const { work_header_title, work_value } = req.body;

    const newCategory = await WorksSchema.create({
      work_header_title, 
      work_value
    });

    logger.info(
      `Yangi Works qo'shildi: Name - ${work_header_title}, Oner ID - ${work_value}`
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
  getAllWorks,
  addWorks
};
