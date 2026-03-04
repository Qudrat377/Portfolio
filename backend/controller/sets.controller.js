const SetsSchema = require("../schema/sets.schema");
const CustomErrorHandler = require("../Utils/custom-error-handler");
const logger = require("../Utils/logger");

const getAllSets = async (req, res, next) => {
  try {
    const learn = await SetsSchema.find();

    logger.info(`Sets so'raldi: DATA - ${req.headers['user-agent']}`, {
      metadata: { ip: req.ip, language: req.headers['accept-language'] },
    });
    
    res.status(200).json(learn);
  } catch (error) {
    logger.error(`Sets olishda xatolik: ${error.message}`, {
      metadata: {
        // userId: req.user?.id,
        stack: error.stack,
        params: req.params,
      },
    });

    next(error);
  }
};

const addSets = async (req, res, next) => {
  try {
    const { icon, title, url, context } = req.body;

    const newCategory = await SetsSchema.create({
      icon, 
      title, 
      url,
      context
    });

    logger.info(
      `Yangi Sets qo'shildi: Name - ${title}, Oner ID - ${url}`
    );

    res.status(201).json({
      message: "Added new Sets",
    });
  } catch (error) {
    logger.error(`Sets qo'shishda tizim xatosi: ${error.message}`, {
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
    });

    next(error);
  }
};

module.exports = {
  getAllSets,
  addSets
};
