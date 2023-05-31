const {Service,Supply,Hospital} = require('../models/service');
const Transaction = require('../models/transaction');
const Exit = require('../models/exit');
const MoneyBox = require('../models/money_parts');
const Point = require('../models/refillPoint');
const Payment = require('../models/payment');
const { date } = require('joi');
const puppeteer = require('puppeteer'); 
const mongoose = require('mongoose');


  
function getMexicoCityTime() {
    const now = new Date();
    const mexicoCityOffset = -6 * 60; // Mexico City is UTC-6
    const mexicoCityTime = new Date(now.getTime() + mexicoCityOffset * 60 * 1000);
    return mexicoCityTime;
  }
  

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }


//functions for calculating array of dates in range by leap of # days
Date.prototype.addDays = function(days) {
    let dat = new Date(this.valueOf())
    dat.setDate(dat.getDate() + days);
    return dat;
}

//Calculate Dates based on start, end Date and the amount of desired dates
function getDates(startDate, stopDate,terms) {
    let dateArray = [];
    let currentDate = startDate;
    startDate = new Date(startDate);
    stopDate = new Date(stopDate+"T23:59:01.000Z");
    //first payment starts after 5 days
    startDate = startDate.addDays(5);
    
    //If there is a single payment then we want the end date to be precisely the payment date
    if(terms == 1){
        return [stopDate];
    }
    currentDate  = startDate;
    // To calculate the time difference of two dates 
    const Difference_In_Time = stopDate.getTime() - startDate.getTime(); 
  
    // To calculate the no. of days between two dates 
    const Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24); 
    const leap = Math.ceil(Difference_In_Days/terms);
    while (currentDate <= stopDate) {
        dateArray.push(currentDate)
        currentDate = currentDate.addDays(leap);
    }
    return dateArray;
 }


//Exits are handled as payments (arrays of exits) for more flexibility while editing
module.exports.index = async (req, res) => {
    const payments = await Payment.find({});
    res.render('exits/index',{payments})
}

module.exports.hospital_account = async (req, res) => {
    const nDate = getMexicoCityTime()
    let default_begin = getMexicoCityTime();
    default_begin.setDate( default_begin.getDate() - 6 );
    let begin = req.query.begin || default_begin;
    let end =req.query.end || nDate;
    let sorted =  req.query.sorted || 'name';
    let hospital = (req.query.entry == "honorarios")?"false":"true";
    let honorary = "true";
    let transactions = {};
    begin = new Date(begin);
    end = new Date(end);
    const exits = await Exit.aggregate( 
        //recreate supply element by compressing elements with same name. Now the fields are arrays
        [   
            //first we need to have access to the service fields. So we unwind all of them
            {$match: {clearDate:{$gte:begin,$lte:end}}},
            {$group: {
                //match the begining of the name field
                _id:"$name",
                name:{$last:"$name"},
                dueDate:{$last:"$clearDate"},
                price:{$last:"$moneyAmount"},
                moneyAmount:{$push:"$moneyAmount"},
            }},
            {$addFields:{totalAmount : { $size: "$moneyAmount" }}},
            {$addFields:{totalCost : { $trunc: [ { $sum: "$moneyAmount" },3]}}},
         ]
          //specify language-specific rules for string comparison
    ).collation({locale:"en", strength: 1});

    if((sorted == "name") || (sorted == "Ordenar por:")){
        //sort in alphabetical order
        transactions = await Transaction.aggregate( 
            //recreate supply element by compressing elements with same name. Now the fields are arrays
            [   
                // put in a single document both transaction and service fields
                {$match: {consumtionDate:{$gte:begin,$lte:end}}},
                {$match: {discharged_data:{$exists: true, $ne: null }}},
                {
                    $lookup: {
                        from: "disches",
                        localField: "discharged_data",    // field in the Trasaction collection
                        foreignField: "_id",  // field in the disch collection
                        as: "fromDischarged"
                        }
                 },
                 {
                    $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$fromDischarged", 0 ] }, "$$ROOT" ] } }
                 },
                 { $project: { fromDischarged: 0 } },
                 {$match: {hospitalEntry:{$in:[hospital,honorary]}}},
                 {$group: {
                    _id:"$name",
                    name:{$last:"$name"},
                    class:{$last:"$class"},
                    // consumtionDate: {$last:"$consumtionDate"},
                    service_type:{$last:"$service_type"},
                    price: {$last:"$unitPrice"},
                    sell_price: {$last:"$unitPrice"},
                    buy_price: { $last:"$buyPrice"},
                    amount: { $sum:"$amount"}}},
                {$addFields:{totalBuy : { $multiply: ["$buy_price","$amount"] }}},
                {$addFields:{totalSell : { $multiply: ["$price","$amount"] }}},
                {$addFields:{totalPrice : { $multiply: ["$price","$amount"] }}},
                 
            ]);
            transactions.sort((a,b)=>a.class.localeCompare(b.class,"es",{sensitivity:'base'}))
    };
    if(sorted == "class"){
        //Case for storing based on stock need

        transactions = await Transaction.aggregate( 
            //recreate supply element by compressing elements with same name. Now the fields are arrays
            [   
                // put in a single document both transaction and service fields
                
                {$match: {consumtionDate:{$gte:begin,$lte:end}}},
                {$match: {discharged_data:{$exists: true, $ne: null }}},                {
                    $lookup: {
                        from: "disches",
                        localField: "discharged_data",    // field in the Trasaction collection
                        foreignField: "_id",  // field in the disch collection
                        as: "fromDischarged"
                        }
                 },
                 {
                    $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$fromDischarged", 0 ] }, "$$ROOT" ] } }
                 },
                 { $project: { fromDischarged: 0 ,service:0} },
                {$match: {processDate:{$gte:begin,$lte:end},hospitalEntry:{$in:[hospital,honorary]}}},
                {$group: {
                    _id:"$class",
                    class:{$last:"$class"},
                    service_type : {$last:"$service_type"},
                    price: {$push:{$multiply: [ "$unitPrice","$amount"] }},
                    cost: {$push:0},
                    sell_price: { $push:{$multiply: [ "$unitPrice" ,"$amount"]}},
                    buy_price: { $push: {$multiply: [ "$buyPrice" ,"$amount"]}},
                    amount: { $sum:"$amount"}}},
                {$addFields:{totalSell : { $sum: "$sell_price" }}},
                {$addFields:{totalBuy : { $sum: "$buy_price" }}},
                {$addFields:{totalPrice : { $sum: "$price" }}},
                {$addFields:{totalCost : { $sum: "$cost" }}},
            ]).collation({locale:"en", strength: 1});
        //return supplies and the sorted argument for reincluding it
        transactions.sort((a,b)=>a.class.localeCompare(b.class,"es",{sensitivity:'base'}))

    }
    if(sorted == "patient"){
        //sort in alphabetical order
        transactions = await Transaction.aggregate( 
            //recreate supply element by compressing elements with same name. Now the fields are arrays
            [   
                {$match: {consumtionDate:{$gte:begin,$lte:end}}},
                {$match: {discharged_data:{$exists: true, $ne: null }}},                {
                    $lookup: {
                        from: "disches",
                        localField: "discharged_data",    // field in the Trasaction collection
                        foreignField: "_id",  // field in the disch collection
                        as: "fromDischarged"
                        }
                 },
                 {
                    $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$fromDischarged", 0 ] }, "$$ROOT" ] } }
                 },
                 { $project: { fromDischarged: 0,name:0 } },
                 {$match: {processDate:{$gte:begin,$lte:end},hospitalEntry:{$in:[hospital,honorary]}}},
                 // put in a single document both transaction and service fields
                //  {$unwind:"$patient"},
                {
                    $lookup: {
                       from: "patients",
                       localField: "patient",    // field in the Trasaction collection
                       foreignField: "_id",  // field in the Service collection
                       as: "fromPatient"
                    }
                 },
                 {$unwind:"$patient"},

                 {
                    $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$fromPatient", 0 ] }, "$$ROOT" ] } }
                 },
                 { $project: { fromPatient: 0 } },
                 {$group: {
                    _id:"$name",
                    patientId:{$last:"$patient"},
                    name:{$last:"$name"},
                    admissionDate: {$last:"$admissionDate"},
                    price: {$push:{$multiply: [ "$unitPrice","$amount"] }},
                    cost: {$push:0},
                    sell_price: { $push:{$multiply: [ "$unitPrice" ,"$amount"]}},
                    buy_price: { $push: {$multiply: [ "$buyPrice" ,"$amount"]}},
                    amount: { $sum:"$amount"}}},
                {$addFields:{totalSell : { $sum: "$sell_price" }}},
                {$addFields:{totalBuy : { $sum: "$buy_price" }}},
                {$addFields:{totalPrice : { $sum: "$price" }}},
                {$addFields:{totalCost : { $sum: "$cost" }}},
            ]).collation({locale:"en", strength: 1});
        //return supplies and the sorted argument for reincluding it
        transactions.sort((a,b)=>a.name.localeCompare(b.name,"es",{sensitivity:'base'}))
        return res.render('exits/patient_report',{transactions,exits})

    };
    // transactions = await Transaction.find({consumtionDate:{$gte:begin,$lte:end},service:{hospitalEntry:$or[honorary,hospital]}}).populate('service')
    res.render('exits/hospital_account',{transactions,exits})
}

