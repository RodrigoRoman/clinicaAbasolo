const express = require('express');
const router = express.Router();
const services = require('../controllers/services');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isServAuthor,deleteAAA,search_3,generate_pdf,renderGenerateQr,isDinamicDirectAdmin,isDirectAdminOrCaja, validateService, validateSupply, validateHospital,searchSuppliesLimit} = require('../middleware');
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });

const {Service, Supply,Hospital} = require('../models/service');


router.route('/')
    .get(isLoggedIn,isDinamicDirectAdmin,catchAsync(services.index))
    .post(isLoggedIn,isDinamicDirectAdmin, upload.array('image'), validateService, catchAsync(services.createService))

router.get('/searchSupplies/:page?',isLoggedIn,isDinamicDirectAdmin,catchAsync(services.searchAllSupplies))
router.get('/searchServices/:page?',isLoggedIn,isDinamicDirectAdmin,catchAsync(services.searchAllServices))

router.get('/searchSupplyLimit',isLoggedIn,isDinamicDirectAdmin,catchAsync(services.searchSuppliesLimit))



router.route('/supply/:page?')
    .get(isDinamicDirectAdmin,catchAsync(services.index_supplies))
    .post(isLoggedIn,isDinamicDirectAdmin, upload.array('image'), validateSupply, catchAsync(services.createSupply))
  

router.route('/hospital/:page?')
    .get(isDinamicDirectAdmin,catchAsync(services.index_hospital))
    .post(isLoggedIn, isDinamicDirectAdmin,upload.array('image'), validateHospital, catchAsync(services.createHospital))

router.get('/new', isLoggedIn,isDinamicDirectAdmin, services.renderNewForm)

//SHOW ROUTE FOR PRODUCTS
router.route('/supply/:name')
    .get(catchAsync(services.showSupply))

router.route('/generateQr')
    .get(isDinamicDirectAdmin,catchAsync(services.renderGenerateQr))


//SEARCH SERVICES
router.get('/search3',isLoggedIn,catchAsync(services.search_3))


//CALL QR PAGE
router.post('/generate-pdf',catchAsync(services.generate_pdf))



//EDIT ROUTES


router.route('/:id')
    .get(isLoggedIn,isDinamicDirectAdmin,catchAsync(services.showService))
    .delete(isLoggedIn,isDinamicDirectAdmin, catchAsync(services.deleteService))

router.route('/:id/supply/addToSupply').put(catchAsync(services.addToSupply))

router.route('/:id/supply')
    .get(isLoggedIn,isDinamicDirectAdmin, upload.array('image'), catchAsync(services.renderNewFrom))
    .put(isLoggedIn,isDirectAdminOrCaja, upload.array('image'), validateSupply, catchAsync(services.updateService))

router.route('/:id/hospital')
    .put(isLoggedIn,isDirectAdminOrCaja, upload.array('image'), validateHospital, catchAsync(services.updateService))


router.get('/:id/edit',isLoggedIn,isDirectAdminOrCaja, catchAsync(services.renderEditForm))

router.route('/generate-pdf-exists')
    .post(isLoggedIn, isDinamicDirectAdmin,catchAsync(services.generate_pdf_exists))

module.exports = router;