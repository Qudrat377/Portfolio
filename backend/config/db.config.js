const mongoose = require("mongoose")

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log("Connect to DB"))
        .catch((error) => console.log(error, "Xatolik dbga ulanishdan"))
    } catch(error) {
        console.log(error.message);       
    }
}

module.exports = connectDB