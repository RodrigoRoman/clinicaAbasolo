const {Service,Supply,Hospital} = require('../models/service');
const { cloudinary } = require("../cloudinary");
const Transaction = require('../models/transaction');
const { listenerCount } = require('../models/exit');
const puppeteer = require('puppeteer'); 

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole match string
  }

  function getMexicoCityTime() {
    const now = new Date();
    const mexicoCityOffset = -6 * 60; // Mexico City is UTC-6
    const mexicoCityTime = new Date(now.getTime() + mexicoCityOffset * 60 * 1000);
    return mexicoCityTime;
  }


module.exports.index = async (req, res) => {
    const services = await Service.find({});
    res.render('services/index',{services})
}

module.exports.renderGenerateQr = async(req,res)=>{
    res.render('services/generateQr')
}

module.exports.index_supplies = async (req, res) => {
    // classify by name (case and symbol insensitive, up to a space)
    const resPerPage = 100;
    const page = parseInt(req.params.page) || 1;
    let {search,sorted} = req.query;
    console.log(search)
    if(!search){search = ''}
    search = new RegExp(escapeRegExp(search), 'gi');
    let dbQueries =  [
            { name: search },
            { class: search },
            { description: search },
            { principle: search },
            { doctor: search}
        ];  
    
    
    let supplies = await Supply.find({$or:dbQueries,deleted:false}).populate("author")
        // .skip((resPerPage * page) - resPerPage)
        .limit(resPerPage);
    let numOfProducts = await Supply.find({$or:dbQueries,deleted:false});
    numOfProducts = numOfProducts.length;
    res.render('services/index_supplies', {supplies,"page":page, pages: Math.ceil(numOfProducts / resPerPage),
    numOfResults: numOfProducts,search:req.query.search,sorted:sorted})
}

module.exports.index_hospital = async (req, res) => {
    const resPerPage = 40;
    const page = parseInt(req.params.page) || 1;
    let {search,sorted} = req.query;
    console.log('value of page is');
    console.log(page);
    if(!search){search = ''}
    search = new RegExp(escapeRegExp(search), 'gi');
    let dbQueries =  [
            { name: search },
            { class: search },
            { doctor: search },
        ];  
    
    let services = await Hospital.find({$or:dbQueries,deleted:false})
        // .skip((resPerPage * page))
        .limit(resPerPage);
    let numOfServices = await Hospital.find({$or:dbQueries,deleted:false});
    numOfServices = numOfServices.length;
    res.render('services/index_hospital', {services,"page":page, pages: Math.ceil(numOfServices / resPerPage),
    numOfResults: numOfServices,search:req.query.search,sorted:sorted})
    //------
    // const services = await Hospital.find({deleted:false}).sort({ class: 'asc'});
    // res.render('services/index_hospital', { services })
}

module.exports.renderNewForm = (req, res) => {
    const {service_type} = req.query
    res.render(`services/new_${service_type}`);
}

module.exports.renderNewFrom = async (req, res) => {
    const { id } = req.params;
    const service = await Service.findById(id);
    if (!service) {
        req.flash('error', 'Error al buscar servicio!');
        return res.redirect('/services');
    }
    res.render(`services/supply_from`,{service});
}

// function randomDate(start, end) {
//     return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
// }

module.exports.createSupply = async (req, res, next) => {
    let name = req.body.service.name;
    name = new RegExp(escapeRegExp(name), 'gi')
    let nameShared = await Supply.find({name:name});
    for (const el of nameShared) {
        el.buy_price = req.body.service.buy_price;
        el.sell_price = req.body.service.sell_price;
        el.optimum = req.body.service.optimum;
        el.outside = req.body.service.outside;
        await el.save();
    }
    const supply = new Supply(req.body.service);
    supply.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    supply.author = req.user._id;
    await supply.save();
    req.flash('success', 'Insumo médico creado!');
    res.redirect(`/services`)///services/${service._id} direction
}

