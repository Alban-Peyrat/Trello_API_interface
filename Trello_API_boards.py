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

class Trello_API_boards(object):
    """Trello_API_boards
    =======
    On init take as arguments :
    - api {str} : name of the API to call
        - "get_labels"
        - "get_lists"
    - API_KEY {str}
    - TOKEN {str}
    - [optional] service {str} : name of the service
    - data {dict} : all informations needed to use the API
"""

    def __init__(self, api, API_KEY, TOKEN, service='Trello_Boards', data={}):
        # self.logger = logging.getLogger(service)
        self.endpoint = "https://api.trello.com/1/boards/"
        self.service = service
        self.payload = {
            'key': API_KEY,
            'token': TOKEN
            }
        self.headers = {
            "Accept":"application/json"
            }

        # Différentes API
        if api == "get_labels":
            self.payload["limit"] = 1000
            self.HTTPmethod = "GET"
            self.url = self.endpoint + "/" + data["id"] + "/labels"
        elif api == "get_lists":
            self.HTTPmethod = "GET"
            self.url = self.endpoint + "/" + data["id"] + "/lists"
        
        try:
            r = requests.request(self.HTTPmethod, self.url, headers=self.headers, params=self.payload)
            r.raise_for_status()  
        except requests.exceptions.HTTPError:
            self.status = 'Error'
            # self.logger.error("{} :: {} :: HTTP Status: {} || Method: {} || URL: {} || Response: {}".format(query, service, r.status_code, r.request.method, r.url, r.text))
            self.error_msg = "Biblionumber inconnu ou service indisponible"
        except requests.exceptions.RequestException as generic_error:
            self.status = 'Error'
            # self.logger.error("{} :: Koha_API_PublicBiblio_Init :: Generic exception || URL: {} || {}".format(bibnb, url, generic_error))
            self.error_msg = "Exception générique, voir les logs pour plus de détails"
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