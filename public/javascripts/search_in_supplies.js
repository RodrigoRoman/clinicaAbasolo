
$(document).ready(function() {
});
  

  function debounce(func, delay=600) {
    let timeoutId;
    let lastArgs;
    return function(...args) {
      lastArgs = args;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func.apply(this, lastArgs);
        timeoutId = null;
      }, delay);
    };
  }
// populate body with found elements
// $('#search_val').keyup(debounce(foundSupplies));

  $("body").delegate(".individual", "click",function(event) {
    $("#search_val").val($(this).val())
    $(".custom-select").val("name")
    foundSupplies(event)
  })

  $('#search_val').on('keyup', function(event) {
    if (event.keyCode === 13) {
        if($(".custom-select").val() == 'stock'){
            foundSupplies_existence(event);
    
        }else{
            foundSupplies(event);
    
        }
    }
  });

  // Add a click event listener to the search button
  $('#search-button').on('click', function(event) {
    console.log('search btn');
        foundSupplies(event);
  });
//   $( "#individual" ).click(function(event) {
//     event.preventDefault()
//     alert( "Handler for .click() called." );
//   })

$('.custom-select').change(function(event){
        foundSupplies(event);
  });



//======== Functions=====

  function makeDMYHour(date){
    const newDate = {d:date.getUTCDate(), m : date.getUTCMonth()+1,// JavaScript months are 0-11
    y : date.getUTCFullYear(),h:date.getUTCHours(), min:(((""+date.getUTCMinutes()).length>1)?date.getUTCMinutes():"0"+date.getUTCMinutes())};
    return  ((newDate.d.toString().length>1)?newDate.d:"0"+newDate.d)+ "/" + newDate.m+ "/" + newDate.y+ " "+newDate.h+":"+newDate.min;
  }

  function getMexicoCityTime() {
    const now = new Date();
    const mexicoCityOffset = -6 * 60; // Mexico City is UTC-6
    const mexicoCityTime = new Date(now.getTime() + mexicoCityOffset * 60 * 1000);
    return mexicoCityTime;
  }
    function numberCommas(x) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  const nDate = getMexicoCityTime();

//function for making day--month--year format
function makeDMY(date){
    const newDate = {d:date.getUTCDate(), m : date.getUTCMonth()+1,// JavaScript months are 0-11
    y : date.getUTCFullYear()};
    return  ((newDate.d.toString().length>1)?newDate.d:"0"+newDate.d)+ "/" + newDate.m+ "/" + newDate.y;
}
//difference in months between two dates
function diff_months(dt2, dt1) 
 {

  var diff =(dt2.getTime() - dt1.getTime()) / 1000;
   diff /= (60 * 60 * 24 * 7 * 4);
  return Math.round(diff);
 }
//function for selecting the border color based on existence and optimum parameters
function defineBorder(proportion){
    let border = "";
    if(proportion<=0.33){
        border = "danger";
    }else if(proportion>0.33 && proportion < 0.66){
        border = "warning"
    }else{
        border =  "success"
    }
    return border
}