//get services and payments based on specified queries
module.exports.servicesPayments = async (req, res) => {
    let {entry,exit,hospital,honorary,sorted,begin,end} = req.query;
    entry = (entry == "entry")?true:false;
    exit = (exit == "exit")?true:false;
    // hospitalEntry == true then we just get entries to the hospital
    hospital = (hospital == "hospital")?"true":"false";
    honorary = (honorary == "honorary")?"false":"true";
    begin = new Date(begin+"T00:00:01.000Z");
    end = new Date(end+"T23:59:01.000Z");
    let transactions = {};
    let exits = {};
    if(exit){
        exits = await Exit.aggregate( 
            //recreate supply element by compressing elements with same name. Now the fields are arrays
            [   
                {$match: {clearDate:{$gte:begin,$lte:end}}},
                {$group: {
                    //match the begining of the name field
                    _id:"$name",
                    name:{$last:"$name"},
                    dueDate:{$last:"$clearDate"},
                    price:{$last:"$moneyAmount"},
                    moneyAmount:{$push:"$moneyAmount"},
                }},
                {$addFields:{totalAmount : { $size: "$moneyAmount" }}},
                {$addFields:{totalCost : { $trunc: [ { $sum: "$moneyAmount" },3]}}},
             ]
              //specify language-specific rules for string comparison
        ).collation({locale:"en", strength: 1});
    }
    if(entry){
    if((sorted == "name") || (sorted == "Ordenar por:")){
        //sort in alphabetical order
        transactions = await Transaction.aggregate( 
            //recreate supply element by compressing elements with same name. Now the fields are arrays
            [   
                // put in a single document both transaction and service fields
                {$match: {consumtionDate:{$gte:begin,$lte:end}}},
                {$match: {discharged_data:{$exists: true, $ne: null }}},
                {
                    $lookup: {
                        from: "disches",
                        localField: "discharged_data",    // field in the Trasaction collection
                        foreignField: "_id",  // field in the disch collection
                        as: "fromDischarged"
                        }
                 },
                 {
                    $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$fromDischarged", 0 ] }, "$$ROOT" ] } }
                 },
                 { $project: { fromDischarged: 0 } },
                {$match: {processDate:{$gte:begin,$lte:end},hospitalEntry:{$in:[hospital,honorary]}}},
                {$group: {
                    _id:"$name",
                    name:{$last:"$name"},
                    class:{$last:"$class"},
                    consumtionDate: {$last:"$processDate"},
                    service_type:{$last:"$service_type"},
                    price: { $last:"$unitPrice"},
                    sell_price: { $last:"$unitPrice"},
                    buy_price: { $last:"$buyPrice"},
                    amount: { $sum:"$amount"}}},
                {$addFields:{totalSell : { $multiply: ["$sell_price","$amount"] }}},
                {$addFields:{totalBuy : { $multiply: ["$buy_price","$amount"] }}},
                {$addFields:{totalPrice : { $multiply: ["$price","$amount"] }}},
            ]).collation({locale:"en", strength: 1});
        // transactions = await Transaction.find({consumtionDate:{$gte:begin,$lte:end},service:{hospitalEntry:$or[honorary,hospital]}}).populate('service')
        transactions.sort((a,b)=>a.name.localeCompare(b.name,"es",{sensitivity:'base'}))
        
    };
    if(sorted == "class"){
        //Case for storing based on stock need

        transactions = await Transaction.aggregate( 
            //recreate supply element by compressing elements with same name. Now the fields are arrays
            [   
                // put in a single document both transaction and service fields
                {$match: {consumtionDate:{$gte:begin,$lte:end}}},
                {$match: {discharged_data:{$exists: true, $ne: null }}},                {
                    $lookup: {
                        from: "disches",
                        localField: "discharged_data",    // field in the Trasaction collection
                        foreignField: "_id",  // field in the disch collection
                        as: "fromDischarged"
                        }
                 },
                 {
                    $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$fromDischarged", 0 ] }, "$$ROOT" ] } }
                 },
                 { $project: { fromDischarged: 0 ,service:0} },
                {$match: {processDate:{$gte:begin,$lte:end},hospitalEntry:{$in:[hospital,honorary]}}},
                {$group: {
                    _id:"$class",
                    class:{$last:"$class"},
                    service_type : {$last:"$service_type"},
                    price: {$push:{$multiply: [ "$unitPrice","$amount"] }},
                    cost: {$push:0},
                    sell_price: { $push:{$multiply: [ "$unitPrice" ,"$amount"]}},
                    buy_price: { $push: {$multiply: [ "$buyPrice" ,"$amount"]}},
                    amount: { $sum:"$amount"}}},
                {$addFields:{totalSell : { $sum: "$sell_price" }}},
                {$addFields:{totalBuy : { $sum: "$buy_price" }}},
                {$addFields:{totalPrice : { $sum: "$price" }}},
                {$addFields:{totalCost : { $sum: "$cost" }}},
            ]).collation({locale:"en", strength: 1});
        //return supplies and the sorted argument for reincluding it
        transactions.sort((a,b)=>a.class.localeCompare(b.class,"es",{sensitivity:'base'}))

    }
    if(sorted == "patient"){
        //sort in alphabetical order
        transactions = await Transaction.aggregate( 
            //recreate supply element by compressing elements with same name. Now the fields are arrays
            [   
                {$match: {consumtionDate:{$gte:begin,$lte:end}}},
                {$match: {discharged_data:{$exists: true, $ne: null }}},                {
                    $lookup: {
                        from: "disches",
                        localField: "discharged_data",    // field in the Trasaction collection
                        foreignField: "_id",  // field in the disch collection
                        as: "fromDischarged"
                        }
                 },
                 {
                    $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$fromDischarged", 0 ] }, "$$ROOT" ] } }
                 },
                 { $project: { fromDischarged: 0,name:0 } },
                 {$match: {processDate:{$gte:begin,$lte:end},hospitalEntry:{$in:[hospital,honorary]}}},
                 // put in a single document both transaction and service fields
                //  {$unwind:"$patient"},
                {
                    $lookup: {
                       from: "patients",
                       localField: "patient",    // field in the Trasaction collection
                       foreignField: "_id",  // field in the Service collection
                       as: "fromPatient"
                    }
                 },
                 {$unwind:"$patient"},

                 {
                    $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$fromPatient", 0 ] }, "$$ROOT" ] } }
                 },
                 { $project: { fromPatient: 0 } },
                 {$group: {
                    _id:"$name",
                    patientId:{$last:"$patient"},
                    name:{$last:"$name"},
                    admissionDate: {$last:"$admissionDate"},
                    price: {$push:{$multiply: [ "$unitPrice","$amount"] }},
                    cost: {$push:0},
                    sell_price: { $push:{$multiply: [ "$unitPrice" ,"$amount"]}},
                    buy_price: { $push: {$multiply: [ "$buyPrice" ,"$amount"]}},
                    amount: { $sum:"$amount"}}},
                {$addFields:{totalSell : { $sum: "$sell_price" }}},
                {$addFields:{totalBuy : { $sum: "$buy_price" }}},
                {$addFields:{totalPrice : { $sum: "$price" }}},
                {$addFields:{totalCost : { $sum: "$cost" }}},
            ]).collation({locale:"en", strength: 1});
        //return supplies and the sorted argument for reincluding it
        transactions.sort((a,b)=>a.name.localeCompare(b.name,"es",{sensitivity:'base'}))
    };
    // transactions = await Transaction.find({consumtionDate:{$gte:begin,$lte:end},service:{hospitalEntry:$or[honorary,hospital]}}).populate('service')
}
    let arguments= {...(req.query)};
    return res.json({"transactions":transactions,'exits':exits,'currentUser':req.user, ...arguments})
}


