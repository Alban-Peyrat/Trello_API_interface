# -*- encoding: utf-8 -*-

# External imports
import requests
import json

# ---------------------------------------- Ne pas mettre là
# # Load settings
# with open('settings.json', encoding="utf-8") as f:
#     settings = json.load(f)

# # Get the original file
# API_KEY = settings["API_KEY"]
# TOKEN = settings["TOKEN"]
# board = settings["specific_board_id"]
# ---------------------------------------- Fin du ne pas mettre là

class Trello_API_get_labels(object):
    """Trello_API_get_labels
    =======
    A set of function wich handle data returned by Koha API 'getBiblioPublic' 
    https://api.koha-community.org/20.11.html#operation/getBiblioPublic
    On init take as arguments :
    - biblionumber (Koha identifier)
    - Koha server URL
    - [optional] : format (the response format) :
        - "application/marcxml+xml" (default)
        - "application/marc-in-json"
        - "application/marc"
        - "text/plain"
"""

    def __init__(self, board, API_KEY, TOKEN, service='Trello_Get_Labels'):
        # self.logger = logging.getLogger(service)
        self.endpoint = "https://api.trello.com/1/boards/"
        self.board = board
        self.service = service
        url = self.endpoint + "/" + self.board + "/labels"
        payload = {
            'key': API_KEY,
            'token': TOKEN,
            "limit":1000
            }
        headers = {
            "Accept":"application/json"
            }
        r = requests.request("GET", url, headers=headers, params=payload)
        try:
            r.raise_for_status()  
        except requests.exceptions.HTTPError:
            self.status = 'Error'
            # self.logger.error("{} :: {} :: HTTP Status: {} || Method: {} || URL: {} || Response: {}".format(query, service, r.status_code, r.request.method, r.url, r.text))
            self.error_msg = "Biblionumber inconnu ou service indisponible"
        else:
            self.response = r.content.decode('utf-8')
            self.data = json.loads(self.response)
            self.status = 'Success'
            # self.logger.debug("{} :: {} :: Notice trouvée".format(query, service))

    def filter_by_color(self):
        """Returns all labels filtered by color as a dict, using the color as a key.
        
        The key contains a list of dict with the name and ID."""
        output = {}
        for label in self.data:
            # Creates color in output if inexistent
            if not label["color"] in output:
                output[label["color"]] = []
            
            # Appends the label to the lists
            output[label["color"]].append({"name":label["name"], "id":label["id"]})
        return output