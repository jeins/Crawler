const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    name: String,
    url: String,
    riwayat: String,
    totalSurat: Number,
    listSurat: String
}, {timestamps: true});

const Murottal = mongoose.model('Murottal', schema);

module.exports = Murottal;