const logger = require("../Utils/logger");

const requestLogger = (req, res, next) => {
    // So'rov tugagandan keyin log qilish uchun 'finish' eventidan foydalanamiz
    res.on('finish', () => {
        const logData = {
            ip: req.ip || req.connection.remoteAddress,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            userAgent: req.get('User-Agent')
        };

        if (res.statusCode >= 400) {
            // Agar 400 dan yuqori bo'lsa, bu xato yoki ogohlantirish
            logger.warn(`So'rov xato bilan tugadi: ${res.statusCode}`, { metadata: logData });
        } else {
            // Muvaffaqiyatli so'rovlar
            logger.info(`So'rov bajarildi: ${req.method} ${req.originalUrl}`, { metadata: logData });
        }
    });

    next();
};

module.exports = requestLogger;