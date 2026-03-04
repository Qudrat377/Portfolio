const LearnSchema = require("../schema/learn.schema");
const CustomErrorHandler = require("../Utils/custom-error-handler");
const logger = require("../Utils/logger");

const getAllLearn = async (req, res, next) => {
  try {
    const learn = await LearnSchema.find();

    logger.info(`Statistics: ID - ${req.headers['user-agent']}`, {
      metadata: { ip: req.ip, language: req.headers['accept-language'] },
    });
    
    res.status(200).json(learn);
  } catch (error) {
    logger.error(`Learn olishda xatolik: ${error.message}`, {
      metadata: {
        // userId: req.user?.id,
        stack: error.stack,
        params: req.params,
      },
    });

    next(error);
  }
};

const addLearn = async (req, res, next) => {
  try {
    const { title_learn, description_learn, image_url } = req.body;

    const newCategory = await LearnSchema.create({
      title_learn, 
      description_learn, 
      image_url
    });

    logger.info(
      `Yangi Learn qo'shildi: Name - ${title_learn}, Oner ID - ${image_url}`
    );

    res.status(201).json({
      message: "Added new Learn",
    });
  } catch (error) {
    logger.error(`Learn qo'shishda tizim xatosi: ${error.message}`, {
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
    });

    next(error);
  }
};


module.exports = {
  getAllLearn,
  addLearn
};
