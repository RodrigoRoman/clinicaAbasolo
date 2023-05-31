const express = require('express');
const router = express.Router();
const exits = require('../controllers/exits');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isServAuthor,resetSection,resetAll,
    createBoxForm,
    createBox,
    boxForm,
    index_exits,
    showMoneyBox,
    deleteExit,
    deleteMoneyBox,
    searchAllExits,
    isDinamicDirectAdmin, isDirectAdminOrCaja,validateService, validateSupply, validateHospital,validateExit,validatePayment} = require('../middleware');

const multer = require('multer');


const Exit = require('../models/exit');
const Payment = require('../models/payment');


router.route('/')
    .get(isLoggedIn, isDirectAdminOrCaja,catchAsync(exits.index))
    .post(isLoggedIn, isDirectAdminOrCaja, catchAsync(exits.createPayment))

router.get('/new', isLoggedIn, isDirectAdminOrCaja, exits.renderNewForm)

router.route('/refill')
    .get(exits.refillForm)
    .post(exits.refillFormPDF)
    .put(exits.editDatePoint)

router.route('/refillSearch')
    .get(exits.searchRefillTrans)


router.route('/resetSelection')
    .put(exits.resetSection)

router.route('/resetAll')
    .put(exits.resetAllRefill)

router.route('/:id')
    .delete(isLoggedIn, isLoggedIn, isDinamicDirectAdmin, catchAsync(exits.deleteExit))

router.get('/payments', isLoggedIn,isDinamicDirectAdmin, catchAsync(exits.index_exits))

router.get('/searchAllExits', isLoggedIn,isDinamicDirectAdmin, catchAsync(exits.searchAllExits))


router.route('/hospital_account')
    .get(isLoggedIn,isDinamicDirectAdmin,exits.hospital_account)
    .post(isLoggedIn,isDinamicDirectAdmin,exits.accountReportPDF)



router.route('/box/:id')
    .get(isLoggedIn,isDinamicDirectAdmin,catchAsync(exits.showMoneyBox))

router.route('/boxShow/:id')
    .get(isLoggedIn,isDinamicDirectAdmin,catchAsync(exits.boxShowContent))

router.route('/makeCut/:id')
    .put(isLoggedIn,isDinamicDirectAdmin,catchAsync(exits.makeCut))
    
    
router.route('/box')
    .get(isLoggedIn,isDinamicDirectAdmin,catchAsync(exits.indexMoneyBox))
    .post(isLoggedIn,isDinamicDirectAdmin,catchAsync(exits.createBox))

router.route('/boxRebuild/:id')
    .get(isLoggedIn,isDinamicDirectAdmin,catchAsync(exits.boxShowFiltered))

router.route('/newBox')
    .get(isLoggedIn,isDinamicDirectAdmin,catchAsync(exits.createBoxForm))

router.get('/searchSP', isLoggedIn, isDinamicDirectAdmin, catchAsync(exits.servicesPayments))


router.route('/moneyBox/:id')
    .delete( isLoggedIn, isDinamicDirectAdmin, catchAsync(exits.deleteMoneyBox))

router.route('/generate-pdf-account')
    .post(isLoggedIn, isDinamicDirectAdmin,catchAsync(exits.generate_pdf))

router.route('/removeBoxFrom/:id')
    .put(isLoggedIn, isDinamicDirectAdmin,catchAsync(exits.removeBoxFrom))

module.exports = router;