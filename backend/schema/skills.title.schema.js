const { string } = require("joi");
const { Schema, model } = require("mongoose");

const SkillsTitle = new Schema({
    title_skill_header: {
        type: String,
    },
    title_skill_color: {
        type: String,
    },
    skill_description: {
        type: String,
    },
},
{
    versionKey: false,
    timestamps: true
});

const SkillsTitleSchema = model("skills", SkillsTitle);

module.exports = SkillsTitleSchema;