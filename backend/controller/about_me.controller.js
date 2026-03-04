const About_meSchema = require("../schema/about_me.schema");
const CustomErrorHandler = require("../Utils/custom-error-handler");
const logger = require("../Utils/logger");

const getAllAboutMe = async (req, res, next) => {
  try {
    const aboutme = await About_meSchema.find();

    logger.info(`About_me: ID - ${req.headers['user-agent']}`, {
      metadata: { ip: req.ip, language: req.headers['accept-language'] },
    });
    
    res.status(200).json(aboutme);
  } catch (error) {
    logger.error(`Kategoriya olishda xatolik: ${error.message}`, {
      metadata: {
        // userId: req.user?.id,
        stack: error.stack,
        params: req.params,
      },
    });

    next(error);
  }
};

const addAboutMe = async (req, res, next) => {
  try {
    const { salom, fullName, work_title, work_description, about_me_image } = req.body;

    // 1. Ma'lumot yig'ish (Debug/Info)
    // logger.info(`Kategoriya yaratish boshlandi: User ID - ${access_id}`);

    const newCategory = await About_meSchema.create({
      salom, 
      fullName, 
      work_title, 
      work_description, 
      about_me_image
    });

    // 3. Muvaffaqiyat (Info)
    logger.info(
      `Yangi kategoriya qo'shildi: Name - ${fullName}, Oner ID - ${about_me_image}`
    );

    res.status(201).json({
      message: "Added new About me",
    });
  } catch (error) {
    // 4. Xatolikni faylga yozish (Error)
    // Error obyektini to'liq berish muhim (stack trace bilan)
    logger.error(`Kategoriya qo'shishda tizim xatosi: ${error.message}`, {
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
    });

    next(error);
  }
};

// const getOneCotegory = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const Cotegory = await MadellarSchema.find({ cotegory_id: id });

//     logger.info(`Kategoriya so'raldi: ID - ${req.user.id}`, {
//       metadata: { ip: req.ip },
//     });

//     if (!Cotegory) {
//       logger.warn(`Kategoriya topilmadi: So'ralgan ID - ${req.user.id}`, {
//         metadata: { url: req.originalUrl },
//       });
//       throw CustomErrorHandler.NotFound("Cotegory not found");
//     }

//     logger.info(`Kategoriya so'raldi: ID - ${id}`, {
//       metadata: { ip: req.ip },
//     });

//     res.status(200).json(Cotegory);
//   } catch (error) {
//     logger.error(`Kategoriya olishda xatolik: ${error.message}`, {
//       metadata: {
//         userId: req.user?.id,
//         stack: error.stack,
//         params: req.params,
//       },
//     });

//     next(error);
//   }
// };

// const getOneCotegory_for_admin_update = async (req, res, next) => {
//   try {
//     const {id} = req.params

//     logger.info(`Kategoriya so'raldi: ID - ${id}`, {
//     metadata: { ip: req.ip, url: req.originalUrl, id: req.user.id },
//     });

//     const cotegory = await CotegoriyaSchema.findById(id)

//     res.status(200).json(cotegory)
//   } catch (error) {
//       logger.error(`Kategoriya olishda xatolik: ${error.message}`, {
//         metadata: {
//           userId: req.user?.id,
//           stack: error.stack,
//           params: req.params,
//         },
//     });

//     next(error);
//   }
// };

// const updateCotegory = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const { Companiy } = req.body;
//     const Cotegory = await CotegoriyaSchema.findById(id);

//     logger.info(`Kategoriya so'raldi: ID - ${id}`, {
//       metadata: { ip: req.ip, url: req.originalUrl, id: req.user.id },
//     });

//     if (!Cotegory) {
//       logger.warn(`Kategoriya topilmadi: So'ralgan ID - ${id}`, {
//         metadata: { url: req.originalUrl, id: req.user.id },
//       });
//       throw CustomErrorHandler.NotFound("Cotegory not found");
//     }

//     const access_id = req.user.id;
//     const user = await AuthSchema.findById(access_id);

//     if (!user._id) {
//       logger.warn(`Foydalanuvchi topilmadi: So'ralgan ID - ${id}`, {
//         metadata: { url: req.originalUrl, id: req.user.id },
//       });
//       throw CustomErrorHandler.NotFound("user not found");
//     }

