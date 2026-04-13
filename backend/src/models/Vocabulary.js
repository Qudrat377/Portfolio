const mongoose = require('mongoose');

const vocabularyItemSchema = new mongoose.Schema(
  {
    word: { type: String, required: true, trim: true, maxlength: 100 },
    language: { type: String, enum: ['EN', 'UZ'], required: true },
    translation: { type: String, trim: true, maxlength: 200 },
    autoTranslation: { type: String, trim: true, maxlength: 200 },
    editedTranslation: { type: String, trim: true, maxlength: 200 },
    pronunciation: { type: String, trim: true },
    example: { type: String, trim: true, maxlength: 300 },
    imageUrl: { type: String, trim: true },
  },
  { _id: true }
);

const vocabularySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 500 },
    topic: { type: String, trim: true, maxlength: 100 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [vocabularyItemSchema],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

vocabularySchema.index({ createdBy: 1 });
vocabularySchema.index({ isDeleted: 1 });
vocabularySchema.index({ title: 'text', topic: 'text' });

module.exports = mongoose.model('Vocabulary', vocabularySchema);


// const mongoose = require('mongoose');

// const vocabularyItemSchema = new mongoose.Schema(
//   {
//     word: {
//       type: String,
//       required: true,
//       trim: true,
//       maxlength: 100,
//     },
//     language: {
//       type: String,
//       enum: ['EN', 'UZ'],
//       required: true,
//     },
//     translation: {
//       type: String,
//       trim: true,
//       maxlength: 200,
//     },
//     // Auto-translated from mobile, stored here
//     autoTranslation: {
//       type: String,
//       trim: true,
//       maxlength: 200,
//     },
//     // Teacher can override auto-translation
//     editedTranslation: {
//       type: String,
//       trim: true,
//       maxlength: 200,
//     },
//     pronunciation: {
//       type: String,
//       trim: true,
//     },
//     example: {
//       type: String,
//       trim: true,
//       maxlength: 300,
//     },
//     imageUrl: {
//       type: String,
//       trim: true,
//     },
//   },
//   { _id: true }
// );

// const vocabularySchema = new mongoose.Schema(
//   {
//     title: {
//       type: String,
//       required: true,
//       trim: true,
//       maxlength: 200,
//     },
//     group: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Group',
//       required: true,
//     },
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//     },
//     items: [vocabularyItemSchema],
//     isDeleted: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// vocabularySchema.index({ group: 1 });
// vocabularySchema.index({ createdBy: 1 });

// module.exports = mongoose.model('Vocabulary', vocabularySchema);
