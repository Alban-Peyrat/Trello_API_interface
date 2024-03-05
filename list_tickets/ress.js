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