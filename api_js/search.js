function trelloApiSearch(query, API_KEY, TOKEN) {
    let endpoint = "https://api.trello.com/1/search";
    let init = {
        headers: {
            "Accept": "application/json"
        },
        method: "GET"
    }
    let responseData = fetch(`${endpoint}?query=${query}&key=${API_KEY}&token=${TOKEN}`, init)
    .then(response => {
        console.log(`Response: ${response.status} ${response.statusText}\n${url}`);
        return response.json()
    })
      .catch(err => console.error(err));

    return responseData
}