// module.exports.addToSupply = async (req, res) => {
//     console.log('add to supply');
//     const { id } = req.params;
//     const found = await Service.findById({_id:id});
//     console.log('found supply to be updated')
//     console.log(found)
//     console.log('stock body')
//     console.log(req.body.addToSupply)
//     let service;
//     try{
//         const supply = await Supply.findById(id);
//         const updatedStock = supply.stock + parseInt(req.body.addToSupply);
//         console.log('update stock');
//         console.log(updatedStock)
//         service = await Supply.findByIdAndUpdate(id, { stock: updatedStock });
//         await service.save();
//         // res.status(200).json({ success: true, msg: 'True', serviceName:found.name});
//         console.log('the url')
//         console.log(req.params)
//         let queryString = Object.keys(req.params)
//             .map(key => key + '=' + req.params[key])
//             .join('&');
//         res.redirect(`/services/supply?${queryString}`);
//     }catch (error) {
//         console.log(error)
//         // res.status(500).json({ success: false, msg: 'False', serviceName:found.name});
//         // res.redirect(req.originalUrl);

//     }
// }



module.exports.addToSupply = async (req, res) => {
    console.log('called search supply with body');
    console.log(req.body);
    console.log('called search supply with query');
    console.log(req.query);
    console.log('search sorted')
    const { id } = req.params;
    try{
    const supply = await Supply.findById(id);
    const updatedStock = supply.stock + parseInt(req.body.addToSupply);
    console.log('update stock');
    console.log(updatedStock)
    service = await Supply.findByIdAndUpdate(id, { stock: updatedStock });
    await service.save();
    console.log('search')
    search = req.body.search;
    sorted = req.body.sorted;
    search = new RegExp(escapeRegExp(search), 'gi');
    const page = parseInt(req.query.page) || 1;
    const resPerPage = 40;
    console.log('1')
    let dbQueries =  [
            { name: search },
            { class: search },
            { description: search },
            { principle: search },
            { doctor: search}
        ]; 
        //other cases for the select element (other sorting options)
        let supplies = [];
        const numOfProducts = await Supply.countDocuments({ $or: dbQueries, deleted: false });
        console.log('2')

        if(sorted == "name" ||sorted == "name"){
        //sort in alphabetical order
         supplies = await Supply.find({ $or: dbQueries, deleted: false })
        .sort(sorted === "name" ? { name: 1 } : {})
        .skip(resPerPage * (page - 1))
        .limit(resPerPage);
        console.log('3')

            // supplies = supplies.sort((a,b)=>a.name.localeCompare(b.name,"es",{sensitivity:'base'})).slice(((resPerPage * page) - resPerPage),((resPerPage * page) - resPerPage)+resPerPage);
        };

        if(sorted == "stock"){
            supplies = await Supply.find({ $or: dbQueries, deleted: false })
        .sort(sorted === "stock" ? { stock: 1 } : {})
        .skip(resPerPage * (page - 1))
        .limit(resPerPage);
        };
        if(sorted == "class"){
            supplies = await Supply.find({ $or: dbQueries, deleted: false })
        .sort(sorted === "class" ? { class: 1 } : {})
        .skip(resPerPage * (page - 1))
        .limit(resPerPage);
        };
        if(sorted == "expiration"){
            //sort in increasing order based on the expiration of the product 
            supplies = await Supply.find({ $or: dbQueries, deleted: false })
            .sort(sorted === "expiration" ? { expiration: 1 } : {})
            .skip(resPerPage * (page - 1))
            .limit(resPerPage);
        };
        if (!supplies) {
            res.locals.error = 'Ningun producto corresponde a la busqueda';
            res.json({})
        }
        console.log('END')

        return res.json({"supplies":supplies,"search":req.body.search,"page":page,"sorted":sorted,"pages": Math.ceil(numOfProducts / resPerPage),"numOfResults": numOfProducts});

    }catch(err){
        console.log('error!!')
        console.log(err)
    }
        //return supplies and the sorted argument for reincluding it
  return res.json({"supplies":supplies,"search":req.body.search,"page":page,"sorted":sorted,"pages": Math.ceil(numOfProducts / resPerPage),"numOfResults": numOfProducts});
    
}


module.exports.createHospital = async (req, res, next) => {
    const service = new Hospital(req.body.service);
    service.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    service.author = req.user._id;
    await service.save();
    req.flash('success', 'Servicio hospitalario creado!');
    res.redirect(`/services`)
}

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const service = await Service.findById(id);
    if (!service) {
        req.flash('error', 'Error al buscar servicio!');
        return res.redirect('/services');
    }
    res.render(`services/${service.service_type}_edit`, { service });
}

