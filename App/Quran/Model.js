const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    surat: Number,
    ayat: Number,
    contentArab: String,
    contentIndo: String,
    updatedAt: Date,
    createdAt: Date
}, { timestamps: true });

const Quran = mongoose.model('Quran', schema);

module.exports = Quran;