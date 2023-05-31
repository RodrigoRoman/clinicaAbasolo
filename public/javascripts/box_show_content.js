// let exitsActive  = JSON.parse(box.exitsActive);

var printer;
function numberCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function makeDMY(date){
    const newDate = {d:date.getUTCDate(), m : date.getUTCMonth()+1,// JavaScript months are 0-11
    y : date.getUTCFullYear()};
    return  ((newDate.d.toString().length>1)?newDate.d:"0"+newDate.d)+ "/" + newDate.m+ "/" + newDate.y;
  }
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


  function makeHour(date){
    const newDate = {d:date.getUTCDate(), m : date.getUTCMonth()+1,// JavaScript months are 0-11
    y : date.getUTCFullYear(),h:date.getUTCHours(), min:(((""+date.getUTCMinutes()).length>1)?date.getUTCMinutes():"0"+date.getUTCMinutes())};
    return  (newDate.h+":"+newDate.min);
  }



function makeCut(boxId) {
    // Perform an AJAX request or redirect to the '/makeCut/:id' route using the boxId value
    // Example AJAX request with jQuery:
    $.ajax({
      url: `/exits/makeCut/${boxId}`,
      method: 'PUT',
      success: function (response) {
        // Handle the response after the cut is made
        window.location.reload();
        // Retrieve and display the flash message
        let flashMessage = `<div class="alert alert-success alert-dismissible fade show fixed-top" role="alert">
        Corte realizado correctamente
        <button type="button" id = flashMessage${2323} class="closeAlert" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
        </div> `;
        $("main").prepend(flashMessage);
        
      },
      error: function (error) {
        // Handle any error that occurred during the request
      }
    });
  }






 async function printCut() {
    // Handle the printing of a specific transaction here
console.log('TRANSACTIONS FROM PRINT TICKET FUNCTION');
  serviceUuid = 'e7810a71-73ae-499d-8c15-faa9aef0c3f2';
  characteristicUuid = 'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f';
  deviceKey = 'lastUsedDevice'; // Key for storing the device address
  const encoder = new TextEncoder();

  printData1 = new Uint8Array([
    0x1B, 0x40, // Initialize the printer
    0x1B, 0x21, 0x20, // Set the font size to double height
    0x1B, 0x61, 0x01, // Align text to center
    ...encoder.encode(`          ${box.name}`),
  ]);

  let receiptContent = '';

  // Print the transactionsActive table
  receiptContent += '              ' + 'Ingresos'+ '\n';
  receiptContent += '           _______________\n\n';
  receiptContent += 'Nombre\n         Cantidad     Precio    - %    Total\n';
  receiptContent += '____________________________________________\n';

  box.transactionsActive.forEach(function (item, index) {
    const subtotal = item.amount * item.service.price;
    let discountedTotal =0;
    if (item.service.service_type == 'supply') {
        let price = item.service.sell_price
        discountedTotal =     (item.amount*(price-(price*(item.discount*0.01)))).toFixed(2)

      receiptContent +=
        `${item.service.name.padEnd(15)}\n            ${item.amount.toString().padEnd(8)} $${item.service.sell_price.toString().padEnd(8)} %${item.discount.toString().padEnd(5)} $${discountedTotal.toString().padEnd(8)}\n`;
    } else {
        let price = item.service.price
        discountedTotal =     (item.amount*(price-(price*(item.discount*0.01)))).toFixed(2)
      receiptContent +=
        `${item.service.name.padEnd(15)}\n            ${item.amount.toString().padEnd(8)} $${item.service.price.toString().padEnd(8)} %${item.discount.toString().padEnd(5)} $${discountedTotal.toString().padEnd(8)}\n`;
    }
  });

  // Add a line break between the two tables
  receiptContent += '\n';
  receiptContent += '              ' + 'Salidas'+ '\n';
  receiptContent += '           _____________\n\n';
  // Print the exitsActive table
  receiptContent += 'Nombre\n              Categoria            Total\n';
  receiptContent += '____________________________________________\n';

  box.exitsActive.forEach(function (exit) {
    receiptContent +=
      `${exit.name.padEnd(17)}\n            ${exit.category.padEnd(15)}  $${exit.moneyAmount.toString().padEnd(8)}\n`;
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
   ...encoder.encode('    _____________          ______________   '),
   ...encoder.encode('            Recibe                  Entrega      '),

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


  document.getElementById('printBtn').addEventListener('click', function () {
    printCut();
  });





function rebuildTables() {
    // Perform an AJAX request or redirect to the '/makeCut/:id' route using the boxId value
    // Example AJAX request with jQuery:
    let currentRequest = null;

    const data = {
        'search':$("#search_val").val(),
        'begin':$('#beginDate').val(),
        'end':$('#endDate').val(),
        'transactionSort':$('#transactionSort').val(),
        'exitSort':$('#exitSort').val(),
    };
    console.log('data to be sent')
    console.log(data)

    let tables = '';
    
    $.ajax({
      url: `/exits/boxRebuild/${box._id}`,
      method: 'GET',
      data: data,
      dataType: 'JSON',
      processData: true,
      beforeSend : function()    {          
        if(currentRequest != null) {
            currentRequest.abort();
        }
      },
      cache: false
    }).done(function( response ){
        box = response.box;
        historyExits = response.historyExits;
        historyTransactions= response.historyTransactions;

        console.log('these are the boxes!')
        console.log(box)
        tables += `
        <div class="table-container">
        <div class="pop-up-container">
                <p class="display-3 font-weight-bold text-center" style="font-family: Helvetica, Arial, sans-serif; color: #90EE90; text-transform: uppercase; letter-spacing: 2px;  font-size: 20px">Ingresos actuales</p> 
            </div>
            <table class="table  table-success">
                <thead class="thead-primary">
                    <tr>
                        <th>Nombre        </th>
                        <th>Agregado por</th>
                        <th>Fecha-Hora</th>
                        <th>Cantidad</th>
                        <th>Precio</th>
                        <th>Descuento</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>`
                totalCurrentIncome = 0;
                     box.transactionsActive.forEach(transaction => {
                         console.log('transaction from history')
                         console.log(transaction);
                        tables += `
                        <tr>
                            <td>${ transaction.service.name}</td>
                            <td>${ transaction.addedBy.username }</td>
                            <td>${ new Date(transaction.consumtionDate).toISOString().substr(0,10)} a las ${makeHour(new Date(transaction.consumtionDate))}</td>
                            <td>${ transaction.amount}</td>`;
                            if(transaction.service.service_type == 'supply'){
                               tables +=` <td>$${  transaction.service.sell_price }</td>
                                <td>%${  transaction.discount}</td>
                                <td>$${  (transaction.amount*(transaction.service.sell_price-(transaction.service.sell_price*transaction.discount *0.01))).toFixed(2)}</td>`
                                totalCurrentIncome+=transaction.amount*(transaction.service.sell_price-(transaction.service.sell_price*transaction.discount *0.01))

                            }else{
                                table += `
                                <td>$${  transaction.service.price }</td>
                                <td>%${  transaction.discount }</td>
                                <td>$${(transaction.amount*(transaction.service.price-(transaction.service.price*transaction.discount *0.01))).toFixed(2) }</td>`
                                totalCurrentIncome+=transaction.amount*(transaction.service.price-(transaction.service.price*transaction.discount *0.01))
                            }
                    tables+=`
                        </tr>`;
                    }); 
                tables += `
                <tr>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td><b>Total:</b></td>
                    <td><b>$${numberCommas(totalCurrentIncome.toFixed(2))}</b></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="table-container">
        <div class="pop-up-container">
                <p class="display-3 font-weight-bold text-center" style="font-family: Helvetica, Arial, sans-serif; color: #FF7F7F; text-transform: uppercase; letter-spacing: 2px;  font-size: 20px">Egresos actuales</p> 
            </div>
            <table class="table table-danger">
                <thead>
                    <tr>
                        <th>Nombre      </th>
                        <th>Categoria   </th>
                        <th>Usuario</th>
                        <th>Fecha-Hora</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>`;
                totalCurrentExits = 0
                   box.exitsActive.forEach(exit => {
                       console.log('EXXX');
                       console.log(exit)
                       tables += `
                        <tr>
                            <td>${exit.name}</td>
                            <td>${ exit.category }</td>
                            <td>${ exit.author.username}</td>
                            <td>${ new Date(exit.clearDate).toISOString().substr(0,10)} a las ${makeHour(new Date(exit.clearDate))}</td>
                            <td>$${exit.moneyAmount}</td>
                        </tr>`
                        totalCurrentExits+=exit.moneyAmount
                    });
                    tables += `
                    <tr>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td><b>Total:</b></td>
                    <td><b>$${totalCurrentExits}</b></td>
                    </tr>
                </tbody>
            </table>
        </div>


        <div class="table-container">
        <div class="pop-up-container">
                <p class="display-3 font-weight-bold text-center" style="font-family: Helvetica, Arial, sans-serif; color: #90EE90; text-transform: uppercase; letter-spacing: 2px;  font-size: 20px">Historial de ingresos</p> 
            </div>

            <table class="table table-light">
                <thead class="theady">
                    <tr>
                        <th>Nombre        </th>
                        <th>Usuario</th>
                        <th>Fecha-Hora</th>
                        <th>Cantidad</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                `;   totalHistoryIncome =0;
                     response.historyTransactions.forEach(transaction => {
                         console.log('transaction from history')
                         transSort = $('#transactionSort').val();

                        tables += `
                        <tr>
                            <td>${(transSort!='_id')?transaction.name:transaction.service.name}</td>
                            <td>${transaction.user.username}</td>
                            <td>${new Date(transaction.consumtionDate).toISOString().substr(0,10)} a las ${makeHour(new Date(transaction.consumtionDate))}</td>
                            <td>${transaction.amount }</td>
                            <td>$${ transaction.total}</td>
                        </tr>`;
                        totalHistoryIncome+=transaction.total;
                    }); 
                tables += `
                <tr>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td><b>Total:</b></td>
                    <td><b>$${totalHistoryIncome}</b></td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="table-container">
        <div class="pop-up-container">
        <p class="display-3 font-weight-bold text-center" style="font-family: Helvetica, Arial, sans-serif; color: #FF7F7F; text-transform: uppercase; letter-spacing: 2px;  font-size: 20px">Historial de Egresos</p> 
    </div>
            <table class="table table-dark ">
                <thead>
                    <tr>`
                    if(data.exitSort != 'category'){
                        tables += `<td>Nombre</td>`
                    }
                    tables += `
                        <th>Categoria   </th>
                        <th>Usuario</th>
                        <th>Fecha-Hora</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                `
                totalHistoryExits = 0
                response.historyExits.forEach(exit => { 
                        tables += `<tr>`
                        if(data.exitSort != 'category'){
                            tables += `<td>${exit.name }</td>`
                        }
                        tables += `
                            <td>${exit.category }</td>
                            <td>${exit.user.username}</td>
                            <td>${new Date(exit.clearDate).toISOString().substr(0,10)} a las ${makeHour(new Date(exit.clearDate))}</td>
                            <td>$${exit.total}</td>
                        </tr>`
                        totalHistoryExits+=parseFloat(exit.total)
                     });
                    tables += `
                    <tr>
                    <td></td>
                    <td></td>
                    <td><b>Total:</b></td>
                    <td><b>$${totalHistoryExits}</b></td>
                    </tr>
                </tbody>
            </table>
        </div>`;
       $('#contentTables').html(tables);  
    //    $("#search_val").val(response.search)
  });
  }


  $(document).ready(function() {
    $('#transactionSort').change(function() {
        // This function will be called every time a .custom-select element changes
        rebuildTables();
    });
    $('#exitSort').change(function() {
        // This function will be called every time a .custom-select element changes
        rebuildTables();
    });
    // refillOrder();
});



async function printHistory() {
    // Handle the printing of a specific transaction here
console.log('TRANSACTIONS FROM PRINT TICKET FUNCTION');
  serviceUuid = 'e7810a71-73ae-499d-8c15-faa9aef0c3f2';
  characteristicUuid = 'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f';
  deviceKey = 'lastUsedDevice'; // Key for storing the device address
  const encoder = new TextEncoder();

  printData1 = new Uint8Array([
    0x1B, 0x40, // Initialize the printer
    0x1B, 0x21, 0x20, // Set the font size to double height
    0x1B, 0x61, 0x01, // Align text to center
    ...encoder.encode(`          ${box.name}`),
  ]);

  let receiptContent = '';

  // Print the transactionsActive table
  receiptContent += '              ' + 'Ingresos'+ '\n';
  receiptContent += '           _______________\n\n';
  receiptContent += 'Nombre\n                Cantidad         Total\n';
  receiptContent += '____________________________________________\n';
  transSort = $('#transactionSort').val();
  historyTransactions.forEach(function (item, index) {
    const subtotal = item.amount * item.service.price;
    let discountedTotal =0;
    receiptContent +=
        `${(transSort!='_id')?item.name.padEnd(20):item.service.name.padEnd(20)}\n                   ${item.amount.toString().padEnd(5)}       $${item.total.toString().padEnd(8)}\n`;
    
  });

  // Add a line break between the two tables
  receiptContent += '\n';
  receiptContent += '              ' + 'Salidas'+ '\n';
  receiptContent += '           _____________\n\n';
  // Print the exitsActive table
  receiptContent += 'Nombre\n               Categoria         Total\n';
  receiptContent += '____________________________________________\n';

  historyExits.forEach(function (exit) {
    receiptContent +=
      `${exit.name.padEnd(20)}\n             ${exit.category.padEnd(15)}  $${exit.total.toString().padEnd(8)}\n`;
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
   ...encoder.encode('    _____________          ______________   '),
   ...encoder.encode('            Recibe                  Entrega      '),

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


  document.getElementById('printBtn').addEventListener('click', function () {
    printCut();
  });


  document.getElementById('printHistory').addEventListener('click', function () {
    printHistory();
  });


//   async function generatePDF() {
//     let currentRequest = null;

//     $.ajax({
//         url: `/exits/reportPdf/${box._id}`,
//         method: 'GET',
//         dataType: 'JSON',
//         processData: true,
//         beforeSend : function()    {          
//           if(currentRequest != null) {
//               currentRequest.abort();
//           }
//         },
//         cache: false
//       }).done(function( response ){});
//   }
$(document).ready(function() {

$('#genPDf').click(generatePDF)

function generatePDF() {
    console.log('generate llamado');
    console.log(document.getElementById('contentTables').innerHTML);
  fetch('https://clinicasanromanadmin-production.up.railway.app/exits/generate-pdf-account', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: document.getElementById('contentTables').innerHTML, // Get the content of your div
    }),
  })
  .then(response => response.blob())
  .then(blob => {
    // Create a blob URL and download the file
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${nDate.toISOString()}.pdf`;
    a.click();
  })
  .catch(error => console.error('Error:', error));
}
})