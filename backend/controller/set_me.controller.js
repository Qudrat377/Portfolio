const SetMeSchema = require("../schema/set_me.schema");
const CustomErrorHandler = require("../Utils/custom-error-handler");
const logger = require("../Utils/logger");

const getAllSetMe = async (req, res, next) => {
  try {
    const learn = await SetMeSchema.find();

    logger.info(`Set me so'raldi: DATA - ${req.headers['user-agent']}`, {
      metadata: { ip: req.ip, language: req.headers['accept-language'] },
    });
    
    res.status(200).json(learn);
  } catch (error) {
    logger.error(`Set me olishda xatolik: ${error.message}`, {
      metadata: {
        // userId: req.user?.id,
        stack: error.stack,
        params: req.params,
      },
    });

    next(error);
  }
};

const addSetMe = async (req, res, next) => {
  try {
    const { set_me_title_first, set_me_title_second, set_me_description } = req.body;

    const newCategory = await SetMeSchema.create({
      set_me_title_first, 
      set_me_title_second, 
      set_me_description
    });

    logger.info(
      `Yangi Set me qo'shildi: Name - ${set_me_title_first}, Oner ID - ${set_me_title_second}`
    );

    res.status(201).json({
      message: "Added new Set me",
    });
  } catch (error) {
    logger.error(`Set me qo'shishda tizim xatosi: ${error.message}`, {
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
    });

    next(error);
  }
};


module.exports = {
  getAllSetMe,
  addSetMe
};