//reset time point for resupply
module.exports.editDatePoint = async (req, res) => {
    let timePoint = await Point.findOne({name:"datePoint"});
    const nDate = getMexicoCityTime()
    timePoint.setPoint = nDate
    await timePoint.save()
    res.render(`exits`);
}



//render create payment form
module.exports.renderNewForm = async (req, res) => {
    let boxes = await  MoneyBox.find({}).populate("author")
    res.render(`exits/new`,{boxes});
}


//REFILL FORM STARTS ------

// render list of products to be refilled.
module.exports.refillForm = async (req, res) => {
    let entrega = req.query.entrega;
    let recibe = req.query.recibe;
    let currentPoint = await Point.findOne({name:"datePoint"}).populate({
        path: 'servicesCar',
        populate: {
          path: 'service patient addedBy',
        },
      })
    let transactions = currentPoint.servicesCar;
    res.render(`exits/refill_form`,{transactions,entrega,recibe});
}

module.exports.resetAllRefill = async (req, res) => {
    console.log('inside node reset')
    let currentPoint =  await Point.updateOne(
        {name:"datePoint"}, 
        { $set: { servicesCar: [] } }
    ); 

    let point = await Point.findOne({name:"datePoint"}).populate({
        path: 'servicesCar',
        populate: {
          path: 'service patient addedBy',
        },
      })
      console.log('passed')
      console.log(point.servicesCar.length)
    let transactions = point.servicesCar;
    res.json({transactions})
}

