const { Schema, model } = require("mongoose");

const Sets = new Schema({
    icon: {
        type: String,
    },
    title: {
        type: String,
    },
    url: {
        type: String,
    },
    context: {
        type: String,
    },
},
{
    versionKey: false,
    timestamps: true
}
)

const SetsSchema = model("sets", Sets)

module.exports = SetsSchema