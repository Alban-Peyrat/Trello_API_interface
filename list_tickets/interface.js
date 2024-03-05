// Adds the link to the board in the subtitle
document.getElementById("subtitle").querySelector("a").setAttribute("href", `https://www.trello.com/b/${settings["specific_board_id"]}`)

// Toggle list
function toggleListRequests(){
    this.classList.toggle("list-opened");
    this.classList.toggle("list-closed");
    document.getElementById(`table-${this.dataset.listId}`).classList.toggle("hide");
}

// Toggle closed/open cards
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
// Enable button visibility behaviour
document.querySelectorAll("#div-request-visibility-buttons button").forEach(button => {
    button.addEventListener('click', toggleCardsVisibility, false);
})