$(document).ready(function() {
    //set dates with default values
    $('#search_val').on('keyup', function(event) {
        if (event.keyCode === 13) {
                foundExits(event);
        }
      });
    
      // Add a click event listener to the search button
      $('#search-button').on('click', function(event) {
        console.log('search btn');
            foundExits(event);
      });
});

// Fill table with data
function foundExits(event) {
    console.log('foundExits!')
    let currentRequest = null;
    const dat = {'search':$("#search_val").val(),'page':$(event).attr("alt")};
    let exitsContent = '';
   $.ajax({
    type: 'GET',
    url: '/exits/searchAllExits',
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
         exitsContent = `<div class="exits row mt-4">`;

        for (let payment of response.exits){
            console.log('date')
            console.log(payment.clearDate)
            exitsContent += `
            <div class="col-md-4">
                <div class="card index_card_p mb-4 border border-success>">
                    <div class="row">
                        <div class="container">
                            <div class="col-md-16">
                                <div class="card-body">
                                    <h3 class="card-title text-center">${payment.name}</h3>
                                        <div class="clearfix">
                                            <h4 class="text-center card-title text-muted">Fecha de pago: ${new Date(payment.clearDate).toISOString().substr(0,10)}</h4>
                                        </div>
                                        <li class="list-group-item text-center">Total: $${payment.moneyAmount}</li>
                                        <li class="list-group-item text-center">Categoria: ${payment.category}</li>`;
                                        
            if(payment.author){
                exitsContent += `<li class="list-group-item text-center">Agregado por: ${payment.author.username}</li>`;
            }
            exitsContent += `
                                        <form class="d-inline" action="/exits/${payment._id}?_method=DELETE" method="POST">
                                            <button class="float-right btn btn-outline-danger mx-1 my-1 btn-sm"><i class="fas fa-trash"></i></button>
                                        </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        }

        exitsContent += `</div>`;
        let pagination = `<div class="row my-3 pagination customClass">
                 <div class="btn-group float-right" role="group" aria-label="First group">`;
                    if(response.page >1){
                        pagination += `<a onclick="foundExits(this)" alt="${response.page-1}" class="btn btn-light " role="button" aria-pressed="true"><i class="fas fa-arrow-circle-left"></i></a>`
                    }
                    for(let step = 1; step < response.pages+1; step++) {
                        let act = (step == response.page)?"active":"";
                        pagination += `<a onclick="foundExits(this)" alt="${step}" class="btn btn-light ${act}" role="button" aria-pressed="true">${step}</a>`
                    }
                    if(response.page+1 <= response.pages){
                        pagination += `<a onclick="foundExits(this)" alt="${response.page+1}" class="btn btn-light " role="button" aria-pressed="true"><i class="fas fa-arrow-circle-right"></i></a>`
                    }
                     pagination += `</div>
                     </div>`
                     
        $('.exits').html( exitsContent);  
        $('.pagination').replaceWith( pagination); 
        $("#search_val").val(response.search)
   });
 };