module.exports.resetSection = async (req, res) => {
    console.log('reset selection');
    console.log(req.body);
    let propertyValue = req.body.propertyValue;
    let primarySort = req.body.primarySort;
    let secondarySort = req.body.secondarySort;
    let currentPoint = await Point.findOne({name:"datePoint"}).populate({
        path: 'servicesCar',
        populate: {
          path: 'service patient addedBy',
        },
      })

    let transactions = currentPoint.servicesCar;


    if(primarySort == 'serviceData.class'){
        console.log('CHECKING FOR MATCHES')

        transactions = transactions.filter(transaction => {
            console.log('trans class')
            console.log(transaction.service.class)
            console.log('property')
            console.log(propertyValue)
            return transaction.service.class == propertyValue;
        });        
    }if(primarySort == 'location'){
        transactions = transactions.filter(transaction => {
            return transaction.location == propertyValue;
        });   
    }if(primarySort == 'userData.username'){
        transactions = transactions.filter(transaction => {
            return transaction.addedBy.username == propertyValue;
        });   
    }if(primarySort == 'patientData.name'){
        transactions = transactions.filter(transaction => {
            return transaction.patient.name == propertyValue;
        });   
    }

    let transactionIds = transactions.map(transaction => transaction._id);
    let upPoint = await Point.findOneAndUpdate(
        { _id: currentPoint._id }, 
        { $pull: { servicesCar: { $in: transactionIds } } }
    );
    await upPoint.save();
    res.json({})

}



module.exports.searchRefillTrans = async (req, res) => {
    console.log('inside regill trans')
    let entrega = req.query.entrega;
    let recibe = req.query.recibe;
    let firstOrderSort = req.query.primarySort;
    let secondOrderSort = req.query.secondarySort

    let currentPoint = await Point.findOne({name:"datePoint"}).populate({
        path: 'servicesCar',
        populate: {
          path: 'service patient addedBy',
        },
      })
    let transactions = currentPoint.servicesCar;
    let transactionIds = transactions.map(transaction => transaction._id);

    if(secondOrderSort != 'serviceData.name'){
         aggregatedTransactions = await Transaction.aggregate([
        {$match: {_id: {$in: transactionIds}}},
        // ... rest of your aggregation pipeline
        {
            $lookup: {
            from: "patients",
            localField: "patient",
            foreignField: "_id",
            as: "patientData"
            },
        },
        {
            $unwind: "$patientData" // Unwind the serviceData array
        },
        {
            $lookup: {
            from: "services",
            localField: "service",
            foreignField: "_id",
            as: "serviceData"
            },
        },
        {
            $unwind: "$serviceData" // Unwind the serviceData array
        },
        {
            $lookup: {
            from: "users",
            localField: "addedBy",
            foreignField: "_id",
            as: "userData"
            },
        },
        {
            $unwind: "$userData" // Unwind the serviceData array
        },
        {
            $group: {
            _id: `$${firstOrderSort}`, // group by firstOrder sort
            items: {
                $push: {
                patient: "$patientData",
                service: "$serviceData",
                addedBy: "$userData",
                amount: "$amount",
                location: "$location",
                consumtionDate: "$consumtionDate",
                terminalDate: "$terminalDate",
                discount: "$discount",
                toggle: "$toggle",
                totalAmount: {
                    $sum: "$items.amount"
                },
                discharged_data: "$discharged_data",
                secondarySort: `$${secondOrderSort}`
                },
            },
            },
        },
        {
            $sort: {
            secondarySort: 1, // 1 for ascending order, -1 for descending order
            }
        },
        {
            $project: {
            _id: 0,
            property: "$_id",
            items: 1
            },
        },
        ])
}else{
    aggregatedTransactions = await Transaction.aggregate([
        { $match: { _id: { $in: transactionIds } } },
        // ... rest of your aggregation pipeline
        {
          $lookup: {
            from: "patients",
            localField: "patient",
            foreignField: "_id",
            as: "patientData"
          }
        },
        { $unwind: "$patientData" },
        {
          $lookup: {
            from: "services",
            localField: "service",
            foreignField: "_id",
            as: "serviceData"
          }
        },
        { $unwind: "$serviceData" },
        {
          $lookup: {
            from: "users",
            localField: "addedBy",
            foreignField: "_id",
            as: "userData"
          }
        },
        { $unwind: "$userData" },
        {
            $group: {
                _id: {
                    firstOrderSort: `$${firstOrderSort}`,
                    secondOrderSort: `$${secondOrderSort}`
                }, // group by firstOrder sort
                service: { $first: "$serviceData" },
                amount: { $sum: "$amount" },
                location: { $first: "$location" },
                secondarySort: { $first: `$${firstOrderSort}` },
              }
        },
        {
            $group: {
              _id: `$secondarySort`,
              items: {
                $push: {
                  service: "$service",
                  amount: "$amount",
                  secondarySort: "$secondarySort"
                }
              },
            }
          },
          {
            $project: {
              _id: 0,
              property: '$_id',
              items: 1,
            }
          }
          
      ]);
}
    // aggregatedTransactions.forEach(transactionGroup => {
    //     transactionGroup.items.sort((a, b) => {
    //       if (a['secondarySort'] < b['secondarySort']) {
    //         return -1;
    //       }
    //       if (a['secondarySort'] > b['secondarySort']) {
    //         return 1;
    //       }
    //       return 0;
    //     });
    //   });

    res.json({'transactions':aggregatedTransactions,'secondarySort':secondOrderSort,'primarySort':firstOrderSort,entrega,recibe});
}












module.exports.refillFormPDF = async (req,res) =>{ 
    // let {begin,end,name} = req.query;               
    // const browser = await puppeteer.launch();       // run browser
    let entrega = req.body.refill.entrega;
    let recibe = req.body.refill.recibe;
    const chromeOptions = {
        headless: true,
        defaultViewport: null,
        args: [
            "--incognito",
            "--no-sandbox",
            "--single-process",
            "--no-zygote"
        ],
    };
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], ignoreDefaultArgs: ['--disable-extensions']});
    const page = await browser.newPage();           // open new tab yes
    
    // await page.goto(`https://pure-brushlands-42473.herokuapp.com/patients/${req.params.id}/showAccount?begin=${begin}&end=${end}`,{
    //     waitUntil: 'networkidle0'}); 
    // await page.goto(`https://warm-forest-49475.herokuapp.com/exits/refill`,{
    //     waitUntil: 'networkidle0'});          // go to site
    // await page.goto(
    //     `http://localhost:3000/patients/${req.params.id}/showAccount?begin=${begin}&end=${end}`,{
    //       waitUntil: 'networkidle0'});
    await page.goto(`https://clinicaabasolo.up.railway.app/exits/refill?entrega=${entrega}&recibe=${recibe}`,{
                waitUntil: 'networkidle0'});
    // await page.goto(`http://localhost:3000/exits/refill?entrega=${entrega}&recibe=${recibe}`,{
    //             waitUntil: 'networkidle0'});
    const dom = await page.$eval('.toPDF', (element) => {
        return element.innerHTML
    }) // Get DOM HTML
    await page.setContent(dom)   // HTML markup to assign to the page for generate pdf
    await page.addStyleTag({url: "https://stackpath.bootstrapcdn.com/bootstrap/5.0.0-alpha1/css/bootstrap.min.css"});
    await page.addStyleTag({content: `.image_print{
        position:absolute;
        top:50px;
        left:20px;
        width:250px;
        height: 120px;
      }`})
    const pdf = await page.pdf({landscape: false})
    await browser.close(); 
    res.contentType("application/pdf");
    res.send(pdf);
}

