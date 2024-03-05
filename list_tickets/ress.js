// Translate trello colors
const color_mapping = {
    "yellow_light":"#fdfae5",
    "orange_light":"#fdf4e7",
    "red_dark":"#efb3ab",
    "purple_dark":"#dfc0eb",
    "sky_dark":"#8fdfeb",
    "lime_dark":"#b3f1d0",
    "black_dark":"#c1c7d0",
    "pink_dark":"#f697d1"
};

// Sort array of object
//https://stackoverflow.com/questions/8837454/sort-array-of-objects-by-single-key-with-date-value
function sort_arr_of_obj_by_key_val(arr, key){
    return arr.sort(function(a, b) {
        let keyA = a[key];
        let keyB = b[key];
        // Compare the 2 values
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
      });
}

// Prepare Markdown converter
// Uses https://github.com/showdownjs/showdown
var converter = new showdown.Converter()

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
    let nb_of_tickets = document.querySelectorAll(`table[id='table-${listId}'] tbody tr:not(.hide)`).length;
    document.querySelector(`h1[data-list-id='${listId}'] span[data-list-id='${listId}']`).textContent = nb_of_tickets;
    document.querySelector(`body #list-toc ul li[data-list-id='${listId}'] a span[data-list-id='${listId}']`).textContent = nb_of_tickets;
}

// Updates all tickets list count
function update_all_lists_ticket_count(){
    document.querySelectorAll("h1.list-name").forEach(list => {
        tickets_count(list.dataset.listId)
    })
}


function generateCardRow(card){
    // Creates the line
    let tr = document.createElement("tr");
    tr.setAttribute("data-closed", card.closed);
    // If requets is closed, hides it by default
    if (card.closed){
        tr.setAttribute("class", "card card-global-visbility-hide");
    }else {
        tr.setAttribute("class", "card");
    }
    
    // Creates the ticket number
    let numTicket = document.createElement("td");
    // If requets is closed, adds a special formatting class
    if (card.closed){
        numTicket.setAttribute("class", "num-tickets closed-request");
    }else {
        numTicket.setAttribute("class", "num-tickets");
    }
    let linkNumTicket = document.createElement("a");
    linkNumTicket.setAttribute("href", card.shortUrl);
    linkNumTicket.setAttribute("target", "_blank");
    linkNumTicket.textContent = `#AR${card.idShort}`;
    numTicket.appendChild(linkNumTicket);
    tr.appendChild(numTicket);

    // Creates the labels & request type
    let requestTypes = document.createElement("td");
    let labels = document.createElement("td");
    labels.setAttribute("class", "labels");
    card.labels.forEach(label => {
        let labelElm = document.createElement("span");
        labelElm.addEventListener('click', filter, false);
        labelElm.setAttribute("class", "label");
        labelElm.setAttribute("data-id", `label-${label.id}`);
        labelElm.setAttribute("style", `background-color: ${color_mapping[label.color]}`);
        labelElm.textContent = label.name.replaceAll(" ", "\u00A0");
        labels.appendChild(labelElm);
        labels.append(" ");
        if (label.color == settings.request_type_color){
            requestTypes.appendChild(labelElm);
            requestTypes.append(" ");
        }
    })
    // Removes last space
    if (labels.lastChild){
        labels.lastChild.remove();
    }
    if (requestTypes.lastChild){
        requestTypes.lastChild.remove();
    }
    // First append request type, then the labels
    tr.appendChild(requestTypes);
    tr.appendChild(labels);

    // Creates the tickets's name
    let nameTd = document.createElement("td");
    nameTd.addEventListener('click', toggleDesc, false);
    nameTd.setAttribute("class", "name");
    let nameElm = document.createElement("p");
    nameElm.textContent = card.name;
    nameTd.appendChild(nameElm);
    // Creates the ticket's description
    let descDiv = document.createElement("div");
    descDiv.setAttribute("class","desc hide");
    descDiv.innerHTML = converter.makeHtml(card.desc);
    nameTd.appendChild(descDiv);
    tr.appendChild(nameTd);

    return tr
}