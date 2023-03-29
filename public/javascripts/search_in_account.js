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




async function printTicket() {
   serviceUuid = 'e7810a71-73ae-499d-8c15-faa9aef0c3f2';
   characteristicUuid = 'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f';


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
servicesText = servicesCar
  .map(service=>{
         sell = service.service.type === 'Supply' ? service.service.sell_price : service.service.price;
    nameParts = service.service.name.match(/.{1,34}\b/g);
     nameServ = nameParts[0]+'\n';
     price = parseFloat(sell).toLocaleString("en-US").padStart(17, ' ');
     subtotal1 = parseFloat((sell * service.amount)).toLocaleString("en-US").padStart(3, ' ');
     amount = service.amount.toString().padStart(0, ' ');
    //  lines = nameParts.slice(1).map(line => line.padStart(30 + line.length / 2, ' ').padEnd(30, ' '));
     nameWithLines = [nameServ, nameServ].join('\n');
    return `${nameServ}${price}  ${amount}  ${subtotal1}`;
}).join('\n');

// Column names
header = `Nombre       $  X   ST   `;
divider = '-'.repeat(28);

// Combine header, services text and divider
// ticketText = `${header}\n${divider}\n${servicesText}\n${divider}`;
ticketText = `${header}${servicesText}`;

  
const subtotal = servicesCar.reduce((total, service) =>{ 
  sell2 = service.service.type === 'Supply' ? service.service.sell_price : service.service.price;
  return total + (sell2 * service.amount)}, 0);
total = subtotal.toLocaleString("en-US");
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
  // `${servicesText}`, // Print services text
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
  0x1D, 0x56, 0x41, 0x10
]);

var printData = new Uint8Array([...printData1,...printData2]);
  
  try {
    // Request Bluetooth device
    const device = await navigator.bluetooth.requestDevice({
      filters: [
        { name: 'Printer001' }
      ],
      optionalServices: [serviceUuid]
    });

    // Connect to the GATT server
    const server = await device.gatt.connect();

    // Get the service
    const service = await server.getPrimaryService(serviceUuid);

    // Get the characteristic
    const characteristic = await service.getCharacteristic(characteristicUuid);

    // Send the print command
    const encoder = new TextEncoder();
    await characteristic.writeValue(printData);

    // Disconnect from the GATT server
    await server.disconnect();
  } catch (error) {
    console.error(error);
  }
}


 

  // socket.addEventListener('open', function (event) {
  //   console.log('WebSocket connection established');
  // });
  
  // socket.addEventListener('message', function (event) {
  //   console.log('Message from server:', event.data);
  // });
  
  // socket.addEventListener('close', function (event) {
  //   console.log('WebSocket connection closed');
  // });
  
  

// }

// [[[[[[[[[[[[[[ A partir de aqui empieza la impresion del ticket:
// const vendorId =0x1a86; // USB vendor ID for EC Line printers
// const productId = 0x7584; /// USB product ID for EC Line EC-PM-58110 printer


//  printData1 = new Uint8Array([
//   0x1B, 0x40, // Initialize the printer
//   0x1B, 0x21, 0x20, // Set the font size to double height
//   0x1B, 0x61, 0x01, // Align text to center
//   0x43, 0x4C, 0x49, 0x4E, 0x49, 0x43, 0x41, 0x20, 0x41, 0x42, 0x41, 0x53, 0x4F, 0x4C, 0x4F, // CLINICA ABASOLO
//   0x0A, // Print a line feed
//   0x0A, // Print a line feed
//   0x1B, 0x61, 0x01, // Align text to center
//   0x1B, 0x21, 0x00, // Set font size to normal
//   0x43, 0x2E, 0x20, 0x41, 0x62, 0x61, 0x73, 0x6F, 0x6C, 0x6F, 0x20, 0x32, 0x37, 0x2C, // Address line 1: C. Abasolo 27,
//   0x0A, // Print a line feed
//   0x5A, 0x6F, 0x6E, 0x61, 0x20, 0x43, 0x65, 0x6E, 0x74, 0x72, 0x6F, 0x2C, 0x20, 0x33, 0x38, 0x38, 0x30, 0x30, // Address line 2: Zona Centro, 38800
//   0x0A, // Print a line feed
//   0x4D, 0x6F, 0x72, 0x6F, 0x6C, 0x65, 0x6F, 0x6E, 0x2C, 0x20, 0x47, 0x74, 0x6F, 0x2E, // Address line 3: Moroleon, Gto.
//   0x0A, // Print a line feed
//   0x0A, // Print a line feed
//   0x0A, // Print a line feed
//   0x54, 0x65, 0x6C, 0x65, 0x66, 0x6F, 0x6E, 0x6F, 0x3A, 0x20, 0x34, 0x34, 0x35, 0x20, 0x34, 0x35, 0x37, 0x20, 0x34, 0x34, 0x31, 0x37, 0x0A, // "Telefono: 445 457 4417"
  