module.exports.createPayment = async (req, res, next) => {
    let {name, dueDate,category, moneyAmount,moneyBoxId} = req.body.payment;
    let moneyBox = await MoneyBox.findById(moneyBoxId).populate({
        path: 'dependantMoneyBoxes',
        populate: {
            path: 'dependantMoneyBoxes',
            populate: {
                path: 'dependantMoneyBoxes' // and so on...
            }
        }
    });
    const nDate = getMexicoCityTime();
    let exit_args = {name: name,clearDate: nDate,moneyAmount: moneyAmount,category:category};
    let exit = new Exit(exit_args);
    exit.author = res.locals.currentUser;
    for (const dependentBox of moneyBox.dependantMoneyBoxes) {
        dependentBox.exitsActive.push(exit)
        await dependentBox.save()
        for (const rootDependantBox of dependentBox.dependantMoneyBoxes) {
            rootDependantBox.exitsActive.push(exit)
            await rootDependantBox.save()
        }
    }
    moneyBox.exitsActive.push(exit);
    await exit.save();
    await moneyBox.save();
    req.flash('success', 'Pago creado');
    res.redirect(`/exits`)
}



module.exports.index_exits = async (req, res) => {
    // classify by name (case and symbol insensitive, up to a space)
    const resPerPage = 40;
    const page = parseInt(req.params.page) || 1;
    let {search,sorted} = req.query;
    console.log(search)
    if(!search){search = ''}
    search = new RegExp(escapeRegExp(search), 'gi');
    let dbQueries =  [
            { name: search },
            { category: search },
        ];  
    let exits = await Exit.find({$or:dbQueries}).populate("author").sort({ clearDate: -1 })
        .limit(resPerPage);

    const numOfProducts = await Exit.countDocuments({ $or: dbQueries});
    res.render('exits/index_exits', {exits:exits,"page":page, pages: Math.ceil(numOfProducts / resPerPage),
    numOfResults: numOfProducts,search:req.query.search,sorted:sorted})
}


module.exports.searchAllExits = async (req, res) => {
    console.log('called Search All');
    // let {search,sorted} = req.query;
    search = req.query.search;
    sorted = req.query.sorted;
    search = new RegExp(escapeRegExp(search), 'gi');
    const page = parseInt(req.query.page) || 1;
    const resPerPage = 40;
    let dbQueries =  [
            { name: search },
            { category: search },
        ]; 
    //other cases for the select element (other sorting options)
    let exits = [];
    const numOfProducts = await Exit.countDocuments({ $or: dbQueries });
    exits = await Exit.find({ $or: dbQueries })
    .sort({ clearDate: -1 })
    .skip(resPerPage * (page - 1))
    .limit(resPerPage);
    if (!exits) {
        res.locals.error = 'Ningun producto corresponde a la busqueda';
        res.json({})
    }
    console.log('the exits!!')
    console.log(exits)
    //return exits and the sorted argument for reincluding it
    return res.json({"exits":exits,"search":req.query.search,"page":page,"pages": Math.ceil(numOfProducts / resPerPage),"numOfResults": numOfProducts});
    
}


module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const payment = await Payment.findById(id);
    if (!payment) {
        req.flash('error', 'Error al buscar pago!');
        return res.redirect('/payments');
    }
    res.render(`payments/edit`, { payment });
}

module.exports.deleteExit = async (req, res) => {
    const { id } = req.params;
    await Exit.findByIdAndDelete(id);
    req.flash('success', 'Borrado');
    res.redirect(`payments`);
}

module.exports.accountReportPDF = async (req,res) =>{ 
    let {begin,end} = req.body;
    let honorarios = req.body.honorarios || "";
    let sorted = req.body.sorted;
    const chromeOptions = {
        headless: true,
        defaultViewport: null,
        args: [
            "--incognito",
            "--no-sandbox",
            "--single-process",
            "--no-zygote"
        ],
    };
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], ignoreDefaultArgs: ['--disable-extensions']});
    const page = await browser.newPage();           // open new tab
    
    // await page.goto(`https://pure-brushlands-42473.herokuapp.com/patients/${req.params.id}/showAccount?begin=${begin}&end=${end}`,{
    //     waitUntil: 'networkidle0'}); 
    await page.goto(`https://clinicaabasolo.up.railway.app//exits/hospital_account?begin=${begin}&end=${end}&entry=${honorarios}&sorted=${sorted}`,{
        waitUntil: 'networkidle0'});
    // await page.goto(`https://warm-forest-49475.herokuapp.com/hospital_account`,{
    //             waitUntil: 'networkidle0'});
    // await page.goto(`http://localhost:3000/exits/hospital_account?begin=${begin}&end=${end}&entry=${honorarios}&sorted=${sorted}`,{
    //             waitUntil: 'networkidle0'});
    // await page.waitForSelector('tbody> .toPDF');
    const dom = await page.$eval('.toPDF', (element) => {
        return element.innerHTML
    }) // Get DOM HTML
    await page.setContent(dom)   // HTML markup to assign to the page for generate pdf
    await page.addStyleTag({url: "https://stackpath.bootstrapcdn.com/bootstrap/5.0.0-alpha1/css/bootstrap.min.css"});
    await page.addStyleTag({content: `.image_print{
        position:absolute;
        top:50px;
        left:20px;
        width:250px;
        height: 120px;
      }`})
    const pdf = await page.pdf({landscape: false})
    await browser.close(); 
    res.contentType("application/pdf");
    res.send(pdf);
}