module.exports.updateService = async (req, res) => {
    const { id } = req.params;
    const found = await Service.findById({_id:id});
    console.log('the barcode');
    console.log(req.body)
    if(found.service_type==="supply"){
        service = await Supply.findByIdAndUpdate(id,{
            ...req.body.service,
        });
        await service.save();
        service.barcode =  req.body.service.barcode;
    }else{
        service = await Hospital.findByIdAndUpdate(id,{ ...req.body.service});
    }
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    service.images.push(...imgs);
    await service.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await service.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }
    req.flash('success', 'Insumo actualizado!');
    res.redirect(`/services/${service.service_type}`)
}

module.exports.deleteService = async (req, res) => {
    const { id } = req.params;
    const nDate = getMexicoCityTime();
    let service = await Service.findById(id);
    service.deleted = true;
    service.save()
    req.flash('success', 'Servicio eliminado')
    res.redirect('/services');
}

module.exports.deleteAAA = async (req, res) => {
    console.log('inside here!!')
    try {
      // find the Service to delete
      const serviceToDelete = await Service.findOne({ name: 'AAAAAAAA' });
      console.log('found!!')
      console.log(serviceToDelete)
  
      // delete the Service
      await Service.deleteOne({ _id: serviceToDelete._id });
  
      // redirect to the services page
      res.redirect('/services');
    } catch (error) {
      // handle errors
      console.error(error);
      res.status(500).send('Error deleting Service');
    }
};
  
  
  
  
  
//Search bar route functions

//return all elements that match search
module.exports.searchAllSupplies = async (req, res) => {
    console.log('called search supply with body');
    // let {search,sorted} = req.query;
    search = req.query.search;
    sorted = req.query.sorted;

    search = new RegExp(escapeRegExp(search), 'gi');
    const page = parseInt(req.query.page) || 1;
    const resPerPage = 100;
    let dbQueries =  [
            { name: search },
            { class: search },
            { description: search },
            { principle: search },
            { doctor: search}
        ]; 
        //other cases for the select element (other sorting options)
        let supplies = [];
        const numOfProducts = await Supply.countDocuments({ $or: dbQueries, deleted: false });
        if(sorted == "name" ||sorted == "name"){
        //sort in alphabetical order
         supplies = await Supply.find({ $or: dbQueries, deleted: false })
        .sort(sorted === "name" ? { name: 1 } : {})
        .skip(resPerPage * (page - 1))
        .limit(resPerPage);
            // supplies = supplies.sort((a,b)=>a.name.localeCompare(b.name,"es",{sensitivity:'base'})).slice(((resPerPage * page) - resPerPage),((resPerPage * page) - resPerPage)+resPerPage);
        };
        if(sorted == "stock"){
            supplies = await Supply.find({ $or: dbQueries, deleted: false })
        .sort(sorted === "stock" ? { stock: 1 } : {})
        .skip(resPerPage * (page - 1))
        .limit(resPerPage);
        };
        if(sorted == "class"){
            supplies = await Supply.find({ $or: dbQueries, deleted: false })
        .sort(sorted === "class" ? { class: 1 } : {})
        .skip(resPerPage * (page - 1))
        .limit(resPerPage);
        };
        if(sorted == "expiration"){
            //sort in increasing order based on the expiration of the product 
            supplies = await Supply.find({ $or: dbQueries, deleted: false })
            .sort(sorted === "expiration" ? { expiration: 1 } : {})
            .skip(resPerPage * (page - 1))
            .limit(resPerPage);
        };
        if (!supplies) {
            res.locals.error = 'Ningun producto corresponde a la busqueda';
            res.json({})
        }
        //return supplies and the sorted argument for reincluding it
        return res.json({"supplies":supplies,"search":req.query.search,"page":page,"sorted":sorted,"pages": Math.ceil(numOfProducts / resPerPage),"numOfResults": numOfProducts});
    
}


