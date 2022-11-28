function trelloApiLists(api, API_KEY, TOKEN, service = 'Trello_Lists', data={}) {
    let endpoint = "https://api.trello.com/1/lists/";
    let init = {
        headers: {
            "Accept": "application/json"
        }
    }
    let url;
    // Différentes API
    switch (api){
        case "get_cards":
            init["method"] = "GET";
            url = endpoint + "/" + data["id"] + "/cards"
            break;
    }

    let responseData = fetch(`${url}?key=${API_KEY}&token=${TOKEN}`, init)
    .then(response => {
        console.log(`Response: ${response.status} ${response.statusText}\n${url}`);
        return response.json()
    })
      .catch(err => console.error(err));

    return responseData
    }

