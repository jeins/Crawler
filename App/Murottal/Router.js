'use strict';

const express = require('express');
const _ = require('lodash');
const router = express.Router();
const Murottal = require('./Model');

const listSurat = ["Al-Faatihah", "Al-Baqarah", "Ali-'Imraan", "An-Nisaa'", "Al-Maaidah", "Al-An'aam", "Al-A'raaf", "Al-Anfaal", "At-Taubah", "Yunus", "Hud", "Yusuf", "Ar-Ra'd", "Ibrahim", "Al-Hijr", "An-Nahl", "Al-Israa'", "Al-Kahfi", "Maryam", "Thaahaa", "Al-Anbiyaa'", "Al-Hajj", "Al-Mu'minuun", "An-Nuur", "Al-Furqaan", "Asy-Syu'araa'", "An-Naml", "Al-Qashash", "Al-'Ankabuut", "Ar-Ruum", "Luqman", "As-Sajdah", "Al-Ahzaab", "Saba'", "Faathir", "Yaa Siin", "Ash-Shaffaat", "Shaad", "Az-Zumar", "Ghafir", "Fushshilat", "Asy-Syuura", "Az-Zukhruf", "Ad-Dukhaan", "Al-Jaatsiyah", "Al-Ahqaaf", "Muhammad", "Al-Fath", "Al-Hujuraat", "Qaaf", "Adz-Dzaariyaat", "Ath-Thuur", "An-Najm", "Al-Qamar", "Ar-Rahmaan", "Al-Waaqi'ah", "Al-Hadiid", "Al-Mujaadilah", "Al-Hasyr", "Al-Mumtahanah", "Ash-Shaaf", "Al-Jumu'ah", "Al-Munaafiquun", "At-Taghaabun", "Ath-Thalaaq", "At-Tahriim", "Al-Mulk", "Al-Qalam", "Al-Haaqqah", "Al-Ma'aarij", "Nuh", "Al-Jin", "Al-Muzzammil", "Al-Muddatstsir", "Al-Qiyaamah", "Al-Insaan", "Al-Mursalaat", "An-Nabaa'", "An-Naazi'aat", "'Abasa", "At-Takwiir", "Al-Infithaar", "Al-Muthaffifiin", "Al-Insyiqaaq", "Al-Buruuj", "Ath-Thaariq", "Al-A'laa", "Al-Ghaasyiyah", "Al-Fajr", "Al-Balad", "Asy-Syams", "Al-Lail", "Adh-Dhuhaa", "Al-Insyiraah", "At-Tiin", "Al-'Alaq", "Al-Qadr", "Al-Bayyinah", "Al-Zalzalah", "Al-'Aadiyaat", "Al-Qaari'ah", "At-Takaatsur", "Al-'Ashr", "Al-Humazah", "Al-Fiil", "Quraisy", "Al-Maa'uun", "Al-Kautsar", "Al-Kaafiruun", "An-Nashr", "Al-Lahab", "Al-Ikhlaash", "Al-Falaq", "An-Naas"];

/**
 * @swagger
 * /murottal/:
 *   get:
 *     tags:
 *       - Murottal
 *     description: menampilkan list qari beserta total surat yang tersedia
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: list qari dan total surat
 */
router.get('/', (req, res)=>{
    let q = Murottal.find({riwayat: /Ashim/});
    q.select('name totalSurat');
    q.exec((err, data)=>{
        if(err) res.status(500).send(err);

        res.json({data: data, total: _.size(data)});
    });
});

/**
 * @swagger
 * /murottal/{name}/{surat}:
 *   get:
 *     tags:
 *       - Murottal
 *     description: menampilkan murottal dengan qari dan surat tertentu
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: name
 *         description: nama qari
 *         in: path
 *         required: true
 *         type: string
 *       - name: surat
 *         description: surat AlQuran
 *         in: path
 *         required: true
 *         type: number
 *     responses:
 *       200:
 *         description: hasil
 */
router.get('/:name/:surat', (req, res)=>{
    let name = req.params.name;
    let surat = req.params.surat;

    Murottal.find({name: new RegExp(name, "i"), riwayat: /Ashim/}, (err, data)=>{
        if(err) return res.status(500).send(err);

        if(_.size(data) > 1){
            let name = [];

            _.forEach(data, (d)=>{
                name.push(d.name);
            });

            res.json(
                {
                    success: false,
                    name: name,
                    info: 'nama kurang spesifik'
                });
        } else if(_.size(data) !== 0){
            data = data[0];
            let arrAvailableSurat = data.listSurat.split(',');

            if(_.includes(arrAvailableSurat, surat)){
                res.json({
                    success: true,
                    name: data.name,
                    surat: listSurat[surat-1],
                    url: data.url + '/' + ('000' + surat).substr(-3) + '.mp3'
                });
            } else{
                res.json({
                    success: false,
                    name: data.name,
                    listSurat: data.listSurat,
                    info: 'nr. surat tidak ditemukan'
                });
            }
        } else{
            res.status(404).json({notFound: true, name: name, surat: listSurat[surat-1]});
        }
    });
});

module.exports = router;