//for printing existence report
module.exports.searchSuppliesLimit = async (req, res) => {
    console.log('called search supply with body');
    // let {search,sorted} = req.query;
    console.log(req.query)
    search = req.query.search;
    sorted = req.query.sorted;
    limit = parseInt(req.query.limit);

    search = new RegExp(escapeRegExp(search), 'gi');

    let dbQueries =  [
            { name: search },
            { class: search },
            { description: search },
            { principle: search },
            { doctor: search}
        ]; 
        //other cases for the select element (other sorting options)
        let supplies = [];
        const numOfProducts = await Supply.countDocuments({ $or: dbQueries, deleted: false });
        if(sorted == "name" ||sorted == "name"){
        //sort in alphabetical order
            supplies = await Supply.find({ $or: dbQueries, deleted: false })
            .sort(sorted === "name" ? { name: 1 } : {})
            .limit(limit);
            // supplies = supplies.sort((a,b)=>a.name.localeCompare(b.name,"es",{sensitivity:'base'})).slice(((resPerPage * page) - resPerPage),((resPerPage * page) - resPerPage)+resPerPage);
        };
        if(sorted == "stock"){
            supplies = await Supply.find({ $or: dbQueries, deleted: false })
        .sort(sorted === "stock" ? { stock: 1 } : {})
        .limit(limit);
        };
        if(sorted == "class"){
            supplies = await Supply.find({ $or: dbQueries, deleted: false })
        .sort(sorted === "class" ? { class: 1 } : {})
        .limit(limit);
        };
        if(sorted == "expiration"){
            //sort in increasing order based on the expiration of the product 
            supplies = await Supply.find({ $or: dbQueries, deleted: false })
            .sort(sorted === "expiration" ? { expiration: 1 } : {})
            .limit(limit);
        };
        if (!supplies) {
            res.locals.error = 'Ningun producto corresponde a la busqueda';
            res.json({})
        }
        //return supplies and the sorted argument for reincluding it
        return res.json({"supplies":supplies});
}



module.exports.searchAllServices = async (req, res) => {
    console.log('called search supply with body');
    console.log(req.body);
    console.log('called search supply with query');
    console.log(req.query)
    // let {search,sorted} = req.query;
    search = req.query.search;
    sorted = req.query.sorted;
   
    const page = parseInt(req.query.page) || 1;
    const resPerPage = 40;
    search = new RegExp(escapeRegExp(search), 'gi');
    let dbQueries =  [
        { name: search},
        { class: search},
        { doctor: search}
        ];
    let services = await Hospital.find({$or:dbQueries,deleted:false});
    let nServices = services.length;
    console.log('sorted!!!  ');
    console.log(sorted);
    if(sorted == "name" || sorted == "Ordenar por:"){
        //sort in alphabetical order
        services = services.sort((a,b)=>a.name.localeCompare(b.name,"es",{sensitivity:'base'})).slice(((resPerPage * page) - resPerPage),((resPerPage * page) - resPerPage)+resPerPage);
    };
    if(sorted == "class"){
        //sort in alphabetical order
        services = services.sort((a,b)=>a.class.localeCompare(b.name,"es",{sensitivity:'base'})).slice(((resPerPage * page) - resPerPage),((resPerPage * page) - resPerPage)+resPerPage);

    };
    if(sorted == "doctor"){
        //sort in alphabetical order
        services = services.sort((a,b)=>a.doctor.localeCompare(b.name,"es",{sensitivity:'base'})).slice(((resPerPage * page) - resPerPage),((resPerPage * page) - resPerPage)+resPerPage);
    };
    if (!services) {
        res.locals.error = 'Ningun servicio corresponde a la busqueda';
        res.json({})
    }
    return res.json({"services":services,"search":req.query.search,"page":page,"sorted":sorted,"pages": Math.ceil(nServices / resPerPage),"numOfResults": nServices});

}




module.exports.search_3 = async (req, res) => {
    let {search} = req.query;
    search = new RegExp(escapeRegExp(search), 'gi');
    const dbQueries =  [
        { name: search },
        { class: search },
        { principle: search },
        { description: search },
        { doctor: search}
    ];
    
    let supplies = await Service.find({$or:dbQueries,deleted:false}).limit(3);
    if (!supplies) {
        res.locals.error = 'No results match that query.';
    }
    res.json(supplies);
}



