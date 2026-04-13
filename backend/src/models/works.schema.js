const { Schema, model } = require("mongoose");

const Works = new Schema({
    work_header_title: {
        type: String,
    },
    work_value: {
        type: String,
    },
},
{
    versionKey: false,
    timestamps: true
}
)

const WorksSchema = model("works", Works)

module.exports = WorksSchema