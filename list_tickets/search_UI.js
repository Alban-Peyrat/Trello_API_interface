// Faire un JS ressource

let service = "Javascript_Trello_Search"
let form = document.querySelector("#search-form #search-form-table tbody");

// Translate trello colors
const search_label_color_mapping = {
    "yellow_light":"application",
    "orange_light":"type",
    "sky_dark":"dev",
    "black_dark":"school",
    "pink_dark":"fermeture"
};

// Adds the link to the board in the subtitle
document.getElementById("subtitle").querySelector("a").setAttribute("href", `https://www.trello.com/b/${settings["specific_board_id"]}`)

// Empties the advanced search input
function resetAdvancedSearch(){
    document.getElementById("advanced-search-input").value = "";
}

// https://stackoverflow.com/questions/5866169/how-to-get-all-selected-values-of-a-multiple-select-box
function getSelectValues(elem) {
    let result = [];
    let options = elem.selectedOptions;
  
    for (let ii = 0; ii < options.length; ii++) {
        result.push(options[ii].text);
    }
    return result;
}

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

function searchForUrgent(){
    if (form.querySelector(`#urgent-checkbox`).checked) {
        return [`label:"Urgent"`]
    }else {
        return []
    }
}

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

function getOpenCheckboxesFromSearchForm(){
    let checkboxes = form.querySelectorAll('input[name="status-open-checkbox"]:checked');
    // If no option are selected OR every options is selected, don't do anything because it defaults to all requests
    if (checkboxes.length !== 1) {
        return []
    }else {
        return [`is:${checkboxes[0].value}`]
    }
}

// Returns the search form as a string
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
    // remplir le board
}

function getAdvancedSearchContent(){
    return document.querySelector("#advanced-search-form #advanced-search-input").value.trim();
}

function isAdvancedSearchEmpty(){
    return (getAdvancedSearchContent() === "")
}

function formToAdvancedSearch(){
    document.querySelector("#advanced-search-form #advanced-search-input").value = searchFormToString();
}

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

// Adds JS to the buttons
document.getElementById("search-button").addEventListener('click', searchTrelloCards, false);
document.getElementById("advanced-edit-button").addEventListener('click', formToAdvancedSearch, false);
document.getElementById("empty-advanced-search-button").addEventListener('click', resetAdvancedSearch, false);
document.getElementById("reset-search-button").addEventListener('click', resetSearch, false);

// Get all lists
var trelloAllLists = trelloApiBoards("get_lists",
    settings["API_KEY"],
    settings["TOKEN"],
    service = service,
    data={id:settings["specific_board_id"]});

// Prepare Markdown converter
// Uses https://github.com/showdownjs/showdown
var converter = new showdown.Converter()

function __generateSelectOption(text, value, parentQuerySelector){
    let elem = document.createElement("option");
    elem.setAttribute("value", value);
    elem.textContent = text;
    document.querySelector(parentQuerySelector).appendChild(elem)
}

// Create lists option
trelloAllLists.then(lists => {
    lists.forEach(list => {
        __generateSelectOption(list.name, list.name, "#search-form #search-form-table #search-form-lists");
        for (let ii=1; ii <= 3; ii++){
            __generateSelectOption(list.name, list.name, `#search-form #search-form-table #search-form-exclude-lists${ii}`);
        }
    })
})

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



// Create labels option 
var trelloLabels  = trelloApiBoards("get_labels",
    settings["API_KEY"],
    settings["TOKEN"],
    service = service,
    data={id:settings["specific_board_id"]});


trelloLabels.then(labels => {
    labels = sort_arr_of_obj_by_key_val(labels, "name");
    labels.forEach(label => {
        if (label["color"] in search_label_color_mapping){
            __generateSelectOption(label.name, label.name, `#search-form #search-form-table #search-form-label-${search_label_color_mapping[label["color"]]}`)
        }
    })

})