// Fill table with data
function foundSupplies(event) {
    let currentRequest = null;
    const dat = {'search':$("#search_val").val(),'sorted':$(".custom-select").val(),'page':$(event).attr("alt")};
    let suppliesContent = '';
   $.ajax({
    type: 'GET',
    url: '/services/searchSupplies',
    data: dat,
    dataType: 'JSON',
    processData: true,
    beforeSend : function()    {          
        if(currentRequest != null) {
            currentRequest.abort();
        }
    },
    cache: false
    }).done(function( response ){
        suppliesContent+=`<div class="row supplies scrollDiv">`
        $.each(response.supplies, function(){
            //create a unique id. Add "a" as prefix so that avery string is acceptable
            let id_name = "a"+Math.random().toString(36).substring(7);
            suppliesContent+=(`
                <div class="col-3">
                    <div class="card mb-3">
                        <div id="`+id_name+`" class="carousel slide" data-ride="carousel">
                            <div class="carousel-inner">`);
                 this.images.forEach((img, i) => {
                if(i==0){
                    suppliesContent+=(`<div class="carousel-item active">
                     <img class="card_img mt-4" src="`+img.url+`"  alt="">
                 </div>`
                 )
                }else{
                    suppliesContent+=(`<div class="carousel-item">
                        <img class="card_img mt-4" src="`+img.url+`"  alt="">
                    </div>`
                    )
                }
                 });
                 suppliesContent+=`</div>`;
                  if(this.images.length > 1) {
                      suppliesContent+=(`
                    <a class="carousel-control-prev " href="#`+id_name+`" role="button" data-slide="prev">
                    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span class="sr-only">Previous</span>
                    </a>
                    <a class="carousel-control-next" href="#`+id_name+`" role="button" data-slide="next">
                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                        <span class="sr-only">Next</span>
                    </a>`);
                  }
                 const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',timeZone: 'America/Mexico_City' };
                 
                 let stockColor = defineBorder(this.stock/this.optimum);
                  suppliesContent+=(`
                        </div>
                        <div class="card-body">
                            <div class = "d-inline"><h3 class="card-subtitle ">`+this.name+`</h3><h6>`+this.principle+`</h6></div>
                            <h5 class="card-title text-muted">`+ this.class+`</h5>
                        </div>
                        <ul class="list-group list-group-flush">
                        <div class="clearfix split-items">
                        <li class="list-group-item" id = "serviceID" alt = "`+this._id+`" style="display: none;"></li>

                        <li class="list-group-item left-side ">Existencias:<br><span class = "border border-`+stockColor+` rounded-circle px-3 py-2 d-inline-block ">`+ this.stock+` </span></li>`
);
                    // if(this.outside){
                        suppliesContent+=(`<li class="list-group-item right-side">En Bodega: `+(this.stock-this.outside)+`</li></div>`)
                    // }

                    suppliesContent+=(` 
                            <li class="list-group-item">Proveedor: `+this.supplier+`</li>
                            <li class=" d-flex justify-content-center align-items-center">Agregar a existencias</li>
                            <li class="list-group-item d-flex justify-content-center align-items-center"> 
                    <div class="number-input mx-2">
                      <button class="minus2"></button>
                      <input class="quantity updateDiscount" min="0" name="quantity" value="0" type="number">
                      <button class="plus2"></button>
                    </div>      
                    <button class="btn btn-sm btn-discount-inactive btn-secondary discount-button  mx-2" onclick="toggleAddToStock(this)">
                      <i class="fas fa-cog submitDiscount"></i>
                    </button>
                  </li>


                            <div class="clearfix split-items">
                                <li class="list-group-item left-side">Compra: $`+ this.buy_price+` /cu</li>
                                <li class="list-group-item right-side ">Venta: $`+this.sell_price+` /cu</li>
                            </div>
                        </ul>`);
                    if(true){
                suppliesContent+= (`<div class="d-flex justify-content-around mx-1 my-1">
                            <a class="card-link btn btn-info" href="/services/`+this._id+`/edit?service_type=supply"><i class="fas fa-edit"></i></a>
                            <a class="card-link btn btn-secondary" href="/services/`+this._id+`/supply"><i class="fas fa-copy"></i></a>
                            <form class="d-inline" action="/services/`+this._id+`?_method=DELETE" method="POST">
                                <button class="btn btn-danger"><i class="fas fa-trash"></i></button>
                            </form>
                        </div>`);
                         }
                suppliesContent+= (`</div>
                                        </div>`);
            
                 });
                 suppliesContent+=`</div>`
                 let pagination = `<div class="row my-3 pagination customClass">
                 <div class="btn-group float-right" role="group" aria-label="First group">`;
                    if(response.page >1){
                        pagination += `<a onclick="foundSupplies(this)" alt="${response.page-1}" class="btn btn-light " role="button" aria-pressed="true"><i class="fas fa-arrow-circle-left"></i></a>`
                    }
                    for(let step = 1; step < response.pages+1; step++) {
                        let act = (step == response.page)?"active":"";
                        pagination += `<a onclick="foundSupplies(this)" alt="${step}" class="btn btn-light ${act}" role="button" aria-pressed="true">${step}</a>`
                    }
                    if(response.page+1 <= response.pages){
                        pagination += `<a onclick="foundSupplies(this)" alt="${response.page+1}" class="btn btn-light " role="button" aria-pressed="true"><i class="fas fa-arrow-circle-right"></i></a>`
                    }
                     pagination += `</div>
                     </div>`
                     
                 $('.supplies').html( suppliesContent);  
                 $('.pagination').replaceWith( pagination); 
                 $("selector").find('option[value="'+response.sorted+'"]').attr('selected','selected')
                 $("#search_val").val(response.search)

     
   });
 };

//Add more to existence


