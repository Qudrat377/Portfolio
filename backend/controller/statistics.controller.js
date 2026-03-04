const StatisticsSchema = require("../schema/statistika.schema");
const CustomErrorHandler = require("../Utils/custom-error-handler");
const logger = require("../Utils/logger");

const getAllStatistics = async (req, res, next) => {
  try {
    const aboutme = await StatisticsSchema.find();

    logger.info(`Statistics: ID - ${req.headers['user-agent']}`, {
      metadata: { ip: req.ip, language: req.headers['accept-language'] },
    });
    
    res.status(200).json(aboutme);
  } catch (error) {
    logger.error(`Statistika olishda xatolik: ${error.message}`, {
      metadata: {
        // userId: req.user?.id,
        stack: error.stack,
        params: req.params,
      },
    });

    next(error);
  }
};

const addStatistics = async (req, res, next) => {
  try {
    const { title, value } = req.body;

    const newCategory = await StatisticsSchema.create({
      title,
      value
    });

    logger.info(
      `Yangi statistika qo'shildi: Name - ${title}, Oner ID - ${value}`
    );

    res.status(201).json({
      message: "Added new Statistika",
    });
  } catch (error) {
    logger.error(`Statistika qo'shishda tizim xatosi: ${error.message}`, {
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
    });

    next(error);
  }
};


module.exports = {
  getAllStatistics,
  addStatistics,
};