// ]);

// // Extract data from patient and servicesCar objects
// // const { name, servicesCar } = JSON.parse(pat);
// const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

// patName = JSON.parse(pat).name;
// servicesCar = JSON.parse(pat).servicesCar;
// servicesText = servicesCar
//   .map(service=>{
//          sell = service.service.type === 'Supply' ? service.service.sell_price : service.service.price;
//     nameParts = service.service.name.match(/.{1,34}\b/g);
//      nameServ = nameParts[0]+'\n';
//      price = parseFloat(sell).toLocaleString("en-US").padStart(17, ' ');
//      subtotal1 = parseFloat((sell * service.amount)).toLocaleString("en-US").padStart(3, ' ');
//      amount = service.amount.toString().padStart(0, ' ');
//     //  lines = nameParts.slice(1).map(line => line.padStart(30 + line.length / 2, ' ').padEnd(30, ' '));
//      nameWithLines = [nameServ, nameServ].join('\n');
//     return `${nameServ}${price}  ${amount}  ${subtotal1}`;
// }).join('\n');

// // Column names
// header = `Nombre      | $ | X |   ST   `;
// divider = '-'.repeat(28);

// // Combine header, services text and divider
// ticketText = `${header}${servicesText}\n${divider}`;
  
// const subtotal = servicesCar.reduce((total, service) =>{ 
//   sell2 = service.service.type === 'Supply' ? service.service.sell_price : service.service.price;
//   return total + (sell2 * service.amount)}, 0);
// total = subtotal.toLocaleString("en-US");
// const encoder = new TextEncoder();

// dateNow = getMexicoCityTime()
//  hour = dateNow.getUTCHours(); // Get the hour component of the datetime
//  minutes = dateNow.getUTCMinutes(); // Get the minutes component of the datetime
//   amOrPm = hour >= 12 ? 'PM' : 'AM'; // Determine whether the time is in the AM or PM
//  formattedHour = hour % 12 === 0 ? 12 : hour % 12; // Convert the hour to 12-hour format
//  formattedMinutes = minutes < 10 ? `0${minutes}` : minutes; // Add a leading zero to minutes if necessary
//  formattedTime = `${formattedHour}:${formattedMinutes} ${amOrPm}`; 

// // Add patient name and services to the ticket body
// printData2 = new Uint8Array([
//   0x1B, 0x61, 0x00, // Align text to left
//   0x1B, 0x21, 0x00, // Set the font size to normal
//   0x0A, // Print a line feed
//   ...encoder.encode('      '+dateNow.toLocaleDateString()+' '+formattedTime), 
//   0x0A, // Print a line feed
//   0x0A, // Print a line feed
//   ...encoder.encode(patName),// Print patient name
//   0x0A, // Print a line feed
//   0x0A, // Print a line feed
//   ...encoder.encode(ticketText),
//   // `${servicesText}`, // Print services text
//   0x0A, // Print a line feed
//   0x1B, 0x61, 0x01, // Align text to center
//   0x1B, 0x21, 0x30, // Set font type to B (bold)
//   0x0A, // Print a line feed
//   ...encoder.encode('TOTAL: $'), 
//   ...encoder.encode(total), // Print subtotal
//   0x0A, // Print a line feed
//   0x0A, // Print a line feed
//   ...encoder.encode('Urgencias 24/7'), 
//   0x0A, // Print a line feed
//   0x0A, // Print a line feed
//   0x1D, 0x56, 0x41, 0x10

// ]);

// var printData = new Uint8Array([...printData1,...printData2]);


// window.addEventListener('DOMContentLoaded', async () => {
//   try {
//     // Request permission to access the printer
//     const device = await navigator.usb.requestDevice({ filters: [{ vendorId, productId }] });

