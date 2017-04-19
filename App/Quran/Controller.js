'use strict';

const express = require('express');
const _ = require('lodash');
const Quran = require('./Model');
const router = express.Router();

const listSurat = ["Al-Faatihah", "Al-Baqarah", "Ali-'Imraan", "An-Nisaa'", "Al-Maaidah", "Al-An'aam", "Al-A'raaf", "Al-Anfaal", "At-Taubah", "Yunus", "Hud", "Yusuf", "Ar-Ra'd", "Ibrahim", "Al-Hijr", "An-Nahl", "Al-Israa'", "Al-Kahfi", "Maryam", "Thaahaa", "Al-Anbiyaa'", "Al-Hajj", "Al-Mu'minuun", "An-Nuur", "Al-Furqaan", "Asy-Syu'araa'", "An-Naml", "Al-Qashash", "Al-'Ankabuut", "Ar-Ruum", "Luqman", "As-Sajdah", "Al-Ahzaab", "Saba'", "Faathir", "Yaa Siin", "Ash-Shaffaat", "Shaad", "Az-Zumar", "Ghafir", "Fushshilat", "Asy-Syuura", "Az-Zukhruf", "Ad-Dukhaan", "Al-Jaatsiyah", "Al-Ahqaaf", "Muhammad", "Al-Fath", "Al-Hujuraat", "Qaaf", "Adz-Dzaariyaat", "Ath-Thuur", "An-Najm", "Al-Qamar", "Ar-Rahmaan", "Al-Waaqi'ah", "Al-Hadiid", "Al-Mujaadilah", "Al-Hasyr", "Al-Mumtahanah", "Ash-Shaaf", "Al-Jumu'ah", "Al-Munaafiquun", "At-Taghaabun", "Ath-Thalaaq", "At-Tahriim", "Al-Mulk", "Al-Qalam", "Al-Haaqqah", "Al-Ma'aarij", "Nuh", "Al-Jin", "Al-Muzzammil", "Al-Muddatstsir", "Al-Qiyaamah", "Al-Insaan", "Al-Mursalaat", "An-Nabaa'", "An-Naazi'aat", "'Abasa", "At-Takwiir", "Al-Infithaar", "Al-Muthaffifiin", "Al-Insyiqaaq", "Al-Buruuj", "Ath-Thaariq", "Al-A'laa", "Al-Ghaasyiyah", "Al-Fajr", "Al-Balad", "Asy-Syams", "Al-Lail", "Adh-Dhuhaa", "Al-Insyiraah", "At-Tiin", "Al-'Alaq", "Al-Qadr", "Al-Bayyinah", "Al-Zalzalah", "Al-'Aadiyaat", "Al-Qaari'ah", "At-Takaatsur", "Al-'Ashr", "Al-Humazah", "Al-Fiil", "Quraisy", "Al-Maa'uun", "Al-Kautsar", "Al-Kaafiruun", "An-Nashr", "Al-Lahab", "Al-Ikhlaash", "Al-Falaq", "An-Naas"];
const listAyat = ["7", "286", "200", "176", "120", "165", "206", "75", "129", "109", "123", "111", "43", "52", "99", "128", "111", "110", "98", "135", "112", "78", "118", "64", "77", "227", "93", "88", "69", "60", "34", "30", "73", "54", "45", "83", "182", "88", "75", "85", "54", "53", "89", "59", "37", "35", "38", "29", "18", "45", "60", "49", "62", "55", "78", "96", "29", "22", "24", "13", "14", "11", "11", "18", "12", "12", "30", "52", "52", "44", "28", "28", "20", "56", "40", "31", "50", "40", "46", "42", "29", "19", "36", "25", "22", "17", "19", "26", "30", "20", "15", "21", "11", "8", "8", "19", "5", "8", "8", "11", "11", "8", "3", "9", "5", "4", "7", "3", "6", "3", "5", "4", "5", "6"];

router.get('/:surat/:ayat', (req, res)=>{
	let surat = req.params.surat;
	let ayat = req.params.ayat;
	let params = {
		surat: surat,
		ayat: ayat
	};

	Quran.findOne(params, 'contentArab contentIndo', (err, quran)=>{
		if(err) res.status(500).send(err);
		else if(quran){
			params['contentArab'] = decodeURIComponent(escape(quran.contentArab));
			params['contentIndo'] = quran.contentIndo;
			params['i'] = 'QS ' + listSurat[surat-1] + ': ' + ayat;

			res.json(params);
		} else{
			params['notFound'] = true;
			res.json(params)
		}
	});
});

router.get('/', (req, res)=>{
	let result = [];

	_.forEach(listSurat, (val, i)=>{
		result.push({
			nr: i+1,
			surat: val,
			totalAyat: listAyat[i]
		});
	});

	res.json(result);
});

module.exports = router;