//PART FOR BOXES OF MONEY

module.exports.createBoxForm = async (req, res, next) => {
    console.log('-----')
    newHierarchy = parseInt(req.query.hierarchy);
    console.log(newHierarchy)
    let hierarchyParam = 3;
    if(newHierarchy){
        hierarchyParam = newHierarchy;  // Example value
    }
    let boxes = await MoneyBox.find({ hierarchy: { $eq: hierarchyParam - 1 } });
    console.log('boxessss')
    console.log(boxes)
    res.render(`exits/new_money_box`,{boxes,hierarchyParam})
}
module.exports.createBox = async (req, res, next) => {
    let name  = req.body.box.name;
    let boxes  = req.body.box.boxes;
    let hierarchy  = req.body.box.hierarchy;
    let boxArgs = {name: name,dependantMoneyBoxes: boxes,hierarchy:hierarchy};
    let exit = new MoneyBox(boxArgs);
    
    await exit.save();
    req.flash('success', 'Apartado creado');
    res.redirect(`/exits`)
}

module.exports.removeBoxFrom = async (req, res, next) => {
    console.log('remove box from called');
    console.log('remove id')
    console.log(req.body.removeParentId)
    let id = req.params.id;
    let currbox = await  MoneyBox.findById(id)
    console.log('the curent box');
    console.log(currbox)
    let currentBox = await MoneyBox.findByIdAndUpdate(id,
        { $pull: { dependantMoneyBoxes: mongoose.Types.ObjectId(req.body.removeParentId) } },
        { new: true, useFindAndModify: false }
    );
    await currentBox.save();
    console.log('the updated boc')
    console.log(currentBox)
    req.flash('success', 'Dependencia eliminada');
    res.json({})
}


module.exports.indexMoneyBox = async (req, res, next) => {
    let boxes = await  MoneyBox.find({}).populate("author")
    res.render(`exits/index_boxes`,{boxes})
}

module.exports.showMoneyBox = async (req, res, next) => {
    console.log('in here!!');
    console.log(req.params.id)
    let box = await MoneyBox.findById(req.params.id).populate({
        path: 'dependantMoneyBoxes',
        populate: {
            path: 'dependantMoneyBoxes',
            populate: {
                path: 'dependantMoneyBoxes' // and so on...
            }
        }
    });
    let boxes = await MoneyBox.find({ 
        _id: { $nin: box.dependantMoneyBoxes }, 
        hierarchy: { $eq: box.hierarchy - 1 } 
    });
    res.render(`exits/show_money_parts`,{box,boxes})
}

module.exports.deleteMoneyBox = async (req, res) => {
    console.log('FROM DELETE')
    const { id } = req.params;
    const moneyBox = await MoneyBox.findById(id);
    await moneyBox.remove();
    req.flash('success', 'Apartado borrado');
    res.redirect(`/exits/box`);
}

