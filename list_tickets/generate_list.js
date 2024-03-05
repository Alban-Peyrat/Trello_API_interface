var parent = document.getElementById("list-id");
var service = "Javascript_Trello_List_Cards";
var listCountFlags = {counts:false, lists:false, oldList:false};

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

// Creates all filters types
for (color in settings["label_colors"]){
    let labelP = document.createElement("p");
    labelP.innerHTML = `<span class="label" style="background-color:${color_mapping[settings["label_colors"][color]]}" data-trello-color="${settings["label_colors"][color]}">Label ${color}\u00A0:</span> `;
    document.getElementById("filter-management").appendChild(labelP);
}

// Get all labels
var trelloLabels  = trelloApiBoards("get_labels",
    settings["API_KEY"],
    settings["TOKEN"],
    service = service,
    data={id:settings["specific_board_id"]});

var trelloLabelsCount = {};
var trelloListsCount = {};

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
    
    document.querySelectorAll("#filter-management p").forEach(elm =>{
    if (elm.lastChild){
        elm.lastChild.remove();
    }
    })
})

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

// Get all lists
var trelloAllLists = trelloApiBoards("get_lists",
    settings["API_KEY"],
    settings["TOKEN"],
    service = service,
    data={id:settings["specific_board_id"], filter:"all"});

var closedLists = [];

function generateListToCEntry(list){
    let tocEntry = document.createElement("li");
    tocEntry.setAttribute("data-list-id", `${list.id}`);
    tocEntry.innerHTML = `<a href="#header-${list.id}">${list.name} (<span data-list-id="${list.id}"></span> tickets)</a>`;
    return tocEntry
}

function generateListHeader(list){
    let listName = document.createElement("h1");
    listName.id = `header-${list.id}`;
    listName.setAttribute("data-list-id", `${list.id}`);
    listName.setAttribute("class", "list-name list-opened");
    listName.innerHTML = list.name + ` (<span data-list-id="${list.id}"></span> tickets)`;
    listName.addEventListener('click', toggleListRequests, false);

    return listName
}

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

// Card count
function addListCount(listId, count){
    let html = `${count.open}, <span class="list-count-closed">${count.closed}</span> / ${count.total}`
    document.querySelector(`h1[data-list-id='${listId}'] span[data-list-id='${listId}']`).innerHTML = html;
    document.querySelector(`body #list-toc ul li[data-list-id='${listId}'] a span[data-list-id='${listId}']`).innerHTML = html;

}

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