// ------------------------- Init -------------------------

var parent = document.getElementById("list-id");
var service = "Javascript_Trello_List_Cards";
var listCountFlags = {counts:false, lists:false, oldList:false};

// ------------------------- Classes definition -------------------------

class Count {
    constructor() {
      this.open = 0;
      this.closed = 0;
      this.total = 0;
    }

    addOpen() {
        this.open++;
        this.total++;
    }

    addClosed() {
        this.closed++;
        this.total++;
    }

    manualDefine(countInstance){
        this.open = countInstance.open;
        this.closed = countInstance.closed;
        this.total = countInstance.total;
    }

    manualAdd(countInstance){
        this.open += countInstance.open;
        this.closed += countInstance.closed;
        this.total += countInstance.total;
    }
}

// ------------------------- Functions added to HTML elements -------------------------

// Toggle list displaying its cards
function toggleListRequests(){
    this.classList.toggle("list-opened");
    this.classList.toggle("list-closed");
    document.getElementById(`table-${this.dataset.listId}`).classList.toggle("hide");
}

// Toggle displaying cards if they are open and/or closed
function toggleCardsVisibility(){
    console.log(this, this.dataset)
    document.querySelectorAll("#div-request-visibility-buttons button").forEach(button => {
        button.classList.remove("visibility-button-selected");
    })
    this.classList.add("visibility-button-selected");
    document.querySelectorAll("tr.card").forEach(card => {
        card.classList.add("card-global-visbility-hide");
        if (this.dataset.showOpen == "true" && card.dataset.closed == "false") {
            card.classList.remove("card-global-visbility-hide");
        }
        if (this.dataset.showClosed == "true" && card.dataset.closed == "true") {
            card.classList.remove("card-global-visbility-hide");
        }
    })
}

// ------------------------- Functions to generate HTML elements -------------------------

// List header (Title / Name or whatever you want to call it)
function generateListHeader(list){
    let listName = document.createElement("h1");
    listName.id = `header-${list.id}`;
    listName.setAttribute("data-list-id", `${list.id}`);
    listName.setAttribute("class", "list-name list-opened");
    listName.innerHTML = list.name + ` (<span data-list-id="${list.id}"></span> tickets)`;
    listName.addEventListener('click', toggleListRequests, false);

    return listName
}

// List table with its headers
function generateListTableWithHead(list){
    let table = document.createElement("table");
    table.setAttribute("id", `table-${list.id}`);

    // Creates the thead
    let thead = document.createElement("thead");
    let theadTr = document.createElement("tr");
    let headers = ["Numéro de ticket", "Type de demande", "Labels", "Nom du ticket"];
    for (let ii = 0; ii < headers.length; ii++){
        let th = document.createElement("th");
        th.textContent = headers[ii];
        theadTr.appendChild(th);
    }
    thead.appendChild(theadTr);
    table.appendChild(thead);
    
    return table
}

// ------------------------- Adding missing HTML content -------------------------

// ------------- Ticket types -------------

// Creates all filters types
for (color in settings["label_colors"]){
    let labelP = document.createElement("p");
    labelP.innerHTML = `<span class="label" style="background-color:${color_mapping[settings["label_colors"][color]]}" data-trello-color="${settings["label_colors"][color]}">Label ${color}\u00A0:</span> `;
    document.getElementById("filter-management").appendChild(labelP);
}

// ------------- Every label -------------

var trelloLabelsCount = {};
var trelloListsCount = {};

// Get all labels
var trelloLabels  = trelloApiBoards("get_labels",
    settings["API_KEY"],
    settings["TOKEN"],
    service = service,
    data={id:settings["specific_board_id"]});

// For eahc label, create an element
trelloLabels.then(labels => {
    // #AR189 : sort labels
    labels = sort_arr_of_obj_by_key_val(labels, "name");
    
    labels.forEach(label => {
        // To count tickets
        trelloLabelsCount[label.id] = new Count();

        // Creates the labels
        let labelElm = document.createElement("span");
        labelElm.addEventListener('click', filter, false);
        labelElm.setAttribute("data-id", `label-${label.id}`);
        labelElm.innerHTML = label.name.replaceAll(" ", "\u00A0");
        labelElm.innerHTML += ` <span class="label-count">(<span class="label-count-open"></span>, <span class="label-count-closed"></span> / <span class="label-count-total"></span>)</span>`
        document.querySelector(`#filter-management p span[data-trello-color="${label["color"]}"]`).parentElement.appendChild(labelElm);
        document.querySelector(`#filter-management p span[data-trello-color="${label["color"]}"]`).parentElement.append(", ");   
    })
    
    // Remove the last useless comma
    document.querySelectorAll("#filter-management p").forEach(elm =>{
    if (elm.lastChild){
        elm.lastChild.remove();
    }
    })
})

// ------------- Number of tickets -------------

// Gets total number of tickets
var trelloAllCards = trelloApiBoards("get_all_cards",
    settings["API_KEY"],
    settings["TOKEN"],
    service = service,
    data={id:settings["specific_board_id"]});
