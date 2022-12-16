// Adds the link to the board in the subtitle
document.getElementById("subtitle").querySelector("a").setAttribute("href", `https://www.trello.com/b/${settings["specific_board_id"]}`)

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

    // Updates all tickets count
    update_all_lists_ticket_count()
};

// Shows every ticket again
function unfilterAll(){
    // Hide the unfilter all button
    document.getElementById("unfilter-all").classList.add("hide");

    let tickets = document.querySelectorAll("tbody tr");
    for (let ii = 0; ii < tickets.length; ii++){
        tickets[ii].classList.remove("hide");
    }

    // Updates all tickets count
    update_all_lists_ticket_count()
}

// Toogles the ticket description
function toggleDesc(){
    this.querySelector("div").classList.remove("hide");
}

// Updates the number of tickets in the list
function tickets_count(listId){
    document.querySelector(`h1[data-list-id='${listId}'] span[data-list-id='${listId}']`).textContent = document.querySelectorAll(`table[id='table-${listId}'] tbody tr:not(.hide)`).length;
}

// Updates all tickets list count
function update_all_lists_ticket_count(){
    document.querySelectorAll("h1.list-name").forEach(list => {
        tickets_count(list.dataset.listId)
    })
}