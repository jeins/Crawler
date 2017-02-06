const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    id: String,
    eanCode: String,
    title: String,
    firstLvCategory: String,
    secondLvCategory: String,
    nutritionInfo: [{}],
    category: String,
    quantity: String,
    ingredient: String,
    seal: String,
    otherInfo: String,
    origin: String,
    producer: String,
    brand: String,
    image: String,
    imageUrl: String,
    imageSrc: String,
    urlSrc: String,
    updatedAt: String,
    createdAt: String,
    crawledAt: Date
});

const Food = mongoose.model('Food', schema);

module.exports = Food;