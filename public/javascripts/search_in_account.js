const userListData = [];
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
// DOM Ready =============================================================
$(document).ready(function() {
  //set dates with default values
  $("#endDate").val(makeYMD(new Date(JSON.parse(endD))));
  $("#beginDate").val(makeYMD(new Date(JSON.parse(beginD))));
});

let barcodeBuffer = '';

document.addEventListener('keydown', function(event) {
  // Check if the key is the 'Enter' key
  if (event.key === 'Enter') {
    // Barcode is complete, process it
    addServicePistol(event, barcodeBuffer);
    // Clear the buffer
    barcodeBuffer = '';
  } else {
    // Append the key to the buffer
    barcodeBuffer += event.key;
  }
});


//----------
// document.addEventListener('DOMContentLoaded', function() {
//   const barcodeInput = document.getElementById('barcode');

//   barcodeInput.addEventListener('change', function() {
//       const barcodeData = barcodeInput.value;
//       console.log('Barcode data:', barcodeData);

//       // You can process the barcode data here
//       processBarcodeData(barcodeData);
//   });

//   function processBarcodeData(data) {
//       // Implement your barcode processing logic here
//       alert('Scanned barcode: ' + data);
//   }
// });
//----------


   

var printer;

function stringBluetooth(deviceData) {
  console.log('transform from json')
  console.log(deviceData)
  stringBlue = {}
  stringBlue['id'] = deviceData.id;
  stringBlue['name'] = deviceData.name;
  stringBlue['gatt'] = deviceData.gatt;
  stringBlue['ongattserverdisconnected'] = deviceData.ongattserverdisconnected;
  return stringBlue
}