module.exports.generate_pdf_exists = async (req, res) => {
    console.log('about to restock')
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], ignoreDefaultArgs: ['--disable-extensions']});
    const page = await browser.newPage();

    // Get the content from the request body
    const content = req.body.content;

    console.log('the content');
    console.log(content);

    //Set content
    await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
    <style>
    #suppliesContent * {
        page-break-inside: avoid !important ;
    }
    .card {
        page-break-inside: avoid !important;
    }

    /* Prevent page breaks within the carousel */
    .carousel {
        page-break-inside: avoid !important;
    }

    /* Prevent page breaks within the carousel controls */
    .carousel-control-prev,
    .carousel-control-next {
        page-break-inside: avoid !important;
    }

    /* Prevent page breaks within the list group */
    .list-group {
        page-break-inside: avoid !important;
    }

    /* Prevent page breaks within the split items */
    .split-items {
        page-break-inside: avoid;
    }
    </style>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clinica Abasolo</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/5.0.0-alpha1/css/bootstrap.min.css"
        integrity="sha384-r4NyP46KrjDleawBgD5tp8Y7UzmLA05oM1iAEQ17CSuDqnUK2+k9luXQOfXJCJ4I" crossorigin="anonymous">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" integrity="sha512-iBBXm8fW90+nuLcSKlbmrPcLa0OT92xO1BIsZ+ywDWZCvqsWgccV3gFoRBv0z+8dLJgyAHIhR35VZc2oM/gI1w==" crossorigin="anonymous" />    
 </head>
    <body>
    <div class = 'd-flex justify-content-center align-items-center mb-4 mt-4'>
        <div class="pop-up-container ">
            <h5 class="display-3 font-weight-bold text-center" style="font-family: Helvetica, Arial, sans-serif; color: #4A4A4A; text-transform: uppercase; letter-spacing: 2px;  font-size: 40px">Stock ${getMexicoCityTime().toLocaleDateString()} </h5> </div>
        </div>
    </div>

    <div class="row" id="suppliesContent" >
        ${content}
        </div>
    </body>
    </html>
    `);
 

    const pdf = await page.pdf({ format: 'A4' });

    await browser.close();

    res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdf.length });
    res.send(pdf);
};

// //search for hospital services
// module.exports.searchAllServices = async (req, res) => {
//     let {search,sorted} = req.query;
//     const page = parseInt(req.query.page) || 1;
//     const resPerPage = 1;
//     search = new RegExp(escapeRegExp(search), 'gi');
//     let dbQueries =  [
//         { name: search },
//         { class: search },
//         { doctor: search}
//         ];
//     // let nServices = await Hospital.find({$or:dbQueries,deleted:false});
    
//     console.log('sorted!!!  ');
//     console.log(sorted);
//     let services = await Hospital.find({$or:dbQueries,deleted:false});
//     let nServices = services.length; 
//     console.log('after call');
//     console.log(services.length);

//     if(sorted == "name" || sorted == "Ordenar por:"){
//         services = services.sort((a,b)=>a.name.localeCompare(b.name,"es",{sensitivity:'base'})).slice(((resPerPage * page-1) - resPerPage),((resPerPage * page-1) - resPerPage)+resPerPage);
//         console.log('after call 2');
//         console.log(services.length);
//     };
//     if(sorted == "class"){
//         //sort in alphabetical order
//         services = services.sort((a,b)=>a.class.localeCompare(b.class,"es",{sensitivity:'base'})).slice(((resPerPage * page-1) - resPerPage),((resPerPage * page-1) - resPerPage)+resPerPage);

//     };
//     if(sorted == "doctor"){
//         //sort in alphabetical order
//         services = services.sort((a,b)=>a.doctor.localeCompare(b.doctor,"es",{sensitivity:'base'})).slice(((resPerPage * page-1) - resPerPage),((resPerPage * page-1) - resPerPage)+resPerPage);
//     };
//     if (!services) {
//         res.locals.error = 'Ningun servicio corresponde a la busqueda';
//         res.json({})
//     }
//     console.log('the services');
//     console.log(services);
//     console.log('The pages');
//     console.log(Math.ceil(nServices / resPerPage));
//     return res.json({"services":services,"search":req.query.search,"page":page,"sorted":sorted,"pages": Math.ceil(nServices / resPerPage),"numOfResults": nServices});

// }



