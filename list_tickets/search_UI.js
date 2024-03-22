// ------------------------- Init -------------------------

let service = "Javascript_Trello_Search"
let form = document.querySelector("#search-form #search-form-table tbody");

// ------------------------- Functions added to HTML elements -------------------------

// Empties the advanced search input
function resetAdvancedSearch(){
    document.getElementById("advanced-search-input").value = "";
}

// Fills the advaned search based on the form content
function formToAdvancedSearch(){
    document.querySelector("#advanced-search-form #advanced-search-input").value = searchFormToString();
}

// Resets the search (form & advanced)
function resetSearch(){
    // Advanced Search
    resetAdvancedSearch();
    // All text inputs
    form.querySelectorAll("input[type='text']").forEach(thisInput => {
        thisInput.value = "";
    })
    // All checkboxes
    form.querySelectorAll("input[type='checkbox']").forEach(thisInput => {
        thisInput.checked = false;
    })
    // All select
    form.querySelectorAll("option").forEach(thisInput => {
        thisInput.selected = false;
    })
    // Default Sort
    form.querySelector("#sort-radio-button_created").checked = true;
    // All select
    form.querySelectorAll("input[name='edited-radio-button']").forEach(thisInput => {
        thisInput.checked = false;
    })
}

// Laucnhes the search
function searchTrelloCards(){
    // Get query
    let query = "";
    if (!isAdvancedSearchEmpty()){
        query = getAdvancedSearchContent();
    }else {
        query = searchFormToString();
    }
    // Make sure the query is not empty
    if (query.trim() === "") {
        alert("Requête vide");
        return
    }

    let searchResult = trelloApiSearch(query, settings["API_KEY"], settings["TOKEN"]);
    searchResult.then(res => {
        let cards = res.cards
        // Show the query
        document.getElementById("query-used").textContent = query;
        document.getElementById("search-nb-result").textContent = `(${cards.length} tickets)`;

        let parent = document.querySelector("#search-results table#table-list-id tbody");
        // Delete previous results
        parent.innerHTML = "";

        cards.forEach(card => {
            parent.appendChild(generateCardRow(card))
        })
        // Displays every request
        document.querySelectorAll("tr.card").forEach(card => {
            card.classList.remove("card-global-visbility-hide");
        })
    })
}

// ------------------------- Functions to handle the form -------------------------

// Get the selected values of a select element in the form (request type)
function getLabelsSelectedvalueFromSearchForm(labelType){
    let output = [];
    let selectedOptions = getSelectValues(form.querySelector(`#search-form-label-${labelType}`));
    selectedOptions.forEach(option => {
        if (option.trim() !== ""){
            output.push(`label:"${option}"`)
        }
    })
    return output
}

// Get the list values (already formatted for the query)
function getListsFromSearchForm(){
    let output = [];
    let includeList = getSelectValues(form.querySelector(`#search-form-lists`))[0];
    if (includeList.trim() !== "") {
        output.push(`list:"${includeList}"`);
    }
    for (let ii = 1; ii <= 3; ii++){
        let excludeList = getSelectValues(form.querySelector(`#search-form-exclude-lists${ii}`))[0];
        if (excludeList.trim() !== "") {
            output.push(`-list:"${excludeList}"`);
        }
    }
    return output
}

// Gets the text inputs values for an index (already formatted for the query)
function getTextInputsFromSearchForm(index){
    let output = [];
    for (let ii = 1; ii <= 3; ii++) {
        let txt = form.querySelector(`#search-form-${index}${ii}`).value.trim();
        if (txt !== ""){
            let prepend = "";
            // Prepare the index + negative if needed
            if (index !== "all"){
                prepend = `${index}:`
            }
            if (form.querySelector(`#search-form-${index}${ii}-checkbox_not`).checked) {
                prepend = `-${prepend}`;
            }
            // Adds the prepend to each word
            txt.split(" ").forEach(word => {
                word = word.trim();
                if (word !== ""){
                    output.push(`${prepend}${word}`)
                }
            })
        }
    }
    return output
}

// Gets the argument for a search on urgent requests (already formatted for the query)
function searchForUrgent(){
    if (form.querySelector(`#urgent-checkbox`).checked) {
        return [`label:"Urgent"`]
    }else {
        return []
    }
}