trelloAllCards.then(cards => {
    // general stats (total, open / closed)
    document.querySelector("body #list-toc ul #total-nb-tickets #total-nb-tickets-text").textContent = cards.length;
    let nb_open_tickets = 0;
    let nb_closed_tickets = 0;
    cards.forEach(card => {
        // general stats
        if (card.closed){
            nb_closed_tickets++;
        }else {
            nb_open_tickets++;
        }

        // Label stats
        card["idLabels"].forEach(label =>{
            let thisCount = trelloLabelsCount[label];
            if (card.closed){
                thisCount.addClosed();
            }else {
                thisCount.addOpen();
            }
        })

        // List stats
        if (!(card.idList in trelloListsCount)){
            trelloListsCount[card.idList] = new Count();
        }
        let listCount = trelloListsCount[card.idList];
        if (card.closed){
            listCount.addClosed();
        }else {
            listCount.addOpen();
        }
    })
    // Display stats
    document.querySelector("body #list-toc ul #total-nb-tickets #total-open-tickets span").textContent = nb_open_tickets;
    document.querySelector("body #list-toc ul #total-nb-tickets #total-closed-tickets span").textContent = nb_closed_tickets;
    for (const [key, value] of Object.entries(trelloLabelsCount)){
        let labelSpan = document.querySelector(`body #filter-management p span[data-id="label-${key}"] span.label-count`);
        labelSpan.querySelector("span.label-count-open").textContent = value.open;
        labelSpan.querySelector("span.label-count-closed").textContent = value.closed;
        labelSpan.querySelector("span.label-count-total").textContent = value.total;
    }

    listCountFlags.counts = true;
})

// ------------- Lists & tickets -------------

var closedLists = [];

// Get all lists
var trelloAllLists = trelloApiBoards("get_lists",
    settings["API_KEY"],
    settings["TOKEN"],
    service = service,
    data={id:settings["specific_board_id"], filter:"all"});

    function generateListToCEntry(list){
    let tocEntry = document.createElement("li");
    tocEntry.setAttribute("data-list-id", `${list.id}`);
    tocEntry.innerHTML = `<a href="#header-${list.id}">${list.name} (<span data-list-id="${list.id}"></span> tickets)</a>`;
    return tocEntry
}

// For each list
trelloAllLists.then(lists => {
    lists.forEach(list => {
        // Leaves if it's an old list
        if (list.closed){
            closedLists.push(list.id);
            return
        }
        // Generates the entry in the ToC
        document.querySelector("body #list-toc ul").appendChild(generateListToCEntry(list))

        // Generates name of the list
        parent.appendChild(generateListHeader(list));

        // Creates the table
        let table = generateListTableWithHead(list);

        // Creates the tbody
        let tbody = document.createElement("tbody");

        // For each card in the list
        trelloAllCards.then(cards => {
            cards.forEach(card => {
                // Leaves if not the right list
                if (card.idList === list.id){
                    tbody.appendChild(generateCardRow(card))
                }
            })
        })

        // Appends the tbody and table
        table.appendChild(tbody);
        parent.appendChild(table);
    })
    listCountFlags.lists = true;

    //Add the the tickets in old lists
    let oldRequestsList = {"id":"old-lists", "name":"Tickets d'anciennes listes"};
    // Generates the entry in the ToC
    document.querySelector("body #list-toc ul").appendChild(generateListToCEntry(oldRequestsList))

    // Generates name of the list
    parent.appendChild(generateListHeader(oldRequestsList));

    // Creates the table
    let table = generateListTableWithHead(oldRequestsList);

    // Creates the tbody
    let tbody = document.createElement("tbody");

    // For each card in the list
    trelloAllCards.then(cards => {
        cards.forEach(card => {
            // Leaves if not the right list
            if (closedLists.includes(card.idList)){
                tbody.appendChild(generateCardRow(card))
            }
        })
    })

    // Appends the tbody and table
    table.appendChild(tbody);
    parent.appendChild(table);

    listCountFlags.oldList = true;
})

// ------------- Number of tickets (for Lists) -------------

// Card count
function addListCount(listId, count){
    let html = `${count.open}, <span class="list-count-closed">${count.closed}</span> / ${count.total}`
    document.querySelector(`h1[data-list-id='${listId}'] span[data-list-id='${listId}']`).innerHTML = html;
    document.querySelector(`body #list-toc ul li[data-list-id='${listId}'] a span[data-list-id='${listId}']`).innerHTML = html;

}

// Ensure we properly wait for things to load
// https://stackoverflow.com/questions/22125865/how-to-wait-until-a-predicate-condition-becomes-true-in-javascript
function WaitAddListCount() {
    if(!(listCountFlags.counts === true && listCountFlags.lists === true && listCountFlags.oldList === true)) {
        window.setTimeout(WaitAddListCount, 100); /* this checks the flag every 100 milliseconds*/
    } else {
        document.querySelectorAll("h1.list-name").forEach(listName => {
            let id = listName.dataset.listId;
            let thisCount = new Count();
            if (id === "old-lists") {
                closedLists.forEach(closedId => {
                    if (closedId in trelloListsCount) {
                        thisCount.manualAdd(trelloListsCount[closedId]);
                    }
                })
            } else if (id in trelloListsCount) {
                thisCount.manualDefine(trelloListsCount[id]);
            }
            addListCount(id, thisCount);
        })
    }
}
WaitAddListCount();

// ------------------------- Adding functions to HTML elements -------------------------

// Enable button visibility behaviour
document.querySelectorAll("#div-request-visibility-buttons button").forEach(button => {
    button.addEventListener('click', toggleCardsVisibility, false);
})