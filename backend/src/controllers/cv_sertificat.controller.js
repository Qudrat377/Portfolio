const PdfSchema = require("../models/cv_and_sertifikat.schema");
const CustomErrorHandler = require("../utils/custom-error-handler");
const logger = require("../utils/logger");

const getAllCVandSertificat = async (req, res, next) => {
  try {
    const learn = await PdfSchema.find();

    logger.info(`CV and Statistika: ID - ${req.headers['user-agent']}`, {
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

const addCVandSertificat = async (req, res, next) => {
  try {
    const { cv_url, sertificat_url } = req.body;

    const newCategory = await PdfSchema.create({
      cv_url,
      sertificat_url
    });

    logger.info(
      `Yangi Learn qo'shildi: Name - ${cv_url}, Oner ID - ${sertificat_url}`
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
  getAllCVandSertificat,
  addCVandSertificat
};