async function printTicket() {
   serviceUuid = 'e7810a71-73ae-499d-8c15-faa9aef0c3f2';
   characteristicUuid = 'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f';
    deviceKey = 'lastUsedDevice'; // Key for storing the device address


 printData1 = new Uint8Array([
  0x1B, 0x40, // Initialize the printer
  0x1B, 0x21, 0x20, // Set the font size to double height
  0x1B, 0x61, 0x01, // Align text to center
  0x43, 0x4C, 0x49, 0x4E, 0x49, 0x43, 0x41, 0x20, 0x41, 0x42, 0x41, 0x53, 0x4F, 0x4C, 0x4F, // CLINICA ABASOLO
  0x0A, // Print a line feed
  0x0A, // Print a line feed
  0x1B, 0x61, 0x01, // Align text to center
  0x1B, 0x21, 0x00, // Set font size to normal
  0x43, 0x2E, 0x20, 0x41, 0x62, 0x61, 0x73, 0x6F, 0x6C, 0x6F, 0x20, 0x32, 0x37, 0x2C, // Address line 1: C. Abasolo 27,
  0x0A, // Print a line feed
  0x5A, 0x6F, 0x6E, 0x61, 0x20, 0x43, 0x65, 0x6E, 0x74, 0x72, 0x6F, 0x2C, 0x20, 0x33, 0x38, 0x38, 0x30, 0x30, // Address line 2: Zona Centro, 38800
  0x0A, // Print a line feed
  0x4D, 0x6F, 0x72, 0x6F, 0x6C, 0x65, 0x6F, 0x6E, 0x2C, 0x20, 0x47, 0x74, 0x6F, 0x2E, // Address line 3: Moroleon, Gto.
  0x0A, // Print a line feed
  0x0A, // Print a line feed
  0x0A, // Print a line feed
  0x54, 0x65, 0x6C, 0x65, 0x66, 0x6F, 0x6E, 0x6F, 0x3A, 0x20, 0x34, 0x34, 0x35, 0x20, 0x34, 0x35, 0x37, 0x20, 0x34, 0x34, 0x31, 0x37, 0x0A, // "Telefono: 445 457 4417"
  
]);

// Extract data from patient and servicesCar objects
// const { name, servicesCar } = JSON.parse(pat);
const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

patName = JSON.parse(pat).name;
servicesCar = JSON.parse(pat).servicesCar;
const servicesText = await Promise.all(servicesCar.map(async service => {
  console.log('the service inside ticket')
  console.log(service)
  const sell = service.service.type === 'Supply' ? service.service.sell_price : service.service.price;
  const nameParts = service.service.name.match(/.{1,45}\b/g);
  const nameServ = nameParts[0]+`\n`;
  console.log(nameServ);
  const price = parseFloat(sell).toLocaleString("en-US").padStart(18, ' ');
  const subtotal1 = parseFloat((service.amount * (sell-(sell*service.discount*0.01)))).toLocaleString("en-US").padStart(5, ' ');
  console.log('subtotal')
  // .toLocaleString("en-US").padStart(5, ' ');
  const amount = service.amount.toString().padStart(0, ' ');
  console.log(`${nameServ} ${price}       ${amount}   ${service.discount}  ${subtotal1}\n`);

  const nameWithLines = [nameServ, nameServ].join('\n');
  return `${nameServ}   ${price}    ${amount}   ${service.discount}   ${subtotal1}\n`;
}));

const servicesTextJoined = servicesText.join('\n');
// Column names
header = `Nombre            $      X   - %    ST    \n`;
divider = '-'.repeat(45);

// Combine header, services text and divider
ticketText = `${header}${divider}\n${servicesTextJoined}\n${divider}\n`;
  
const subtotal = servicesCar.reduce((total, service) =>{ 
  sell2 = service.service.type === 'Supply' ? service.service.sell_price : service.service.price;
  return total +   (service.amount * (sell2-(sell2*service.discount*0.01)))
}, 0);
total = subtotal.toLocaleString("en-US");
const totalSaved = servicesCar.reduce((total, service) =>{ 
  sell2 = service.service.type === 'Supply' ? service.service.sell_price : service.service.price;
  return total +   (service.amount * (sell2*service.discount*0.01))
}, 0);
totalSavedStr = totalSaved.toLocaleString("en-US");
const encoder = new TextEncoder();

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
  ...encoder.encode('      '+dateNow.toLocaleDateString()+' '+formattedTime), 
  0x0A, // Print a line feed
  0x0A, // Print a line feed
  ...encoder.encode(patName),// Print patient name
  0x0A, // Print a line feed
  0x0A, // Print a line feed
  ...encoder.encode(ticketText),
// Print a line feed
  0x0A, // Print a line feed
  ...encoder.encode('                   Usted ahorro: $'+totalSavedStr),
  0x0A, // Print a line feed
  0x0A, // Print a line feed
  0x0A, // Print a line feed
  0x1B, 0x61, 0x01, // Align text to center
  0x1B, 0x21, 0x30, // Set font type to B (bold)
  0x0A, // Print a line feed
  ...encoder.encode('TOTAL: $'), 
  ...encoder.encode(total), // Print subtotal
  0x0A, // Print a line feed
  0x0A, // Print a line feed
  ...encoder.encode('Urgencias 24/7'), 
  0x0A, // Print a line feed
  0x0A, // Print a line feed
  0x1D, 0x56, 0x41, 0x10,
  0x1B, 0x70, 0x00, 0x19, 0xFF //linea para abrir la caja
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


// plus minus buttons from input
$("tbody" ).on( "click", ".minus", function() {
    const currentValue = parseInt($(this).parent().children(".quantity").val());
    if(currentValue-1>=0){
        $(this).parent().children(".quantity").val(currentValue-1);
    }
    
  });

$("tbody" ).on( "click", ".plus", function() {
    const currentValue = parseInt($(this).parent().children(".quantity").val());
    if(currentValue+1<999){
        $(this).parent().children(".quantity").val(currentValue+1);
    }
  });

//plus minus for discount

//located below the search bar
$('#search_val').keyup(populateTable);

// pop modal with search
$('#search').click(populateTableModal);
$('#search_val').on('keypress', function (e) {
  if(e.which === 13){
      e.preventDefault();
      $('#search')[0].click();
  }
});

//remove search table when modal is closed
//Return the modal table to an empty state
$('.sp').on("click", function (e) {
  //If parent does not have class expanded
  if ($(this).parent().attr("class")=="close"){
    $('#searchList table tbody').html("")
    $('#searchTableModal tbody').html("")
  } 
});;


// Hide search list body when clicked outside it
$("body").on('click',function(e){
  let closed = ["closeAlert","alert-dismissable"]
  if($(e.target).closest("#searchList tbody").length === 0 && $(e.target).parent().attr('class') !="closeAlert" && $(e.target).attr('class') !="closeAlert") { $('#searchList table tbody').html("")};
});
//add service to car
$("tbody").on('click',".addToCart",addService); 

//delete Item from patient account
$("#account-table").on('click',".delete-item",removeService);

//edit item from patients account
$("#account-table").on('click',".edit-item",editService);

//edit item from patients account
$("#account-table").on('click',".accept-item",submitEditService);

//edit time service
$("#account-table").on('click',".btn-toggle",submitEditTimeService);

// through datetime change
$("#account-table").on('change',"#start",submitTimeServ)
$("#account-table").on('change',"#until",submitTimeServ)


//======= date range     =====
let patient  = JSON.parse(pat);
const patientDate = new Date(patient.admissionDate);
function makeYMD(dat){
  const date = new Date(dat);
const newDate = {d:date.getUTCDate(), m : date.getUTCMonth()+1,// JavaScript months are 0-11
y : date.getUTCFullYear()};
return  newDate.y+ "-" + ((newDate.m.toString().length>1)?newDate.m:"0"+newDate.m)+ "-" + ((newDate.d.toString().length>1)?newDate.d:"0"+newDate.d);
}


//set date buttons
$('.todays').click(function(){
  $("#endDate").val(makeYMD(nDate));
  $("#beginDate").val(makeYMD(nDate));
})
$('.tillToday').click(function(){
  $("#endDate").val(makeYMD(nDate));
  $("#beginDate").val(makeYMD(new Date(patientDate)));
})
$('.otherDate').click(function(){
  $("#endDate").val("");
  $("#beginDate").val("");
})

//Button 
$(".apply_dates").on("click",updateDate);

// Functions =============================================================

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

function makeDMY(date){
  const newDate = {d:date.getUTCDate(), m : date.getUTCMonth()+1,// JavaScript months are 0-11
  y : date.getUTCFullYear()};
  return  ((newDate.d.toString().length>1)?newDate.d:"0"+newDate.d)+ "/" + newDate.m+ "/" + newDate.y;
}
// Fill table with data
function populateTable(event) {
   event.preventDefault();
   const timeUnits =  ["Hora", "Dia"];
  // Empty content string
  let tableContent = '';
  // jQuery AJAX call for JSON
  let search = $("#search_val").val();
  $.getJSON( `/patients/${patient_id}/search3`,{search}, function(data) {
    // For each item in our JSON, add a table row and cells to the content string
    $.each(data, function(){
      tableContent += '<tr>';
      if(this.doctor){
        tableContent += '<td><a class = "text-dark" href="/services/'+this._id+'/edit">' + this.name + '</a></td>';
        tableContent += '<td><small alt ="'+this._id+'" class="text-muted">' + numberCommas(this.price) + '</small></td>';
        tableContent += '<td><small class="text-muted">  </small></td>';
        tableContent += '<td><small class="text-muted">  </small></td>';

      }else{
        tableContent += '<td><a class = "text-dark" href="/services/'+this._id+'/edit">' + this.name + '</a></td>';
        tableContent += '<td><small alt ="'+this._id+'" class="text-muted">' + this.class + '</small></td>';
        tableContent += '<td></td>'
        tableContent += '<td><small class="text-muted">  </small></td>';
      }
      if(timeUnits.includes(this.unit)){
        tableContent += '<td></td>';
      }else{
        tableContent += '<td><div class="number-input"><button class="minus"></button><input class="quantity" min="0" name="quantity" value="1" type="number"><button class="plus"></button></div></td>';
      }
      tableContent += '<td class="art"><button type="button" class="addToCart btn btn-sm btn-info">Agregar</button></td>';
      tableContent += '</tr>';
    });

    // Inject the whole content string into our existing HTML table
    $('#searchList table tbody').html(tableContent);
  });
};



//for a popup window
function populateTableModal(event) {
    event.preventDefault();
  // Empty content string
  let tableContent = '';
  // jQuery AJAX call for JSON
  let search = $("#search_val").val();
  let exp = $("#expirDate").val();
  const timeUnits =  ["Hora", "Dia"];
  $.getJSON( `/patients/${patient_id}/search`,{search,exp}, function( data ) {
    // For each item in our JSON, add a table row and cells to the content string
    $.each(data, function(){
      tableContent += '<tr>';
      if(this.doctor){
        tableContent += '<td><a class = "text-dark" href="/services/'+this._id+'/edit">' + this.name + '</a></td>';
        tableContent += '<td><small alt ='+this._id+' class="text-muted">' + this.price + '</small></td>';
        tableContent += '<td><small class="text-muted">  </small></td>';
        tableContent += '<td><small class="text-muted">  </small></td>';
      }else{
        tableContent += '<td><a class = "text-dark" href="/services/'+this._id+'/edit">' + this.name + '</a></td>';
        tableContent += '<td><small alt ='+this._id+' class="text-muted">' + this.class + '</small></td>';
        tableContent += '<td></td>'

      };
      if(timeUnits.includes(this.unit)){
        tableContent += '<td></td>';
      }else{
      tableContent += '<td><div class="number-input"><button class="minus"></button><input class="quantity" min="0" name="quantity" value="1" type="number"><button class="plus"></button></div></td>';
      }
      tableContent += '<td><button type="button" class="addToCart btn btn-sm btn-info">Agregar</button></td>';
      tableContent += '</tr>';
    });
    // Inject the whole content string into our existing HTML table
    $('.modal-body #searchTableModal tbody').html(tableContent);
  });
};

function addService(event) {
  console.log('the stock location')
  console.log(document.querySelector('.custom-select').value);
    // If it is, compile all user info into one object
    const service_amount = {
        'service':$(this).parent().parent().find("small").attr("alt"),
        'addAmount': parseInt($(this).parent().parent().find(".quantity").val()),
        'mode':'normal',
        'location':  document.querySelector('.custom-select').value,
        'moneyBoxId':document.querySelector('#moneyBox').value
    }
    const self = this;
    // Use AJAX to post the object to our adduser service
    $.ajax({
    method: 'POST',
    data: service_amount,
    url: `/patients/${patient_id}/accountCart`,
    dataType: 'JSON',
    }).done(function( response ) {
    // Check for successful (blank) response
    const uniqueStr = Math.random().toString(36).substring(7);
    if (response.msg === 'True') {
        // Clear the form inputs
        let flashMessage = `<div class="alert alert-success alert-dismissible fade show fixed-top" role="alert">
        ${response.serviceName} agregado a cuenta de ${response.patientName}
        <button type="button" id = flashMessage${uniqueStr} class="closeAlert" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
        </div> `;
        if ( $( "#searchTableModal tr" ).length ) {
            $(".modal").prepend(flashMessage);
            $("#account-table"). load(" #account-table > *")
            
        }else{
            $("main").prepend(flashMessage);
            $("#account-table"). load(" #account-table > *")
        }
        setInterval(function(){$(`#flashMessage${uniqueStr}`).click()},3000);

    }
    else {
        // If something goes wrong, alert the error message that our service returned
        let flashMessage = `<div class="alert alert-danger alert-dismissible fade show fixed-top" role="alert">
        Error: No hay suficientes unidades de ${response.serviceName} en almacen
        <button type="button" id = "flashMessage${uniqueStr}" class="closeAlert" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
        </div> `;
        if ( $( "#searchTableModal tr" ).length ) {
            $(".modal").prepend(flashMessage);
        }else{
            $("main").prepend(flashMessage);
        }
        setInterval(function(){$(`#flashMessage${uniqueStr}`).click()},3000);
    }
  });
};


function addServicePistol(event,id) {
  event.preventDefault();
  console.log('located')
  console.log(document.querySelector('.custom-select').value);
  // If it is, compile all user info into one object
  const service_amount = {
      'service':id,
      'addAmount': 1,
      'mode':'pistol',
        'moneyBoxId':document.querySelector('#moneyBox').value,
      'location':document.querySelector('.custom-select').value,
  }
  console.log('about to add from pistol')
  console.log(service_amount)
  const self = this;
  // Use AJAX to post the object to our adduser service
  $.ajax({
  method: 'POST',
  data: service_amount,
  url: `/patients/${patient_id}/accountCart`,
  dataType: 'JSON',
  }).done(function( response ) {
  // Check for successful (blank) response
  const uniqueStr = Math.random().toString(36).substring(7);
  if (response.msg === 'True') {
      // Clear the form inputs
      let flashMessage = `<div class="alert alert-success alert-dismissible fade show fixed-top" role="alert">
      ${response.serviceName} agregado a cuenta de ${response.patientName}
      <button type="button" id = flashMessage${uniqueStr} class="closeAlert" data-dismiss="alert" aria-label="Close">
          <span aria-hidden="true">&times;</span>
      </button>
      </div> `;
      if ( $( "#searchTableModal tr" ).length ) {
          $(".modal").prepend(flashMessage);
          $("#account-table"). load(" #account-table > *")
          
      }else{
          $("main").prepend(flashMessage);
          $("#account-table"). load(" #account-table > *")
      }
      setInterval(function(){$(`#flashMessage${uniqueStr}`).click()},3000);

  }
  else {
      // If something goes wrong, alert the error message that our service returned
      let flashMessage = `<div class="alert alert-danger alert-dismissible fade show fixed-top" role="alert">
      Error: No hay suficientes unidades de ${response.serviceName} en almacen
      <button type="button" id = "flashMessage${uniqueStr}" class="closeAlert" data-dismiss="alert" aria-label="Close">
          <span aria-hidden="true">&times;</span>
      </button>
      </div> `;
      if ( $( "#searchTableModal tr" ).length ) {
          $(".modal").prepend(flashMessage);
      }else{
          $("main").prepend(flashMessage);
      }
      setInterval(function(){$(`#flashMessage${uniqueStr}`).click()},3000);
  }
});
};

//delete Item from patient account
function removeService(event) {
    event.preventDefault();
    let confirmation = confirm('Borrar el servicio de la cuenta del paciente?');
  // Check and make sure the user confirmed
    if (confirmation === true) {
        // If they did, do our delete
        $.ajax({
        type: 'DELETE',
        url: `/patients/${patient_id}/accountCart`,
        data: {
            'serviceID': $(this).parent().parent().parent().find(".item-name").attr("alt"),
            'trans_id': $(this).parent().parent().parent().find("#transID").attr("alt"),
            'amount': parseInt($(this).parent().parent().parent().find(".item-amount").text()),
            'begin':makeYMD(new Date(JSON.parse(beginD))),
            'end':makeYMD(new Date(JSON.parse(endD))),
            'moneyBoxId':document.querySelector('#moneyBox').value

          }
        }).done(function(response) {
            //refresh table
            $("#account-table"). load(" #account-table > *")
        });

    }
    else {
        // If they said no to the confirm, do nothing
        return false;
    }
};


$(document).ready(function() {
  $('#department').change(function() {
      // This function will be called every time a .custom-select element changes
      stockLocationUpdate();
  });

  $('#moneyBox').change(function() {
    // This function will be called every time a .custom-select element changes
    moneyBoxUpdate();
  });
});


//Edit stock Location:
function stockLocationUpdate(event) {
  console.log('called')
      // send update request
      $.ajax({
        type: 'PUT',
        url: `/stockLocationUpdate`,
        data: {
          'stockLocation':document.querySelector('#department').value,
        },
        dataType: 'JSON',
      }).done(function(response){
        const uniqueStr = Math.random().toString(36).substring(7);
        if (response.msg === 'True') {
          let flashMessage = `<div class="alert alert-success alert-dismissible fade show fixed-top" role="alert">
          Ubicacion de stock actualizada
          <button type="button" id = flashMessage${uniqueStr} class="closeAlert" data-dismiss="alert" aria-label="Close">
              <span aria-hidden="true">&times;</span>
          </button>
          </div> `;
          $("main").prepend(flashMessage);
          $("#account-table").fadeOut("fast").load(" #account-table > *").fadeIn('slow');
          setInterval(function(){$(`#flashMessage${uniqueStr}`).click()},3000);
      }
      else {
          // If something goes wrong, alert the error message that our service returned
          let flashMessage = `<div class="alert alert-danger alert-dismissible fade show fixed-top" role="alert">
          No se pudo actualizar la ubicacion del stock
          <button type="button" id = "flashMessage${uniqueStr}" class="closeAlert" data-dismiss="alert" aria-label="Close">
              <span aria-hidden="true">&times;</span>
          </button>
          </div> `;
          $("main").prepend(flashMessage);
          $("#account-table").fadeOut("fast").load(" #account-table > *").fadeIn('slow');
          setInterval(function(){$(`#flashMessage${uniqueStr}`).click()},3000);
      }

      });
};


function moneyBoxUpdate(event) {
      // send update request
      $.ajax({
        type: 'PUT',
        url: `/moneyBoxUpdate`,
        data: {
          'moneyBoxId':document.querySelector('#moneyBox').value,
        },
        dataType: 'JSON',
      }).done(function(response){
        const uniqueStr = Math.random().toString(36).substring(7);
        if (response.msg === 'True') {
          let flashMessage = `<div class="alert alert-success alert-dismissible fade show fixed-top" role="alert">
          Apartado actualizado
          <button type="button" id = flashMessage${uniqueStr} class="closeAlert" data-dismiss="alert" aria-label="Close">
              <span aria-hidden="true">&times;</span>
          </button>
          </div> `;
          $("main").prepend(flashMessage);
          $("#account-table").fadeOut("fast").load(" #account-table > *").fadeIn('slow');
          setInterval(function(){$(`#flashMessage${uniqueStr}`).click()},3000);
      }
      else {
          // If something goes wrong, alert the error message that our service returned
          let flashMessage = `<div class="alert alert-danger alert-dismissible fade show fixed-top" role="alert">
          No se pudo actualizar el apartado
          <button type="button" id = "flashMessage${uniqueStr}" class="closeAlert" data-dismiss="alert" aria-label="Close">
              <span aria-hidden="true">&times;</span>
          </button>
          </div> `;
          $("main").prepend(flashMessage);
          $("#account-table").fadeOut("fast").load(" #account-table > *").fadeIn('slow');
          setInterval(function(){$(`#flashMessage${uniqueStr}`).click()},3000);
      }
      });
};





//edit item from patients account
function editService(event) {
  event.preventDefault();
  let preVal = $(this).parent().parent().parent().find(".item-amount").text();
  $(this).parent().parent().parent().find(".item-amount").replaceWith( `<input type = "number" value = "${preVal}" class = "amountEdit">` );
  $(this).parent().parent().parent().find(".buttons").replaceWith( `<span class = "float-right buttons">
          <button type="button"  class="accept-item btn btn-sm mr-4 btn-outline-success">Aceptar</button></span>` );
};


//submit edit form with new vlaues after clicking accept
function submitEditService(event) {
  event.preventDefault();
      // send update request
      $.ajax({
        type: 'PUT',
        url: `/patients/${patient_id}/accountCart`,
        data: {
          'serviceID': $(this).parent().parent().parent().find(".item-name").attr("alt"),
          'trans_id': $(this).parent().parent().parent().find("#transID").attr("alt"),
          'amount': parseInt($(this).parent().parent().parent().find(".amountEdit").val()),
          'begin':makeYMD(new Date(JSON.parse(beginD))),
          'end':makeYMD(new Date(JSON.parse(endD))),        
          'moneyBoxId':document.querySelector('#moneyBox').value
        },
        dataType: 'JSON',
      }).done(function(response){
        const uniqueStr = Math.random().toString(36).substring(7);
        if (response.msg === 'True') {
          let flashMessage = `<div class="alert alert-success alert-dismissible fade show fixed-top" role="alert">
          ${response.serviceName} editado en cuenta de ${response.patientName}
          <button type="button" id = flashMessage${uniqueStr} class="closeAlert" data-dismiss="alert" aria-label="Close">
              <span aria-hidden="true">&times;</span>
          </button>
          </div> `;
          $("main").prepend(flashMessage);
          $("#account-table").fadeOut("fast").load(" #account-table > *").fadeIn('slow');
          setInterval(function(){$(`#flashMessage${uniqueStr}`).click()},3000);
      }
      else {
          // If something goes wrong, alert the error message that our service returned
          let flashMessage = `<div class="alert alert-danger alert-dismissible fade show fixed-top" role="alert">
          Error: No hay suficientes unidades de ${response.serviceName} en almacen
          <button type="button" id = "flashMessage${uniqueStr}" class="closeAlert" data-dismiss="alert" aria-label="Close">
              <span aria-hidden="true">&times;</span>
          </button>
          </div> `;
          $("main").prepend(flashMessage);
          $("#account-table").fadeOut("fast").load(" #account-table > *").fadeIn('slow');
          setInterval(function(){$(`#flashMessage${uniqueStr}`).click()},3000);
      }

      });
};


//DISCOUNT
function submitDiscount(event,data) {
  console.log('called submit discount'); // Add this line to check if the function execution completes

      $.ajax({
        type: 'PUT',
        url: `/patients/${patient_id}/updateDiscount`,
        data: data,
        dataType: 'JSON',
      }).done(function(response){
        const uniqueStr = Math.random().toString(36).substring(7);
        if (response.msg === 'True') {
          let flashMessage = `<div class="alert alert-success alert-dismissible fade show fixed-top" role="alert">
          Descuento agregado a ${response.serviceName} en cuenta de ${response.patientName}
          <button type="button" id = flashMessage${uniqueStr} class="closeAlert" data-dismiss="alert" aria-label="Close">
              <span aria-hidden="true">&times;</span>
          </button>
          </div> `;
          $("main").prepend(flashMessage);
          $("#account-table").fadeOut("fast").load(" #account-table > *").fadeIn('slow');
          setInterval(function(){$(`#flashMessage${uniqueStr}`).click()},3000);
      }
      else {
          let flashMessage = `<div class="alert alert-danger alert-dismissible fade show fixed-top" role="alert">
          Error: No se pudo agregar el descuento a ${response.serviceName} 
          <button type="button" id = "flashMessage${uniqueStr}" class="closeAlert" data-dismiss="alert" aria-label="Close">
              <span aria-hidden="true">&times;</span>
          </button>
          </div> `;
          $("main").prepend(flashMessage);
          $("#account-table").fadeOut("fast").load(" #account-table > *").fadeIn('slow');
          setInterval(function(){$(`#flashMessage${uniqueStr}`).click()},3000);
      }

      }).fail(function(jqXHR, textStatus, errorThrown) {
        console.log('AJAX request failed:', errorThrown);
      }).always(function() {
        // This block will execute regardless of success or failure
        // ...
      });
      console.log('submitDiscount function executed'); // Add this line to check if the function execution completes

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
$(document).on("click", "tbody .plus2", function() {
  const quantityInput = $(this).parent().children(".quantity");
  const currentValue = parseInt(quantityInput.val());
  if (currentValue + 1 < 999) {
    quantityInput.val(currentValue + 1);
    const discountButton = $(this).closest("td").find(".discount-button");
    // Set the toggle to inactive
    discountButton.removeClass("btn-discount-inactive btn-secondary");
    discountButton.addClass("btn-discount-active btn-primary");
    discountButton.html('<i class="fas fa-paper-plane"></i>'); 
  }
});


$(document).on("click", ".quantity", function() {
  const discountButton = $(this).closest("td").find(".discount-button");
  // Set the toggle to inactive
  discountButton.removeClass("btn-discount-inactive btn-secondary");
  discountButton.addClass("btn-discount-active btn-primary");
  discountButton.html('<i class="fas fa-paper-plane"></i>'); 
});

function toggleDiscount(discountButton) {
  const quantityValue = $(discountButton).closest("td").find(".quantity").val();
  const trans_id = $(discountButton).closest("td").parent().find("#transID").attr("alt");

  data = {
    'trans_id': trans_id,
    'discount': quantityValue,
    'begin':makeYMD(new Date(JSON.parse(beginD))),
    'end':makeYMD(new Date(JSON.parse(endD))),

  }
  const isActive = discountButton.classList.contains("btn-discount-active");
  if (isActive) {
    discountButton.classList.remove("btn-discount-active", "btn-success");
    discountButton.classList.add("btn-discount-inactive", "btn-secondary");

    discountButton.innerHTML = '<i class="fas fa-cog"></i>'; // change icon when inactive
    submitDiscount(event,data);
    // stop barcode scanning when inactive
  } 
}

function submitEditTimeService(event) {
  // event.preventDefault();
        // send update request
      let tog = !($(this).parent().parent().parent().find("#until").attr("alt") =="true")
      let st = $(this).parent().parent().parent().find("#start").val(),
          en = $(this).parent().parent().parent().find("#until").val();
      $.ajax({
        type: 'PUT',
        url: `/patients/${patient_id}/serviceTime`,
        data: {
          'serviceID': $(this).parent().parent().parent().find(".item-name").attr("alt"),
          'trans_id': $(this).parent().parent().parent().find("#transID").attr("alt"),
          'amount': parseInt($(this).parent().parent().parent().find(".item-amount").val()),
          'start':st,
          'until':en,
          'toggle': tog
        },
        dataType: 'JSON',
      }).done(function(response){
        const uniqueStr = Math.random().toString(36).substring(7);
        if (response.msg === 'True') {
          let flashMessage = `<div class="alert alert-success alert-dismissible fade show fixed-top" role="alert">
          ${response.serviceName} fijado
          <button type="button" id = flashMessage${uniqueStr} class="closeAlert" data-dismiss="alert" aria-label="Close">
              <span aria-hidden="true">&times;</span>
          </button>
          </div> `;
          $("main").prepend(flashMessage);
          $(".timeBody").fadeOut("fast").load(" .timeBody > *").fadeIn('slow');
          setInterval(function(){$(`#flashMessage${uniqueStr}`).click()},3000);
      }
      else {
          // If something goes wrong, alert the error message that our service returned
          let flashMessage = `<div class="alert alert-danger alert-dismissible fade show fixed-top" role="alert">
          Error: ${response.serviceName} no se pudo fijar
          <button type="button" id = "flashMessage${uniqueStr}" class="closeAlert" data-dismiss="alert" aria-label="Close">
              <span aria-hidden="true">&times;</span>
          </button>
          </div> `;
          $("main").prepend(flashMessage);
          $(".timeBody").fadeOut("fast").load(" .timeBody > *").fadeIn('slow');
          setInterval(function(){$(`#flashMessage${uniqueStr}`).click()},3000);
      }

      });
};


function submitTimeServ(event) {
  let st = new Date($(this).parent().parent().find("#start").val()),
      en = new Date($(this).parent().parent().find("#until").val());
  if(st<en){
    event.preventDefault();  
        $.ajax({
          type: 'PUT',
          url: `/patients/${patient_id}/serviceTime`,
          data: {
            'serviceID': $(this).parent().parent().find(".item-name").attr("alt"),
            'trans_id': $(this).parent().parent().find("#transID").attr("alt"),
            'amount': parseInt($(this).parent().parent().find(".item-amount").val()),
            'start':$(this).parent().parent().find("#start").val(),
            'until':$(this).parent().parent().find("#until").val(),
            'toggle':$(this).parent().parent().find("#until").attr("alt")
          },
          dataType: 'JSON',
        }).done(function(response){
          const uniqueStr = Math.random().toString(36).substring(7);
          if (response.msg === 'True') {
            let flashMessage = `<div class="alert alert-success alert-dismissible fade show fixed-top" role="alert">
            ${response.serviceName} editado en cuenta de ${response.patientName}
            <button type="button" id = flashMessage${uniqueStr} class="closeAlert" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
            </div> `;
            $("main").prepend(flashMessage);
            $(".timeBody").fadeOut("fast").load(" .timeBody > *").fadeIn('slow');
            setInterval(function(){$(`#flashMessage${uniqueStr}`).click()},3000);
        }
        else {
            // If something goes wrong, alert the error message that our service returned
            let flashMessage = `<div class="alert alert-danger alert-dismissible fade show fixed-top" role="alert">
            Error: No hay suficientes unidades de ${response.serviceName} en almacen
            <button type="button" id = "flashMessage${uniqueStr}" class="closeAlert" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
            </div> `;
            $("main").prepend(flashMessage);
            $(".timeBody").fadeOut("fast").load(" .timeBody > *").fadeIn('slow');
            setInterval(function(){$(`#flashMessage${uniqueStr}`).click()},3000);
        }

        });
  }else{
    const uniqueStr = Math.random().toString(36).substring(7);
    let flashMessage = `<div class="alert alert-danger alert-dismissible fade show fixed-top" role="alert">
            Las fecha de inicio es menor que la fecha de termino
            <button type="button" id = "flashMessage${uniqueStr}" class="closeAlert" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
            </div> `;
            $("main").prepend(flashMessage);
            setInterval(function(){$(`#flashMessage${uniqueStr}`).click()},3000);

  }
};

//refresh page with new query values
function updateDate(){
  window.location.href = window.location.pathname+"?"+$.param({
    'begin': $("#beginDate").val(),
    'bH':$("#beginHour").val(),
    'end': $("#endDate").val(),
    'eH':$("#endHour").val()
  })
}

// var qrcode = new QRCode(document.getElementById("test"), {
//   text: "http://jindo.dev.naver.com/collie",
//   width: 128,
//   height: 128,
//   colorDark : "#000000",
//   colorLight : "#ffffff",
//   correctLevel : QRCode.CorrectLevel.H
// });

// new QRCode(document.getElementById("test"), "http://jindo.dev.naver.com/collie");



