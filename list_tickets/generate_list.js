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

// Get all lists
var trelloAllLists = trelloApiBoards("get_lists",
    settings["API_KEY"],
    settings["TOKEN"],
    service = service,
    data={id:settings["specific_board_id"]});


// For each list
trelloAllLists.then(lists => {
    lists.forEach(list => {

        // Generates name of the list
        let listName = document.createElement("h1");
        listName.textContent = list.name;
        parent.appendChild(listName);

        // Creates the table
        let table = document.createElement("table");
        table.setAttribute("id", `table-${list.id}`)

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
                    console.log(member, members_mapping[member])
                    members.appendChild(memberElm);
                    members.append(", ");
                })
                tr.appendChild(members);

                // Creates the tickets's name
                let nameElm = document.createElement("td");
                nameElm.addEventListener('click', toggleDesc, false);
                nameElm.setAttribute("class", "name");
                nameElm.textContent = card.name;
                // Creates the ticket's description
                let desc = document.createElement("p");
                desc.setAttribute("class","hide");
                desc.textContent = card.desc;
                nameElm.appendChild(desc)
                tr.appendChild(nameElm)

                // Appends the line to the table
                tbody.appendChild(tr)
            })
        })

        // Appends the tbody and table
        table.appendChild(tbody)
        parent.appendChild(table)
    })
})