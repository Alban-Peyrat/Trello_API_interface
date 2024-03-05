// Faire un JS ressource

let service = "Javascript_Trello_Search"

// Adds the link to the board in the subtitle
document.getElementById("subtitle").querySelector("a").setAttribute("href", `https://www.trello.com/b/${settings["specific_board_id"]}`)

function searchTrelloCards(){
    console.log(document.querySelector("#search-form #search-form-all").value)
}

// Empties the advanced search input
function resetAdvancedSearch(){
    document.getElementById("advanced-search-input").value = "";
}

// Adds JS to the buttons
document.getElementById("advanced-search-button").addEventListener('click', resetAdvancedSearch, false);
document.getElementById("search-button").addEventListener('click', searchTrelloCards, false);

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

// Translate trello colors
const search_label_color_mapping = {
    "yellow_light":"application",
    "orange_light":"type",
    "sky_dark":"dev",
    "black_dark":"school"
};

// Create labels option 
var trelloLabels  = trelloApiBoards("get_labels",
    settings["API_KEY"],
    settings["TOKEN"],
    service = service,
    data={id:settings["specific_board_id"]});


trelloLabels.then(labels => {
    labels = sort_arr_of_obj_by_key_val(labels, "name");
    labels.forEach(label => {
        console.log(label)
        if (label["color"] in search_label_color_mapping){
            __generateSelectOption(label.name, label.name, `#search-form #search-form-table #search-form-label-${search_label_color_mapping[label["color"]]}`)

        }
    })

})