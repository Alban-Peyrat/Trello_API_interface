
//Function that hides tickets without this id
function filter() {
    let id = this.dataset.id;
    let filterType = id.substr(0, id.indexOf("-"));

    // Shows the button to clear all filters
    document.getElementById("unfilter-all").classList.remove("hide");

    // For each ticket checks if the chosen filter is present 
    let tickets = document.querySelectorAll("tbody tr");
    for (let ii = 0; ii < tickets.length; ii++){
        let fileredElems = tickets[ii].querySelectorAll("."+filterType);
        let hide = true;
        // Only checks the elems with the same filter type as the filter
        for (let jj = 0; jj < fileredElems.length; jj++){
            if (id === fileredElems[jj].dataset.id){
                hide = false;
            }
        }
        // If the filter wasn't found, hide the ticket
        if (hide) {
            tickets[ii].classList.add("hide");
        }
    }
};

// Shows every ticket again
function unfilterAll(){
    // Hide the unfilter all button
    document.getElementById("unfilter-all").classList.add("hide");

    let tickets = document.querySelectorAll("tbody tr");
    for (let ii = 0; ii < tickets.length; ii++){
        tickets[ii].classList.remove("hide");
    }
}

// Toogles the ticket description
function toggleDesc(){
    this.querySelector("p").classList.toggle("hide");
}