//DISCOUNT
function addToSupply(event,data) {
  console.log('called submit discount'); // Add this line to check if the function execution completes
  const dat = {'search':$("#search_val").val(),'sorted':$(".custom-select").val(),'page':$(event).attr("alt")};
  console.log('the data');
  console.log(dat)
  let suppliesContent = '';

  let merged = Object.assign({}, dat, data);
      $.ajax({
        type: 'PUT',
        url: `/services/${data.service_id}/supply/addToSupply`,
        data: merged,
        dataType: 'JSON',
      }).done(function( response ){
        suppliesContent+=`<div class="row supplies scrollDiv">`
        $.each(response.supplies, function(){
            //create a unique id. Add "a" as prefix so that avery string is acceptable
            let id_name = "a"+Math.random().toString(36).substring(7);
            suppliesContent+=(`
                <div class="col-3">
                    <div class="card mb-3">
                        <div id="`+id_name+`" class="carousel slide" data-ride="carousel">
                            <div class="carousel-inner">`);
                 this.images.forEach((img, i) => {
                if(i==0){
                    suppliesContent+=(`<div class="carousel-item active">
                     <img class="card_img mt-4" src="`+img.url+`"  alt="">
                 </div>`
                 )
                }else{
                    suppliesContent+=(`<div class="carousel-item">
                        <img class="card_img mt-4" src="`+img.url+`"  alt="">
                    </div>`
                    )
                }
                 });
                 suppliesContent+=`</div>`;
                  if(this.images.length > 1) {
                      suppliesContent+=(`
                    <a class="carousel-control-prev " href="#`+id_name+`" role="button" data-slide="prev">
                    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span class="sr-only">Previous</span>
                    </a>
                    <a class="carousel-control-next" href="#`+id_name+`" role="button" data-slide="next">
                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                        <span class="sr-only">Next</span>
                    </a>`);
                  }
                 const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',timeZone: 'America/Mexico_City' };
                 
                 let stockColor = defineBorder(this.stock/this.optimum);
                  suppliesContent+=(`
                        </div>
                        <div class="card-body">
                            <div class = "d-inline"><h3 class="card-subtitle ">`+this.name+`</h3><h6>`+this.principle+`</h6></div>
                            <h5 class="card-title text-muted">`+ this.class+`</h5>
                        </div>
                        <ul class="list-group list-group-flush">
                        <div class="clearfix split-items">
                        <li class="list-group-item" id = "serviceID" alt = "`+this._id+`" style="display: none;"></li>

                        <li class="list-group-item left-side ">Existencias:<br><span class = "border border-`+stockColor+` rounded-circle px-3 py-2 d-inline-block ">`+ this.stock+` </span></li>`
);
                    if(this.outside){
                        suppliesContent+=(`<li class="list-group-item right-side">En Bodega: `+(this.stock-this.outside)+`</li></div>`)
                    }

                    suppliesContent+=(` 
                            <li class="list-group-item">Proveedor: `+this.supplier+`</li>
                            <li class=" d-flex justify-content-center align-items-center">Agregar a existencias</li>
                            <li class="list-group-item d-flex justify-content-center align-items-center"> 
                    <div class="number-input mx-2">
                      <button class="minus2"></button>
                      <input class="quantity updateDiscount" min="0" name="quantity" value="0" type="number">
                      <button class="plus2"></button>
                    </div>      
                    <button class="btn btn-sm btn-discount-inactive btn-secondary discount-button  mx-2" onclick="toggleAddToStock(this)">
                      <i class="fas fa-cog submitDiscount"></i>
                    </button>
                  </li>


                            <div class="clearfix split-items">
                                <li class="list-group-item left-side">Compra: $`+ this.buy_price+` /cu</li>
                                <li class="list-group-item right-side ">Venta: $`+this.sell_price+` /cu</li>
                            </div>
                        </ul>`);
                    if(true){
                suppliesContent+= (`<div class="d-flex justify-content-around mx-1 my-1">
                            <a class="card-link btn btn-info" href="/services/`+this._id+`/edit?service_type=supply"><i class="fas fa-edit"></i></a>
                            <a class="card-link btn btn-secondary" href="/services/`+this._id+`/supply"><i class="fas fa-copy"></i></a>
                            <form class="d-inline" action="/services/`+this._id+`?_method=DELETE" method="POST">
                                <button class="btn btn-danger"><i class="fas fa-trash"></i></button>
                            </form>
                        </div>`);
                         }
                suppliesContent+= (`</div>
                                        </div>`);
            
                 });
                 suppliesContent+=`</div>`
                 let pagination = `<div class="row my-3 pagination customClass">
                 <div class="btn-group float-right" role="group" aria-label="First group">`;
                    if(response.page >1){
                        pagination += `<a onclick="foundSupplies(this)" alt="${response.page-1}" class="btn btn-light " role="button" aria-pressed="true"><i class="fas fa-arrow-circle-left"></i></a>`
                    }
                    for(let step = 1; step < response.pages+1; step++) {
                        let act = (step == response.page)?"active":"";
                        pagination += `<a onclick="foundSupplies(this)" alt="${step}" class="btn btn-light ${act}" role="button" aria-pressed="true">${step}</a>`
                    }
                    if(response.page+1 <= response.pages){
                        pagination += `<a onclick="foundSupplies(this)" alt="${response.page+1}" class="btn btn-light " role="button" aria-pressed="true"><i class="fas fa-arrow-circle-right"></i></a>`
                    }
                     pagination += `</div>
                     </div>`
                     const uniqueStr = Math.random().toString(36).substring(7);

                     let flashMessage = `<div class="alert alert-success alert-dismissible fade show fixed-top" role="alert">
                     Stock agregado
                     <button type="button" id = flashMessage${uniqueStr} class="closeAlert" data-dismiss="alert" aria-label="Close">
                         <span aria-hidden="true">&times;</span>
                     </button>
                     </div> `;
                     $("main").prepend(flashMessage);

                 $('.supplies').html( suppliesContent);  
                 $('.pagination').replaceWith( pagination); 
                 $("selector").find('option[value="'+response.sorted+'"]').attr('selected','selected')
                 $("#search_val").val(response.search)

     
   });
 };



