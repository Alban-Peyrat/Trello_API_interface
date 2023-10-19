var parent = document.getElementById("list-id");
var service = "Javascript_Trello_List_Cards";

// Translate trello colors
const color_mapping = {
    "yellow_light":"#fdfae5",
    "orange_light":"#fdf4e7",
    "red_dark":"#efb3ab",
    "purple_dark":"#dfc0eb",
    "sky_dark":"#8fdfeb",
    "lime_dark":"#b3f1d0",
    "black_dark":"#c1c7d0"
};

// Get all members
var members_mapping = {};

var trelloMembers  = trelloApiBoards("get_members",
    settings["API_KEY"],
    settings["TOKEN"],
    service = service,
    data={id:settings["specific_board_id"]});

trelloMembers.then(members => {
    members.forEach(member => {
        members_mapping[member.id] = member.fullName
    })
})

// #AR189
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

// Creates all filters types
for (color in settings["label_colors"]){
    let labelP = document.createElement("p");
    labelP.innerHTML = `<span class="label" style="background-color:${color_mapping[settings["label_colors"][color]]}" data-trello-color="${settings["label_colors"][color]}">Label ${color}\u00A0:</span> `;
    document.getElementById("filter-management").appendChild(labelP);
}
// Filtre pour les membres
let memberP = document.createElement("p");
memberP.innerHTML = '<span id="member-filter">Membres\u00A0:</span> ';
document.getElementById("filter-management").appendChild(memberP);

// Get all labels
var trelloLabels  = trelloApiBoards("get_labels",
    settings["API_KEY"],
    settings["TOKEN"],
    service = service,
    data={id:settings["specific_board_id"]});

trelloLabels.then(labels => {
    // #AR189 : sort labels
    labels = sort_arr_of_obj_by_key_val(labels, "name");
    
    labels.forEach(label => {
        // Creates the labels
        let labelElm = document.createElement("span");
        labelElm.addEventListener('click', filter, false);
        labelElm.setAttribute("data-id", `label-${label.id}`);
        labelElm.textContent = label.name.replaceAll(" ", "\u00A0");
        document.querySelector(`#filter-management p span[data-trello-color="${label["color"]}"]`).parentElement.appendChild(labelElm);
        document.querySelector(`#filter-management p span[data-trello-color="${label["color"]}"]`).parentElement.append(", ");   
    })
    // Ajoute les membres
    for (memberId in members_mapping){
        let memberElm = document.createElement("span");
        memberElm.addEventListener('click', filter, false);
        memberElm.setAttribute("data-id", `member-${memberId}`);
        memberElm.textContent = members_mapping[memberId];
        document.getElementById("member-filter").parentElement.appendChild(memberElm);
        document.getElementById("member-filter").parentElement.append(", ");
    }
    
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
    document.querySelector("body #list-toc ul #total-nb-tickets #total-nb-tickets-text").textContent = cards.length;
    let nb_open_tickets = 0;
    let nb_closed_tickets = 0;
    cards.forEach(card => {
        if (card.closed){
            nb_closed_tickets++;
        }else {
            nb_open_tickets++;
        }
    })
    document.querySelector("body #list-toc ul #total-nb-tickets #total-open-tickets span").textContent = nb_open_tickets;
    document.querySelector("body #list-toc ul #total-nb-tickets #total-closed-tickets span").textContent = nb_closed_tickets;
})

// Get all lists
var trelloAllLists = trelloApiBoards("get_lists",
    settings["API_KEY"],
    settings["TOKEN"],
    service = service,
    data={id:settings["specific_board_id"]});

// Prepare Markdown converter
// Uses https://github.com/showdownjs/showdown
var converter = new showdown.Converter()

// For each list
trelloAllLists.then(lists => {
    lists.forEach(list => {

        // Generates the entry in the ToC
        let tocEntry = document.createElement("li");
        tocEntry.setAttribute("data-list-id", `${list.id}`);
        tocEntry.innerHTML = `<a href="#header-${list.id}">${list.name} (<span data-list-id="${list.id}"></span> tickets)</a>`;
        document.querySelector("body #list-toc ul").appendChild(tocEntry)

        // Generates name of the list
        let listName = document.createElement("h1");
        listName.id = `header-${list.id}`;
        listName.setAttribute("data-list-id", `${list.id}`);
        listName.setAttribute("class", "list-name");
        listName.innerHTML = list.name + ` (<span data-list-id="${list.id}"></span> tickets)`;
        parent.appendChild(listName);

        // Creates the table
        let table = document.createElement("table");
        table.setAttribute("id", `table-${list.id}`);

        // Creates the thead
        let thead = document.createElement("thead");
        let theadTr = document.createElement("tr");
        let headers = ["Numéro de ticket", "Labels", "Membres assignés", "Nom du ticket"];
        for (let ii = 0; ii < headers.length; ii++){
            let th = document.createElement("th");
            th.textContent = headers[ii];
            theadTr.appendChild(th);
        }
        thead.appendChild(theadTr);
        table.appendChild(thead);

        // Creates the tbody
        let tbody = document.createElement("tbody");

        // Get all cards in this list
        var trelloListCards = trelloApiLists("get_cards",
            settings["API_KEY"],
            settings["TOKEN"],
            service = service,
            data={id:list.id});

        // For each card in the list
        trelloListCards.then(cards => {
            // Updates the number of open tickets
            document.querySelector(`h1[data-list-id='${list.id}'] span[data-list-id='${list.id}']`).textContent = cards.length;
            document.querySelector(`body #list-toc ul li[data-list-id='${list.id}'] a span[data-list-id='${list.id}']`).textContent = cards.length;
            cards.forEach(card => {

                // Creates the line
                let tr = document.createElement("tr");
                
                // Creates the ticket number
                let numTicket = document.createElement("td");
                numTicket.setAttribute("class", "num-tickets");
                let linkNumTicket = document.createElement("a");
                linkNumTicket.setAttribute("href", card.shortUrl);
                linkNumTicket.setAttribute("target", "_blank");
                linkNumTicket.textContent = `#AR${card.idShort}`;
                numTicket.appendChild(linkNumTicket);
                tr.appendChild(numTicket);

                // Creates the labels
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
                })
                if (labels.lastChild){
                    labels.lastChild.remove();
                }
                tr.appendChild(labels);

                // Creates assigned members
                let members = document.createElement("td");
                members.setAttribute("class", "members");
                card.idMembers.forEach(member => {
                    let memberElm = document.createElement("span");
                    memberElm.addEventListener('click', filter, false);
                    memberElm.setAttribute("class", "member");
                    memberElm.setAttribute("data-id", `member-${member}`);
                    memberElm.textContent = members_mapping[member];
                    members.appendChild(memberElm);
                    members.append(", ");
                })
                if (members.lastChild){
                    members.lastChild.remove();
                }
                tr.appendChild(members);

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

                // Appends the line to the table
                tbody.appendChild(tr)
            })
        })

        // Appends the tbody and table
        table.appendChild(tbody)
        parent.appendChild(table)
    })
})