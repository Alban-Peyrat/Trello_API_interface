# -*- encoding: utf-8 -*-

# External imports
import requests
import json
from enum import Enum

# Geez Louise what the hell is this

class Apis(Enum):
    GET_LABELS = 0
    GET_LISTS = 1
    GET_ACTIONS = 2

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

    def __init__(self, api:Apis, API_KEY:str, TOKEN:str, service='Trello_Boards', data={}):
        # self.logger = logging.getLogger(service)
        self.endpoint = "https://api.trello.com/1/boards"
        self.service = service
        self.payload = {
            'key': API_KEY,
            'token': TOKEN
            }
        self.headers = {
            "Accept":"application/json"
            }

        # Différentes API
        if api == Apis.GET_LABELS:
            self.payload["limit"] = 1000
            self.HTTPmethod = "GET"
            self.url = self.endpoint + "/" + data["id"] + "/labels"
        elif api == Apis.GET_LISTS:
            self.HTTPmethod = "GET"
            self.url = self.endpoint + "/" + data["id"] + "/lists"
        elif api == Apis.GET_ACTIONS:
            self.payload["limit"] = 1000
            self.HTTPmethod = "GET"
            self.url = self.endpoint + "/" + data["id"] + "/actions"
            # self.payload["page"] = 0 # Fun fact : page * limit needs to be under 1000
            # if "page" in data:
            #     self.payload["page"] = int(data["page"])
            if "before" in data:
                self.payload["before"] = data["before"]
            if "since" in data:
                self.payload["since"] = data["since"]
            if "action_type" in data:
                if type(data["action_type"]) == list:
                    self.payload["filter"] = ",".join(data["action_type"])
                elif type(data["action_type"]) == str:
                    self.payload["filter"] = data["action_type"]
        else:
            self.status = "Error"
            self.error_msg = "API not supported"
        try:
            r = requests.request(self.HTTPmethod, self.url, headers=self.headers, params=self.payload)
            r.raise_for_status()  
        except requests.exceptions.RequestException as generic_error:
            self.status = 'Error'
            # self.logger.error("{} :: Koha_API_PublicBiblio_Init :: Generic exception || URL: {} || {}".format(bibnb, url, generic_error))
            self.error_msg = "Generic exception"
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