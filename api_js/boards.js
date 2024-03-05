function trelloApiBoards(api, API_KEY, TOKEN, service = 'Trello_Boards', data={}) {
    let endpoint = "https://api.trello.com/1/boards/";
    let init = {
        headers: {
            "Accept": "application/json"
        }
    }
    let url;
    let params = "";
    for (let key in data) {
        if (key !== "id"){
            params += `&${key}=${data[key]}`
        }
    }
    // Différentes API
    switch (api){
        case "get_labels":
            params = "&limit=1000"
            init["method"] = "GET";
            url = endpoint + "/" + data["id"] + "/labels";
            break;
        case "get_lists":
            init["method"] = "GET";
            url = endpoint + "/" + data["id"] + "/lists";
            break;
        case "get_members":
            init["method"] = "GET";
            url = endpoint + "/" + data["id"] + "/members";
            break;
        case "get_cards":
            init["method"] = "GET";
            url = endpoint + "/" + data["id"] + "/cards";
            break;
        case "get_all_cards":
            init["method"] = "GET";
            url = endpoint + "/" + data["id"] + "/cards/all";
            break;
    }

    let responseData = fetch(`${url}?key=${API_KEY}&token=${TOKEN}${params}`, init)
    .then(response => {
        console.log(`Response: ${response.status} ${response.statusText}\n${url}`);
        return response.json()
    })
      .catch(err => console.error(err));

    return responseData
    }