//     // Open the printer interface
//     await device.open();
//     await device.selectConfiguration(1);
//     await device.claimInterface(0);

//     // Store permission in cookie or local storage
//     localStorage.setItem('printerPermission', 'granted');

//     // Close the connection to the printer
//     await device.releaseInterface(0);
//     await device.close();
//   } catch (error) {
//     console.error(error);
//   }
// });
// // Define a function to print the text message
// window.addEventListener('DOMContentLoaded', async () => {
//   try {
//     // Request permission to access the printer
//     const device = await navigator.usb.requestDevice({ filters: [{ vendorId, productId }] });

//     // Open the printer interface
//     await device.open();
//     await device.selectConfiguration(1);
//     await device.claimInterface(0);

//     // Store permission in cookie or local storage
//     localStorage.setItem('printerPermission', 'granted');

//     // Close the connection to the printer
//     await device.releaseInterface(0);
//     await device.close();
//   } catch (error) {
//     console.error(error);
//   }
// });
// // Define a function to print the text message
// async function printTicket() {
//   try {
//     // Check if permission has already been granted
//     const devices = await navigator.usb.getDevices();
//     const device = devices.find(d => d.vendorId === vendorId && d.productId === productId);
//     if (device) {
//       // The user has already granted permission to access the printer, proceed with printing
//       await device.open();
//       await device.selectConfiguration(1);
//       await device.claimInterface(0);
//       await device.transferOut(2, printData);
//       await device.releaseInterface(0);
//       await device.close();
//     } else {
//       // Request permission to access the printer
//       const device = await navigator.usb.requestDevice({ filters: [{ vendorId, productId }] });

//       // Open the printer interface
//       await device.open();
//       await device.selectConfiguration(1);
//       await device.claimInterface(0);

//       // Store permission in cookie or local storage
//       localStorage.setItem('printerPermission', 'granted');

//       // Send the print data to the printer
//       await device.transferOut(2, printData);
//       await device.releaseInterface(0);
//       await device.close();
//     }
//   } catch (error) {
//     console.error(error);
//   }
// }

//Aqui termina la parte del ticket ]]]]]]]]]]]

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
function makeYMD(date){
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
        let dateColor = defineBorder(diff_months(new Date(this.expiration) , nDate)/12);
        tableContent += '<td><small alt ='+this._id+' class="text-muted border border-'+dateColor+' px-1 py-1 d-inline-block"> Cad: ' + makeDMY(new Date(this.expiration))+ '</small></td>';
        tableContent += `<td><select class="btn btn-outline-secondary btn-sm custom-select custom-select-sm mt-1" >
        <option selected id="central" value="Central">Central de enfermeria</option>
<option id="urgencias" value="Urgencias">Urgencias</option>
<option id="quirofano" value="Quirofano">Quirofano</option>
<option id="farmacia1" value="Farmacia1">Farmacia1</option>
<option id="farmacia2" value="Farmacia2">Farmacia2</option>
    </select>
      </td>
      `;
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
        let dateColor = defineBorder(diff_months(new Date(this.expiration) , nDate)/12);
        tableContent += '<td><small alt ='+this._id+' class="text-muted border border-'+dateColor+' px-1 py-1 d-inline-block"> Cad: ' + makeDMY(new Date(this.expiration))+ '</small></td>';
        tableContent += `<td>
        <select class="btn btn-outline-secondary custom-select btn-sm custom-select-sm mt-1" >
        <option selected id="central" value="Central">Central de enfermeria</option>
<option id="urgencias" value="Urgencias">Urgencias</option>
<option id="quirofano" value="Quirofano">Quirofano</option>
<option id="farmacia1" value="Farmacia1">Farmacia1</option>
<option id="farmacia2" value="Farmacia2">Farmacia2</option>
    </select>
             </td>
                          `;
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
    event.preventDefault();
    // If it is, compile all user info into one object
    const service_amount = {
        'service':$(this).parent().parent().find("small").attr("alt"),
        'addAmount': parseInt($(this).parent().parent().find(".quantity").val()),
        'location':$(this).parent().parent().find(".custom-select").val(),
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
            'end':makeYMD(new Date(JSON.parse(endD))) 
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
          'end':makeYMD(new Date(JSON.parse(endD))) 
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

function submitEditTimeService(event) {
  event.preventDefault();
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