//     // o'zi qo'shganlarni o'zgartira olishligi uchun bu kodlar faqat ifni ichi

//     if (req.user.role === "admin") {
//       if (`${Cotegory.oner_id}` !== `${user._id}`) {
//         logger.warn(`Bu sizga tegishli cotegorya emas: So'ralgan ID - ${id}`, {
//           metadata: { url: req.originalUrl, id: req.user.id },
//         });
//         throw CustomErrorHandler.NotFound("This category is not yours");
//       }
//     }

//     await CotegoriyaSchema.findByIdAndUpdate(id, {
//       Companiy,
//       img_url: req.image,
//       oner_id: user._id,
//     });

//     logger.info(`Kategoriya qayta yangilandi: ID - ${id}`, {
//       metadata: { ip: req.ip, url: req.originalUrl, id: req.user.id },
//     });

//     res.status(201).json({
//       message: "Cotegory updated",
//     });
//   } catch (error) {
//     logger.error(`Kategoriya o'zgartirishda xatolik: ${error.message}`, {
//       metadata: {
//         userId: req.user?.id,
//         stack: error.stack,
//         params: req.params,
//       },
//     });

//     next(error);
//   }
// };

// const deleteCotegory = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const Cotegory = await CotegoriyaSchema.findById(id);

//     logger.info(`Kategoriya so'raldi: ID - ${id}`, {
//       metadata: { ip: req.ip, url: req.originalUrl, id: req.user.id },
//     });

//     if (!Cotegory) {
//       logger.warn(`Kategoriya topilmadi: So'ralgan ID - ${req.user.id}`, {
//         metadata: { url: req.originalUrl },
//       });
//       throw CustomErrorHandler.NotFound("Cotegory not found");
//     }

//     const user = await AuthSchema.findById(req.user.id);

//     // o'zi qo'shganlarni o'chira olishligi uchun bu kodlar faqat ifni ichi

//     if (req.user.role === "admin") {
//       if (`${Cotegory.oner_id}` !== `${user._id}`) {
//         logger.warn(`Bu sizga tegishli cotegorya emas: So'ralgan ID - ${id}`, {
//           metadata: { url: req.originalUrl, id: req.user.id },
//         });
//         throw CustomErrorHandler.NotFound("This category is not yours");
//       }
//     }
//     await CotegoriyaSchema.findByIdAndDelete(id);

//     logger.info(`Kategoriya o'chirildi: ID - ${req.user.id}`, {
//       metadata: { ip: req.ip },
//     });

//     res.status(200).json({
//       message: "Cotegory deleted",
//     });
//   } catch (error) {
//     logger.error(`Kategoriya o'chirishda xatolik: ${error.message}`, {
//       metadata: {
//         userId: req.user?.id,
//         stack: error.stack,
//         params: req.params,
//       },
//     });

//     next(error);
//   }
// };

// const AllUpdeteCotegoriys = async (req, res, next) => {
//   try {
//     const Cotegoriy = await CotegoriyaSchema.find();

//     const access_id = req.user.id;
//     const user = await AuthSchema.findById(access_id);

//     if (!user._id) {
//       throw CustomErrorHandler.NotFound("user not found");
//     }

//     for (let i = 0; i < Cotegoriy.length; i++) {
//       if (!["LADA", "CHEVROLET"].includes(Cotegoriy[i].Companiy)) {
//         await CotegoriyaSchema.findByIdAndUpdate(Cotegoriy[i]._id, {
//           oner_id: user._id,
//         });
//       }
//     }

//     res.status(200).json(Cotegoriy);
//   } catch (error) {
//     logger.error(
//       `Kategoriyadagi barcha malumotlarni o'zgartirishda xatolik: ${error.message}`,
//       {
//         metadata: {
//           userId: req.user?.id,
//           stack: error.stack,
//           params: req.params,
//         },
//       }
//     );

//     next(error);
//   }
// };

module.exports = {
  getAllAboutMe,
  addAboutMe,
  // getOneCotegory,
  // updateCotegory,
  // deleteCotegory,
  // AllUpdeteCotegoriys,
  // getOneCotegory_for_admin_update
};