module.exports.boxShowContent = async (req, res) => {
    const { id } = req.params;
    let default_begin = getMexicoCityTime();
    transactionSort = '_id'
    exitSort = '_id'
    default_begin.setDate( default_begin.getDate() - 31 );
    const begin = req.query.begin ||default_begin;
    const end = req.query.end||getMexicoCityTime();
    var search = req.query.search||'';
    search = new RegExp(escapeRegExp(search), 'gi');
    console.log('2')
    const box = await MoneyBox.findById(id).populate([
        {
          path: 'transactionsActive',
          populate: {
            path: 'service patient addedBy',
          },
        },
        {
          path: 'exitsActive',
          populate: {
            path: 'Exit author ',
          },
        },
      ]);
      console.log('3')
    let dbQueriesTransactionsAnd =  [
        {relatedBoxes: mongoose.Types.ObjectId(id) },
        {terminalDate: { $gte: new Date( begin), $lte:  new Date(end) } },
    ]; 
    let dbQueriesTransactionsOr = [
        { 'patientData.name': search },
        { 'patientData.serviceType': search },
        { 'serviceData.name': search },
        { 'patientData.class': search },
        { 'serviceData.class': search }
      ];

    console.log(dbQueriesTransactionsOr)
    console.log('4')
    let dbQueriesExitsAnd =  [
        {relatedBoxes: mongoose.Types.ObjectId(id)},
        {clearDate: { $gte: new Date(begin), $lte: new Date(end) } },
    ]; 
    let dbQueriesExitsOr =  [
        { name: search},
        { category: search},
    ]; 
    console.log('5')
    //other cases for the select element (other sorting options)
    let transactions = [];
    // let trans = await Transaction.find({}).populate('realtedBoxes')
    // console.log('TRANS')
    // console.log(trans)
    transactions = await Transaction.aggregate([
        {
          $lookup: {
            from: "patients",
            localField: "patient",
            foreignField: "_id",
            as: "patientData"
          }
        },
        { $unwind: "$patientData" },
        {
          $lookup: {
            from: "services",
            localField: "service",
            foreignField: "_id",
            as: "serviceData"
          }
        },
        { $unwind: "$serviceData" },
        {
          $lookup: {
            from: "users",
            localField: "addedBy",
            foreignField: "_id",
            as: "userData"
          }
        },
        { $unwind: "$userData" },
        { $match: { $or: dbQueriesTransactionsOr } },
        { $match: { $and: dbQueriesTransactionsAnd } },
        {
          $group: {
            _id: `$${transactionSort}`, // group by firstOrder sort
            name: { $first: `$${transactionSort}`},
            discount:{$first: `$discount`},
            service: { $first: "$serviceData" },
            patient:{$first: '$patientData'},
            amount: { $sum: "$amount" },
            user:{$first: '$userData'},
            consumtionDate: { $first: "$consumtionDate" },
            total: {
              $sum: {
                $cond: [
                  { $eq: ["$serviceData.service_type", "supply"] },
                  {
                    $multiply: [
                      { $subtract: [1, { $divide: ["$discount", 100] }] },
                      { $multiply: ["$serviceData.sell_price", "$amount"] }
                    ]
                  },
                  {
                    $multiply: [
                      { $subtract: [1, { $divide: ["$discount", 100] }] },
                      { $multiply: ["$serviceData.price", "$amount"] }
                    ]
                  }
                ]
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            property: "$_id",
            name: 1,
            service: 1,
            amount: 1,
            user:1,
            discount:1,
            patient:1,
            consumtionDate: 1,
            total: 1
          }
        }
      ]);

    console.log('transaction data')
    console.log(transactions.length)
    console.log('transaction data instance')
    console.log(transactions[0])
    let exits = [];
    let exs = await Exit.find();
    exits = await Exit.aggregate([
        // ... rest of your aggregation pipeline
        {
            $lookup: {
              from: "users",
              localField: "author",
              foreignField: "_id",
              as: "userData"
            }
          },
          { $unwind: "$userData" },
          { $match: { $or: dbQueriesExitsOr } },
          { $match: { $and: dbQueriesExitsAnd } },
        {
            $group: {
                _id: `$${exitSort}`, // group by firstOrder sort
                name: { $first: `$name`},
                category: { $first: "$category" },
                clearDate:{ $first: '$clearDate'},
                user:{ $first: "$userData" },
                total: { $sum: "$moneyAmount" },
        }},
          {
            $project: {
              _id: 0,
              property: '$_id',
              name: 1,
              category: 1,
              clearDate: 1,
              user: 1,
              total: 1
            }
          }
      ]);
    //   console.log('exits sort')
    //   console.log(exitSort)
    //   console.log('EXITS')
    //   console.log(exits.length)
    //   console.log('EXITS instance')
    //   console.log(exits[0]);
    res.render(`exits/boxShowContent`,{box,'search':'','beginDate':begin,'endDate':end,'historyTransactions':transactions,'historyExits':exits});

}


module.exports.searchExitsBox = async (req, res) => {
    console.log('called Search Exits Box');
    const nDate = getMexicoCityTime()
    let default_begin = getMexicoCityTime();
    default_begin.setDate( default_begin.getDate() - 31 );
    let beginDate = req.query.begin || default_begin;
    let endDate =req.query.end || nDate;
    // let {search,sorted} = req.query;
    search = req.query.search;
    sorted = req.query.sorted;
    boxId = req.query.boxId;
    search = new RegExp(escapeRegExp(search), 'gi');
    let dbQueries =  [
            { name: search },
            { category: search },
            { relatedBoxes: boxId },
            { clearDate: { $gte: beginDate, $lte: endDate } },
        ]; 
    //other cases for the select element (other sorting options)
    let exits = [];
    exits = await Exit.find({ $or: dbQueries }).sort({clearDate: -1});
    if (!exits) {
        res.locals.error = 'Ningun producto corresponde a la busqueda';
        res.json({})
    }
    console.log('the exits!!')
    console.log(exits)
    //return exits and the sorted argument for reincluding it
    return res.json({"exits":exits,"search":req.query.search,endDate,beginDate});
    
}


module.exports.searchTransactionBox = async (req, res) => {
    console.log('called Search trans boc');
    const nDate = getMexicoCityTime()
    let default_begin = getMexicoCityTime();
    default_begin.setDate( default_begin.getDate() - 31 );
    let beginDate = req.query.begin || default_begin;
    let endDate =req.query.end || nDate;
    // let {search,sorted} = req.query;
    search = req.query.search;
    sorted = req.query.sorted;
    boxId = req.query.boxId;
    search = new RegExp(escapeRegExp(search), 'gi');
    let dbQueries =  [
            { name: search },
            { relatedBoxes: boxId },
            { consumtionDate: { $gte: beginDate, $lte: endDate } },
        ]; 
    //other cases for the select element (other sorting options)
    let transactions = [];
    transactions = await Transaction.find({ $or: dbQueries })
    if (!transactions) {
        res.locals.error = 'Ningun producto corresponde a la busqueda';
        res.json({})
    }
    console.log('the transactions!!')
    console.log(transactions)
    //return transactions and the sorted argument for reincluding it
    return res.json({"transactions":transactions,"search":req.query.search,endDate,beginDate});
    
}


module.exports.makeCut = async (req, res, next) => {
    console.log('make cut!!!')
    let box = await MoneyBox.findById(req.params.id).populate({
        path: 'dependantMoneyBoxes',
        populate: {
            path: 'dependantMoneyBoxes',
            populate: {
                path: 'dependantMoneyBoxes' // and so on...
            }
        }
    }).populate('transactionsActive').populate('exitsActive');
    // Update relatedBoxes for each transaction
    try{
    for (const transaction of box.transactionsActive) {
        console.log('the transaction')
        console.log(transaction)
        transaction.relatedBoxes.push(box._id);
        for (const dependentBox of box.dependantMoneyBoxes) {
            transaction.relatedBoxes.push(dependentBox._id);
            for (const rootDependantBox of dependentBox.dependantMoneyBoxes) {
                transaction.relatedBoxes.push(rootDependantBox._id);
            }
        }
        await transaction.save()

    }
    for (const exit of box.exitsActive) {
        exit.relatedBoxes.push(box._id);
        for (const dependentBox of box.dependantMoneyBoxes) {
            exit.relatedBoxes.push(dependentBox._id);
            for (const rootDependantBox of dependentBox.dependantMoneyBoxes) {
                exit.relatedBoxes.push(rootDependantBox._id);
            }
        }
        await exit.save()
    }
    box.transactionsActive = [];
    box.exitsActive = [];
    await box.save();

    res.json({})
}catch(e){
    console.log('error')
    console.log(e)
}
}



module.exports.boxShowFiltered = async (req, res) => {
    console.log('FROM boxShowContent');
    const { id } = req.params;
    let default_begin = getMexicoCityTime();
    default_begin.setDate( default_begin.getDate() - 31 );
    const begin = req.query.begin ||default_begin;
    const end = req.query.end||getMexicoCityTime();
    var search = req.query.search||'';
     try{
    const transactionSort = req.query.transactionSort||"name";
    const exitSort = req.query.exitSort||"name";

    search = new RegExp(escapeRegExp(search), 'gi');
     
    console.log('2')
    const box = await MoneyBox.findById(id).populate([
        {
          path: 'transactionsActive',
          populate: {
            path: 'service patient addedBy',
          },
        },
        {
          path: 'exitsActive',
          populate: {
            path: 'Exit author ',
          },
        },
      ]);
      console.log('3')

    let dbQueriesTransactionsAnd =  [
        {relatedBoxes: mongoose.Types.ObjectId(id) },
        {terminalDate: { $gte: new Date( begin), $lte:  new Date(end) } },
    ]; 
    let dbQueriesTransactionsOr = [
        { 'patientData.name': search },
        { 'serviceData.name': search },
        { 'patientData.class': search },
        { 'serviceData.class': search }
      ];

    console.log(dbQueriesTransactionsOr)
    console.log('4')
    let dbQueriesExitsAnd =  [
        {relatedBoxes: mongoose.Types.ObjectId(id)},
        {clearDate: { $gte: new Date(begin), $lte: new Date(end) } },
    ]; 
    let dbQueriesExitsOr =  [
        { name: search},
        { category: search},
    ]; 
    console.log('5')
    //other cases for the select element (other sorting options)
    let transactions = [];
    // let trans = await Transaction.find({}).populate('realtedBoxes')
    // console.log('TRANS')
    // console.log(trans)
    transactions = await Transaction.aggregate([
        {
          $lookup: {
            from: "patients",
            localField: "patient",
            foreignField: "_id",
            as: "patientData"
          }
        },
        { $unwind: "$patientData" },
        {
          $lookup: {
            from: "services",
            localField: "service",
            foreignField: "_id",
            as: "serviceData"
          }
        },
        { $unwind: "$serviceData" },
        {
          $lookup: {
            from: "users",
            localField: "addedBy",
            foreignField: "_id",
            as: "userData"
          }
        },
        { $unwind: "$userData" },
        { $match: { $or: dbQueriesTransactionsOr } },
        { $match: { $and: dbQueriesTransactionsAnd } },
        {
          $group: {
            _id: `$${transactionSort}`, // group by firstOrder sort
            name: { $first: `$${transactionSort}`},
            discount:{$first: `$discount`},
            service: { $first: "$serviceData" },
            patient:{$first: '$patientData'},
            amount: { $sum: "$amount" },
            user:{$first: '$userData'},
            consumtionDate: { $first: "$consumtionDate" },
            total: {
              $sum: {
                $cond: [
                  { $eq: ["$serviceData.service_type", "supply"] },
                  {
                    $multiply: [
                      { $subtract: [1, { $divide: ["$discount", 100] }] },
                      { $multiply: ["$serviceData.sell_price", "$amount"] }
                    ]
                  },
                  {
                    $multiply: [
                      { $subtract: [1, { $divide: ["$discount", 100] }] },
                      { $multiply: ["$serviceData.price", "$amount"] }
                    ]
                  }
                ]
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            property: "$_id",
            name: 1,
            service: 1,
            amount: 1,
            user:1,
            patient:1,
            discount:1,
            consumtionDate: 1,
            total: 1
          }
        }
      ]);

    // console.log('transaction data')
    // console.log(transactions.length)
    // console.log('transaction data instance')
    // console.log(transactions[0])
    let exits = [];
    let exs = await Exit.find();
    exits = await Exit.aggregate([
        // ... rest of your aggregation pipeline
        {
            $lookup: {
              from: "users",
              localField: "author",
              foreignField: "_id",
              as: "userData"
            }
          },
          { $unwind: "$userData" },
          { $match: { $or: dbQueriesExitsOr } },
          { $match: { $and: dbQueriesExitsAnd } },
        {
            $group: {
                _id: `$${exitSort}`, // group by firstOrder sort
                name: { $first: `$name`},
                category: { $first: "$category" },
                clearDate:{ $first: '$clearDate'},
                user:{ $first: "$userData" },
                total: { $sum: "$moneyAmount" },
        }},
          {
            $project: {
              _id: 0,
              property: '$_id',
              name: 1,
              category: 1,
              clearDate: 1,
              user: 1,
              total: 1
            }
          }
      ]);
      console.log('exits!')

      console.log(exits);
    res.json({box,search,'beginDate':begin,'endDate':end,'historyTransactions':transactions,'historyExits':exits});
     }catch(e){
         console.log('error')
         console.log(e)
     }
}



module.exports.reportPDF = async (req, res) => {
    console.log('from report PDF')
    try {
        console.log(req.params)
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], ignoreDefaultArgs: ['--disable-extensions']});
        const page = await browser.newPage();
        console.log('about to send request')

        await page.goto(`http://localhost:3000/exits/boxShow/${req.params.id}`, { waitUntil: 'networkidle0' });
    
        // Wait for any additional content to load if needed
        // You can use 
        console.log('back from request')
        const dom = await page.$eval('#contentTables', (element) => {
            return element.innerHTML
        }) // Get DOM HTML
        console.log('set content')
        console.log(dom)
        await page.setContent(dom)   // HTML markup to assign to the page for generate pdf
        await page.addStyleTag({url: "https://stackpath.bootstrapcdn.com/bootstrap/5.0.0-alpha1/css/bootstrap.min.css"});
        const pdf = await page.pdf({landscape: false})
        console.log('passed pdf generation')
        await browser.close();
        res.contentType("application/pdf");
        console.log(pdf)
        res.send(pdf);
        console.log('sent pdf')
      } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Error generating PDF');
      }
}



module.exports.generate_pdf = async (req, res) => {
    console.log('about to call puppuppupup')
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
            <h5 class="display-3 font-weight-bold text-center" style="font-family: Helvetica, Arial, sans-serif; color: #4A4A4A; text-transform: uppercase; letter-spacing: 2px;  font-size: 40px">Reporte ${getMexicoCityTime().toLocaleDateString()} </h5> </div>
        </div>
    </div>
     <div class="m-2" >
        ${content}
        </div>
    </body>
    </html>
    `);

    await page.addStyleTag({
        content: `
        .table-light {
            background-color: #f8f9fa; /* Set a lighter background color */
            /* Additional styles for the light table */
          }
          
          .table-dark {
            background-color: #343a40; /* Set a darker background color */
            color: #fff; /* Set a lighter text color for better contrast */
            /* Additional styles for the dark table */
          }
          .pop-up-container {
            display: inline-block;
            background-color: #fff;
            padding: 20px;
            box-shadow: 0px 10px 20px rgba(0, 0, 0, 0.2);
            border-radius: 10px;
          }
          
        `
    });

    const pdf = await page.pdf({ format: 'A4' });

    await browser.close();

    res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdf.length });
    res.send(pdf);
};
