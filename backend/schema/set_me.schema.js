const { Schema, model } = require("mongoose");

const SetMe = new Schema({
    set_me_title_first: {
        type: String,
    },
    set_me_title_second: {
        type: String,
    },
    set_me_description: {
        type: String,
    },
},
{
    versionKey: false,
    timestamps: true
}
)

const SetMeSchema = model("setme", SetMe)

module.exports = SetMeSchema