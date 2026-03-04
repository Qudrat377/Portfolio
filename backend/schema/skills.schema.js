const { Schema, model } = require("mongoose");

const Skills = new Schema({
    title_skill: {
        type: String,
    },
    // Bu yerda biz massiv ichida faqat stringlar bo'lishini aytyapmiz
    skill_items: [
        {
            type: String,
            trim: true
        }
    ],
    icon: {
        type: String,
    },
},
{
    versionKey: false,
    timestamps: true
});

const SkillsSchema = model("skill_items", Skills);

module.exports = SkillsSchema;