$(document).on("click", ".minus2", function() {
  const quantityInput = $(this).parent().children(".quantity");
  const currentValue = parseInt(quantityInput.val());
  if (currentValue - 1 >= 0) {
    quantityInput.val(currentValue - 1);
    const discountButton = $(this).closest("td").find(".discount-button");

    // Set the toggle to inactive
    discountButton.removeClass("btn-discount-inactive btn-secondary");
    discountButton.addClass("btn-discount-active btn-primary");
    discountButton.html('<i class="fas fa-paper-plane"></i>'); 

  }
});
$(document).on("click", ".plus2", function() {
  console.log('called plus');
  const quantityInput = $(this).parent().children(".quantity");
  const currentValue = parseInt(quantityInput.val());
  if (currentValue + 1 < 999) {
    quantityInput.val(currentValue + 1);
    console.log('about to update')
    const discountButton = $(this).closest("li").find(".discount-button");

    // Set the toggle to inactive
    discountButton.removeClass("btn-discount-inactive btn-secondary");
    discountButton.addClass("btn-discount-active btn-primary");
    discountButton.html('<i class="fas fa-paper-plane"></i>'); 
  }
});

$(document).on("click", ".quantity", function() {
    const discountButton = $(this).closest("li").find(".discount-button");
    // Set the toggle to inactive
    discountButton.removeClass("btn-discount-inactive btn-secondary");
    discountButton.addClass("btn-discount-active btn-primary");
    discountButton.html('<i class="fas fa-paper-plane"></i>'); 
  });
  
  function toggleAddToStock(discountButton) {
    const quantityValue = $(discountButton).closest("li").find(".quantity").val();
    const service_id = $(discountButton).closest("li").parent().find("#serviceID").attr("alt");
  
    data = {
      'service_id': service_id,
      'addToSupply': quantityValue,
    }
    const isActive = discountButton.classList.contains("btn-discount-active");
    if (isActive) {
        console.log('about to call addToSupply')
      discountButton.classList.remove("btn-discount-active", "btn-success");
      discountButton.classList.add("btn-discount-inactive", "btn-secondary");
  
      discountButton.innerHTML = '<i class="fas fa-cog"></i>'; // change icon when inactive
      addToSupply(event,data);
      // stop barcode scanning when inactive
    } 
  }



//EXISTENCE REPORT
$('#toggle-button').on('click', function() {
    var numberInputForm = $('#limitExistence');
  
    if (numberInputForm.is(':hidden')) { // Check if the div is hidden instead of visible
        console.log('is not visible')
      numberInputForm.show(); // Show the div
      $(this).text('Todo'); // Change the button text
    } else {
        console.log('Visible')
      numberInputForm.hide(); // Hide the div
      $(this).text('Limite'); // Change the button text
    }
});


$('#printExistences').on('click',listExistence)

function listExistence(event) {
    console.log('from printExistences');
    let currentRequest = null;
    let lm = 99999;
    if(!$('#limitExistence').is(':hidden')){
        console.log('inside inputed limit');
        console.log($('.quantityEX').val());
        lm = $('.quantityEX').val()
    }
    const dat = {'search':$("#search_val").val(),'sorted':$(".custom-select").val(),limit:lm};
    let suppliesContent = '';
   $.ajax({
    type: 'GET',
    url: '/services/searchSupplyLimit',
    data: dat,
    dataType: 'JSON',
    processData: true,
    beforeSend : function()    {          
        if(currentRequest != null) {
            currentRequest.abort();
        }
    },
    cache: false
    }).done(function( response ){
        listSupplies = response.supplies;
        printListExistence(listSupplies)
    })
}