// Gets the date argument (already formatted for the query)
function getDateFromSearchForm(){
    let daysInput = form.querySelector("#search-edited-manual-value").value.trim();
    
    // If something is written, ignores the radio inputs
    // EVEN IF IT'S AN INVALID VALUE (allows to cancel a radio input)
    if (daysInput !== "") {
        daysInput = parseInt(daysInput);
        // If a number is in 
        if (Number.isInteger(daysInput) && daysInput > 0) {
            return [`edited:${daysInput}`];
        } else {
            return [];
        }
    } else {
        let selectedRadioButton = form.querySelector('input[name="edited-radio-button"]:checked');
        if (selectedRadioButton === null){
            return []
        } else {
            return [`edited:${selectedRadioButton.value}`]
        }
    }
}

// Gets the status of tickets (closed or opened, not the label part) (already foramtted for the query)
function getOpenCheckboxesFromSearchForm(){
    let checkboxes = form.querySelectorAll('input[name="status-open-checkbox"]:checked');
    // If no option are selected OR every options is selected, don't do anything because it defaults to all requests
    if (checkboxes.length !== 1) {
        return []
    }else {
        return [`is:${checkboxes[0].value}`]
    }
}

// Returns the entire search form as a string
// Should be called when launching the search from the form
// And when using the button to advanced search
function searchFormToString(){
    let argumentList = [].concat(
        getTextInputsFromSearchForm("all"),
        getTextInputsFromSearchForm("name"),
        getTextInputsFromSearchForm("description"),
        getTextInputsFromSearchForm("comment"),
        getTextInputsFromSearchForm("checklist"),
        getLabelsSelectedvalueFromSearchForm("application"),
        getLabelsSelectedvalueFromSearchForm("type"),
        getLabelsSelectedvalueFromSearchForm("dev"),
        getLabelsSelectedvalueFromSearchForm("school"),
        searchForUrgent(),
        getListsFromSearchForm(),
        getDateFromSearchForm(),
        getOpenCheckboxesFromSearchForm(),
        getLabelsSelectedvalueFromSearchForm("fermeture")
    );

    return `${argumentList.join(" ")} sort:${form.querySelector('input[name="sort-radio-button"]:checked').value}`.trim()
}

// Gets the content of the advanced search
function getAdvancedSearchContent(){
    return document.querySelector("#advanced-search-form #advanced-search-input").value.trim();
}

// Returns if the advanced search is filled
function isAdvancedSearchEmpty(){
    return (getAdvancedSearchContent() === "")
}

// ------------------------- Adding missing HTML content -------------------------

// ------------- Lists -------------

// Get all lists
var trelloAllLists = trelloApiBoards("get_lists",
    settings["API_KEY"],
    settings["TOKEN"],
    service = service,
    data={id:settings["specific_board_id"]});

// Create lists option
trelloAllLists.then(lists => {
    lists.forEach(list => {
        __generateSelectOption(list.name, list.name, "#search-form #search-form-table #search-form-lists");
        for (let ii=1; ii <= 3; ii++){
            __generateSelectOption(list.name, list.name, `#search-form #search-form-table #search-form-exclude-lists${ii}`);
        }
    })
})

// ------------- Labels -------------

// Get all labels
var trelloLabels  = trelloApiBoards("get_labels",
    settings["API_KEY"],
    settings["TOKEN"],
    service = service,
    data={id:settings["specific_board_id"]});

// Create labels option 
trelloLabels.then(labels => {
    labels = sort_arr_of_obj_by_key_val(labels, "name");
    labels.forEach(label => {
        if (label["color"] in search_label_color_mapping){
            __generateSelectOption(label.name, label.name, `#search-form #search-form-table #search-form-label-${search_label_color_mapping[label["color"]]}`)
        }
    })

})

// ------------------------- Adding functions to HTML elements -------------------------

// Adds JS to the buttons
document.getElementById("search-button").addEventListener('click', searchTrelloCards, false);
document.getElementById("advanced-edit-button").addEventListener('click', formToAdvancedSearch, false);
document.getElementById("empty-advanced-search-button").addEventListener('click', resetAdvancedSearch, false);
document.getElementById("reset-search-button").addEventListener('click', resetSearch, false);

// Launch search by pressing Enter ky
document.getElementById("search-form").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        searchTrelloCards();
    }
  });