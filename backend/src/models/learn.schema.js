const { Schema, model } = require("mongoose");

const Learn = new Schema({
    title_learn: {
        type: String,
    },
    description_learn: {
        type: String,
    },
    image_url: {
        type: String,
    },
},
{
    versionKey: false,
    timestamps: true
}
)

const LearnSchema = model("learn", Learn)

module.exports = LearnSchema