var printer;

async function printListExistence(listExistence) {
    // Handle the printing of a specific transaction here
    console.log('listExisctence FROM PRINT TICKET FUNCTION');
    console.log(listExistence)
    serviceUuid = 'e7810a71-73ae-499d-8c15-faa9aef0c3f2';
    characteristicUuid = 'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f';
     deviceKey = 'lastUsedDevice'; // Key for storing the device address
     const encoder = new TextEncoder();

 
  printData1 = new Uint8Array([
   0x1B, 0x40, // Initialize the printer
   0x1B, 0x21, 0x20, // Set the font size to double height
   0x1B, 0x61, 0x01, // Align text to center
   ...encoder.encode('Lista de existencias'), 
 ]);

 
 let receiptContent = '';
        receiptContent += `Nombre - Principio  \n                       Optimo   Existencias\n`;
        receiptContent += `------------------------------------------\n`;

        listExistence.forEach(function (service, index) {
            receiptContent += `${service.name.padEnd(15)}  ${service.principle.padEnd(15)}\n                            ${service.optimum.toString().padEnd(8)}  ${service.stock.toString().padEnd(8)}\n`;
        });
 
 dateNow = getMexicoCityTime()
  hour = dateNow.getUTCHours(); // Get the hour component of the datetime
  minutes = dateNow.getUTCMinutes(); // Get the minutes component of the datetime
   amOrPm = hour >= 12 ? 'PM' : 'AM'; // Determine whether the time is in the AM or PM
  formattedHour = hour % 12 === 0 ? 12 : hour % 12; // Convert the hour to 12-hour format
  formattedMinutes = minutes < 10 ? `0${minutes}` : minutes; // Add a leading zero to minutes if necessary
  formattedTime = `${formattedHour}:${formattedMinutes} ${amOrPm}`; 
 
 // Add patient name and services to the ticket body
 printData2 = new Uint8Array([
   0x1B, 0x61, 0x00, // Align text to left
   0x1B, 0x21, 0x00, // Set the font size to normal
   0x0A, // Print a line feed
   ...encoder.encode('               '+dateNow.toLocaleDateString()+' '+formattedTime), 
   0x0A, // Print a line feed
   0x0A, // Print a line feed
   ...encoder.encode(receiptContent),

   0x0A, // Print a line feed
   0x0A, // Print a line feed
   0x0A, // Print a line feed
   0x0A, // Print a line feed
   0x1D, 0x56, 0x41, 0x10,
//    0x1B, 0x70, 0x00, 0x19, 0xFF //linea para abrir la caja


 ]);
 
 // var printData = new Uint8Array([...printData1,...printData2]);
   try {
       if(printer){
         device = printer
       }else{
         device = await navigator.bluetooth.requestDevice({
           filters: [{ name: 'Printer001' ,deviceId:'OsURHI+3wBk8YoxCAZGClg=='}],
           optionalServices: [serviceUuid],
         });
         printer = device;
       }    
 
     const server = await device.gatt.connect();
     const service = await server.getPrimaryService(serviceUuid);
     const characteristic = await service.getCharacteristic(characteristicUuid);
     const encoder = new TextEncoder();
 
     await characteristic.writeValue(printData1);
     const CHUNK_SIZE = 50; // define the size of each chunk
 const chunks = []; // array to hold the chunks
 
 // split the printData2 array into chunks of CHUNK_SIZE bytes
 for (let i = 0; i < printData2.length; i += CHUNK_SIZE) {
   chunks.push(printData2.slice(i, i + CHUNK_SIZE));
 }
 
 // send each chunk with a delay between them
 for (let i = 0; i < chunks.length; i++) {
   // setTimeout(async () => {
     await characteristic.writeValue(chunks[i]);
   // }, i * 1000); // add a delay of 1 second between each chunk (adjust the delay time as needed)
 }
   console.log('device to be stored');
   console.log(device)
 
     await server.disconnect();
 
   } catch (error) {
     console.error(error);
   }  
  }


$(document).on("click", ".minusEX", function() {
  const quantityInput = $(this).parent().children(".quantityEX");
  const currentValue = parseInt(quantityInput.val());
  if (currentValue - 1 >= 0) {
    quantityInput.val(currentValue - 1);
  }
})
$(document).on("click", ".plusEX", function() {
  const quantityInput = $(this).parent().children(".quantityEX");
  const currentValue = parseInt(quantityInput.val());
  if (currentValue + 1 < 99999) {
    quantityInput.val(currentValue + 1);
  }
})