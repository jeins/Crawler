const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    perawi: String,
    nrHadits: Number,
    contentArab: String,
    contentIndo: String,
    updatedAt: Date,
    createdAt: Date
}, {timestamps: true});

const Hadits = mongoose.model('Hadits', schema);

module.exports = Hadits;