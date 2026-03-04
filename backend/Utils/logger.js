// const { createLogger, format, transports } = require('winston');
// require("winston-mongodb");

// // 1. Faqat INFO va undan past (error/warn bo'lmagan) loglar uchun filtr
// const onlyLowLevelFilter = format((info) => {
//     // Agar log darajasi 'error' yoki 'warn' bo'lsa, uni o'tkazma (false qaytar)
//     if (info.level === 'error' || info.level === 'warn') {
//         return false;
//     }
//     return info;
// });

// const logger = createLogger({
//     level: "debug",
//     format: format.combine(
//         format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
//         format.metadata(), // IP va boshqa meta ma'lumotlarni saqlash uchun muhim
//         format.json()
//     ),
//     transports: [
//         // Konsol uchun (Hamma narsani ko'rib turish uchun qolgani yaxshi)
//         new transports.Console({
//             format: format.combine( format.simple())
//         }),

//         // 2. MongoDB - FAQAT ERRORLAR
//         new transports.MongoDB({ 
//             db: process.env.MONGO_URI,
//             level: "error",
//             filename: "log/errors.log",
//             collection: "error_logs",
//             // options: { useUnifiedTopology: true }
//         }),

//         // 3. MongoDB - FAQAT WARNINGLAR
//         new transports.MongoDB({ 
//             db: process.env.MONGO_URI,
//             level: "warn",
//             collection: "warning_logs",
//             format: format.combine(
//                 format((info) => info.level === "warn" ? info : false)(),
//                 format.json()
//             ),
//             // options: { useUnifiedTopology: true }
//         }),

//         // 4. MongoDB - FAQAT INFO VA DEBUG (Error va Warn'larsiz)
//         new transports.MongoDB({
//             level: "info",
//             db: process.env.MONGO_URI,
//             collection: "logs",
//             format: format.combine(
//                 onlyLowLevelFilter(), // Yuqoridagi filtrni qo'llaymiz
//                 format.json()
//             ),
//             // options: { useUnifiedTopology: true }
//         })
//     ]
// });

// module.exports = logger;


// const { createLogger, format, transports } = require('winston');
// require("winston-mongodb")

// const logger = createLogger({
//     level: "debug",
//     format: format.combine(
//     // format.colorize(),
//     format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
//     format.json()
//     ),
//     transports: [
//         new transports.Console(),
//         new transports.File({filename: "log/universal.log"}),

//         new transports.MongoDB({ 
//             db: process.env.MONGO_URI,
//             level: "error",
//             collection: "error_logs" 
//         }),

//         new transports.MongoDB({ 
//             db: process.env.MONGO_URI,
//             level: "warn",
//             collection: "warning_logs",
//             format: format.combine(
//                format((info) => info.level === "warn" ? info : false)(),
//                 format.json()
//             )
//         }),

//         new transports.MongoDB({db: process.env.MONGO_URI, level: "info", collection: "logs"})
//     ]
// })

// module.exports = logger 







// const { createLogger, format, transports } = require('winston');
// require("winston-mongodb");

// // 1. To'g'rilangan filtr funksiyasi
// const filterByLevel = (level) => {
//     return format((info) => {
//         if (info.level === level) {
//             return info;
//         }
//         return false;
//     })(); // Bu yerda instansiya hosil qilinadi
// };

// const logger = createLogger({
//     level: "debug",
//     format: format.combine(
//         format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
//         format.json()
//     ),
//     transports: [
//         new transports.Console({
//             format: format.combine(format.colorize(), format.simple())
//         }),
//         new transports.File({ filename: "log/universal.log" }),

//         // Faqat errorlar uchun
//         new transports.File({ 
//             filename: "log/errors.log", 
//             level: "error" 
//         }),

//         // Faqat warninglar uchun (Filtr bilan)
//         new transports.File({ 
//             filename: "log/warnings.log", 
//             level: "warn",
//             format: format.combine(
//                 format((info) => info.level === 'warn' ? info : false)(), // To'g'ridan-to'g'ri filtr
//                 format.json()
//             )
//         }),

//         new transports.MongoDB({
//             db: process.env.MONGO_URI,
//             collection: 'logs'
//         })
//     ]
// });

// module.exports = logger;



// const { createLogger, format, transports } = require('winston');
// require("winston-mongodb");

// const logger = createLogger({
//     level: "debug",
//     format: format.combine(
//         format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
//         format.json()
//     ),
//     transports: [
//         new transports.Console(),
//         new transports.File({ filename: "log/universal.log" }),

//         // 1. Faqat ERRORlar uchun MongoDB kolleksiyasi
//         new transports.MongoDB({
//             db: process.env.MONGO_URI,
//             level: 'error',
//             collection: 'error_logs', // Alohida kolleksiya
//             // options: { useUnifiedTopology: true }
//         }),

//         // 2. Faqat WARNINGlar uchun MongoDB kolleksiyasi
//         new transports.MongoDB({
//             db: process.env.MONGO_URI,
//             level: 'warn',
//             collection: 'warning_logs', // Alohida kolleksiya
//             format: format.combine(
//                 format((info) => info.level === 'warn' ? info : false)(),
//                 format.json()
//             ),
//             // options: { useUnifiedTopology: true }
//         }),

//         // 3. Ixtiyoriy: Barcha loglar uchun umumiy kolleksiya (kerak bo'lsa)
//         new transports.MongoDB({
//             db: process.env.MONGO_URI,
//             level: 'info',
//             collection: 'all_logs'
//         })
//     ]
// });

// module.exports = logger;




const { createLogger, format, transports } = require('winston');
require("winston-mongodb");

// Faqat INFO va DEBUG (error/warn bo'lmagan) loglar uchun filtr
const onlyLowLevelFilter = format((info) => {
    return (info.level !== 'error' && info.level !== 'warn') ? info : false;
});

const logger = createLogger({
    level: "debug",
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.json()
    ),
    transports: [
        // 1. Konsol
        new transports.Console({
            format: format.simple()
        }),

        // 2. MongoDB - ERRORLAR
        new transports.MongoDB({ 
            db: process.env.MONGO_URI,
            level: "error",
            collection: "error_logs",
            storeHost: true, // Qaysi serverdan kelganini bilish uchun
            capsule: true    // Ma'lumotlarni obyekt ichida saqlash
        }),

        // 3. MongoDB - WARNINGLAR
        new transports.MongoDB({ 
            db: process.env.MONGO_URI,
            level: "warn",
            collection: "warning_logs",
            format: format.combine(
                format((info) => info.level === "warn" ? info : false)(),
                format.json()
            )
        }),

        // 4. MongoDB - INFO VA DEBUG
        new transports.MongoDB({
            db: process.env.MONGO_URI,
            level: "info",
            collection: "logs",
            format: format.combine(
                onlyLowLevelFilter(),
                format.json()
            )
        })
    ]
});

module.exports = logger;