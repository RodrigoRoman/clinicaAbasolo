$(document).ready(function() {
    $('#primarySort').change(function() {
        // This function will be called every time a .custom-select element changes
        refillOrder();
    });
    $('#secondarySort').change(function() {
        // This function will be called every time a .custom-select element changes
        refillOrder();
    });
    refillOrder();
});

var transactionsAll;

function abbreviateSentence(sentence) {
    // Split the sentence into words
    let words = sentence.split(" ");

    // Map over the words and return the first two letters of each word
    let abbreviations = words.map(word => word.substr(0, 2));

    // Join the abbreviations together into a single string
    let result = abbreviations.join("");
    return result;
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


// Fill table with data
function refillOrder() {
    console.log('called refillOrder')
    let currentRequest = null;
    const dat = {
        'primarySort':document.getElementById('primarySort').value,
        'secondarySort':document.getElementById('secondarySort').value
    };
    let tablesContent = '';

   $.ajax({
    type: 'GET',
    url: '/exits/refillSearch',
    data: dat,
    dataType: 'JSON',
    processData: true,
    beforeSend : function()    {          
        if(currentRequest != null) {
            currentRequest.abort();
        }
    },
    cache: false
    }).done(function(response) {
        console.log('the response here');
        transactions = response.transactions;
        transactionsAll = transactions;

        for (const index in transactions) {
            // Generate unique id for each print button
            let printButtonId = "printButton" + index;
            property = transactions[index].property
            tablesContent += (`
            <div class="jumbotron style="overflow: auto;"">
                <div class = "m-4 p-4" id="simple_table_${property}">
                <table class="table table-borderless sticky1" >

                                    <thead class="thead-dark">
                                        <tr class="border-bottom border-dark">  
                                            <th scope ="col"><h3></h3></th>
                                            <th scope="col"><h3>${property}</h3></th>  
                                            <th scope="col"><h3></h3></th>
                                        </tr>  
                                    </thead>
                                    <tbody>
                                        <tr> `);
                                        if(response.secondarySort == 'serviceData.name'){
                                            tablesContent+= `<th>Nombre</th> 
                                            <th>Principio</th> 
                                            <th>Cantidad</th>
                                            `
                                        }else{
                                            tablesContent += `<th>Nombre</th> 
                                            <th>Principio</th> 
                                            <th>Cantidad</th>  
                                            <th>Agregado</th>
                                            <th>Usuario</th>
                                            <th>Paciente</th>
                                            <th>Ubication</th>`
                                        }
                                            
            if(response.secondarySort == 'serviceData.name'){
                transactions[index].items.forEach(function (item, index) {
                    tablesContent += (`</tr>
                                            <tr>  
                                                <td>${item.service.name}</td> 
                                                <td>${item.service.principle}</td>  
                                                <td>${item.amount}</td>  
                                            </tr>`);
                });
            }else{
                transactions[index].items.forEach(function (item, index) {
                tablesContent += (`
                                        <tr>  
                                            <td>${item.service.name}</td> 
                                            <td>${item.service.principle}</td>  
                                            <td>${item.amount}</td>  
                                            <td>${makeDMYHour(new Date(item.consumtionDate))}</td>  
                                            <td>${item.addedBy.username}</td> 
                                            <td>${item.patient.name}</td>
                                            <td>${item.location}</td>  

                                        </tr>`);
                
            }
            
        );
        
    }
            tablesContent += (`
                                    </tbody> 
                                </table> 
                                </div>
                               <div class="container">
                                    <div class="row">
                                        <div class="col">
                                            <button id="${printButtonId}" type="button" class="btn btn-primary"><i class="fas fa-print"></i>
                                            </button>
                                            <button type="button" class="btn btn-secondary" onclick="generatePDF('simple_table_${property}')"><i class="fas fa-file-pdf"></i></button>
                                            <button type="button" class="btn btn-danger" onclick="resetSelection('${property}')"><i class="fas fa-sync-alt"></i></button>
                                        </div>
                                    </div>
                                </div>
                </div>`);
        }
        for (const index in transactions) {
            // Generate unique id for each print button
            let printButtonId = "printButton" + index;
            $('.tableContent').on('click', `#${printButtonId}`, function() {
                // Extract index from button id
                printSection(transactions[index],response.primarySort,response.secondarySort);
              });
          }
        
        $('.tableContent').html(tablesContent);  
        $("selector").find('option[value="'+response.sorted+'"]').attr('selected','selected')
        $("#search_val").val(response.search)
        
        $('#printAll').on('click','#printAll', function() {
            // Extract index from button id
            printSection(transactions[index],response.primarySort,response.secondarySort);
          });
        return tablesContent;

    }
   );
 };

 var printer;

 async function printAll() {
     secondarySort = document.getElementById('secondarySort').value;
    // Handle the printing of a specific transaction here
    console.log('TRANSACTIONS FROM PRINT TICKET FUNCTION');
    console.log(transactionsAll)
    serviceUuid = 'e7810a71-73ae-499d-8c15-faa9aef0c3f2';
    characteristicUuid = 'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f';
     deviceKey = 'lastUsedDevice'; // Key for storing the device address
     const encoder = new TextEncoder();

 
  printData1 = new Uint8Array([
   0x1B, 0x40, // Initialize the printer
   0x1B, 0x21, 0x20, // Set the font size to double height
   0x1B, 0x61, 0x01, // Align text to center
   ...encoder.encode('    Lista de consumo'), 
 ]);
 let receiptContent = '';

 transactionsAll.forEach(function (transactions,ix){

 
receiptContent += `             ${transactions.property}\n`;
receiptContent += `           _____________________\n\n`;

    if (secondarySort == 'serviceData.name') {
        receiptContent += `Nombre            Principio        Cantidad\n`;
        receiptContent += `------------------------------------------\n`;

        transactions.items.forEach(function (item, index) {
            receiptContent += `${item.service.name.padEnd(15)}   ${item.service.principle.padEnd(15)}     ${item.amount.toString().padEnd(8)}\n`;
        });
    } else {
        receiptContent += `Nombre - Principio     \n\n     Cant   Fecha     Hora   Por   PX   Stock\n`;
        receiptContent += `------------------------------------------------\n`;

        transactions.items.forEach(function (item, index) {
            receiptContent += `${(item.service.name + ' - '+item.service.principle).padEnd(15)} \n       ${item.amount.toString().padEnd(3)} ${makeDMYHour(new Date(item.consumtionDate)).padEnd(5)} ${abbreviateSentence(item.addedBy.username).padEnd(5)} ${abbreviateSentence(item.patient.name).padEnd(5)} ${abbreviateSentence(item.location).padEnd(5)}\n`;
    });
}
receiptContent += ` \n\n`

})

 
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



 async function printSection(transactions,primarySort,secondarySort) {
    // Handle the printing of a specific transaction here
    console.log('TRANSACTIONS FROM PRINT TICKET FUNCTION');
    console.log(transactions)
    serviceUuid = 'e7810a71-73ae-499d-8c15-faa9aef0c3f2';
    characteristicUuid = 'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f';
     deviceKey = 'lastUsedDevice'; // Key for storing the device address
     const encoder = new TextEncoder();

 
  printData1 = new Uint8Array([
   0x1B, 0x40, // Initialize the printer
   0x1B, 0x21, 0x20, // Set the font size to double height
   0x1B, 0x61, 0x01, // Align text to center
   ...encoder.encode('    Lista de consumo'), 
 ]);

 
 let receiptContent = '';
receiptContent += `             ${transactions.property}\n`;
receiptContent += `           _____________________\n\n`;

    if (secondarySort == 'serviceData.name') {
        receiptContent += `Nombre            Principio        Cantidad\n`;
        receiptContent += `------------------------------------------\n`;

        transactions.items.forEach(function (item, index) {
            receiptContent += `${item.service.name.padEnd(15)}   ${item.service.principle.padEnd(15)}     ${item.amount.toString().padEnd(8)}\n`;
        });
    } else {
        receiptContent += `Nombre - Principio     \n\n     Cant   Fecha     Hora   Por   PX   Stock\n`;
        receiptContent += `------------------------------------------------\n`;

        transactions.items.forEach(function (item, index) {
            receiptContent += `${(item.service.name + ' - '+item.service.principle).padEnd(15)} \n       ${item.amount.toString().padEnd(3)} ${makeDMYHour(new Date(item.consumtionDate)).padEnd(5)} ${abbreviateSentence(item.addedBy.username).padEnd(5)} ${abbreviateSentence(item.patient.name).padEnd(5)} ${abbreviateSentence(item.location).padEnd(5)}\n`;
    });
}


 
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

  //RESET ACTIONS
  function resetSelection(propertyValue){
    console.log('resetSelection')
    console.log(propertyValue)
    let currentRequest = null;
    const dat = {
        'primarySort':document.getElementById('primarySort').value,
        'secondarySort':document.getElementById('secondarySort').value,
        'propertyValue': propertyValue
    };
    let tablesContent = '';

   $.ajax({
    type: 'PUT',
    url: '/exits/resetSelection',
    data: dat,
    dataType: 'JSON',
    processData: true,
    beforeSend : function()    {          
        if(currentRequest != null) {
            currentRequest.abort();
        }
    },
    cache: false
    }).done(
        function(response) {
              const uniqueStr = Math.random().toString(36).substring(7);

              let flashMessage = `<div class="alert alert-success alert-dismissible fade show fixed-top" role="alert">
              Seccion de lista reiniciada
              <button type="button" id = flashMessage${uniqueStr} class="closeAlert" data-dismiss="alert" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
              </button>
              </div> `;
              $("main").prepend(flashMessage);
              refillOrder()
    })
  }
  
  
  
  //RESET ACTIONS
  function resetAll(){
    console.log('resetAll')
    let currentRequest = null;

   $.ajax({
    type: 'PUT',
    url: '/exits/resetAll',
    data: {},
    dataType: 'JSON',
    processData: true,
    beforeSend : function()    {          
        if(currentRequest != null) {
            currentRequest.abort();
        }
    },
    cache: false
    }).done(
        function(response) {
            const uniqueStr = Math.random().toString(36).substring(7);

            let flashMessage = `<div class="alert alert-success alert-dismissible fade show fixed-top" role="alert">
            Seccion de lista reiniciada
            <button type="button" id = flashMessage${uniqueStr} class="closeAlert" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
            </div> `;
            $("main").prepend(flashMessage);// Reload the page
            refillOrder()

        }
    )};
    $(document).ready(function() {
      $(document).on('click', '.closeAlert', function() {
          $(this).parent().remove();
      });
    });



    function generatePDF(tableId) {
      console.log('generate llamado');
      console.log(tableId)
      console.log(document.getElementById(tableId).innerHTML);
      fetch('https://clinicaabasolo.up.railway.app/exits/generate-pdf-stock', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              content: document.getElementById(tableId).innerHTML, // Get the content of the specific table
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