const { Schema, model } = require("mongoose");

const About_me = new Schema({
    salom: {
        type: String,
    },
    fullName: {
        type: String,
    },
    work_title: {
        type: String,
    },
    work_description: {
        type: String,
    },
    about_me_image: {
        type: String,
    },
},
{
    versionKey: false,
    timestamps: true
}
)

const About_meSchema = model("about_me", About_me)

module.exports = About_meSchema