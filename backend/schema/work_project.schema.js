const { Schema, model } = require("mongoose");

const WorkProject = new Schema({
    work_image: {
        type: String,
    },
    work_content: {
        type: String,
    },
    work_title: {
        type: String,
    },
    work_stack: {
        type: String,
    },
    github_link: {
        type: String,
    },
},
{
    versionKey: false,
    timestamps: true
}
)

const WorkProjectSchema = model("workProject", WorkProject)

module.exports = WorkProjectSchema