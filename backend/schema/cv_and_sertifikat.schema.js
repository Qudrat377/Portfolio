const { Schema, model } = require("mongoose");

const Pdf_url = new Schema({
    cv_url: {
        type: String,
    },
    sertificat_url: {
        type: String,
    },
},
{
    versionKey: false,
    timestamps: true
}
)

const PdfSchema = model("pdf_url", Pdf_url)

module.exports = PdfSchema