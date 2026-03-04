const { Schema, model } = require("mongoose");

const Statistics = new Schema({
    title: {
        type: String,
    },
    value: {
        type: String,
    },
},
{
    versionKey: false,
    timestamps: true
}
)

const StatisticsSchema = model("statistics", Statistics)

module.exports = StatisticsSchema