# -*- encoding: utf-8 -*-

# External imports
import requests
import json
import datetime

# ---------------------------------------- Ne pas mettre là
# # Load settings
# with open('settings.json', encoding="utf-8") as f:
#     settings = json.load(f)

# # Get the original file
# API_KEY = settings["API_KEY"]
# TOKEN = settings["TOKEN"]
# idList = settings["create_card_default_list_id"]
# idLabels = ["636b89573b1806052382168b", "6371f95494e5ba0140868cdd"]
# name = "Test création Python"
# desc = "Test description"
# ---------------------------------------- Fin du ne pas mettre là

class Trello_API_cards(object):
    """Trello_API_cards
    =======
    On init take as arguments :
    - api {str} : name of the API to call
        - "new_card"
        - "update_card"
        - "new_comment"
        - "add_label"
        - "remove_label"
    - API_KEY {str}
    - TOKEN {str}
    - [optional] service {str} : name of the service
    - data {dict} : all informations needed to use the API
"""
    def __init__(self, api , API_KEY, TOKEN, service='Trello_Cards', data={}):
        # self.logger = logging.getLogger(service)
        self.endpoint = "https://api.trello.com/1/cards"
        self.service = service
        # url = self.endpoint
        self.payload = {
            'key': API_KEY,
            'token': TOKEN
            }
        self.headers = {
            "Accept":"application/json"
            }
        
        # Différentes API
        if api == "new_card":
            self.payload["pos"] = "top"
            self.payload["start"] = datetime.datetime.now().isoformat()
            self.payload["idList"] = data["idList"]
            self.payload["idLabels"] = data["idLabels"]
            self.payload["name"] = data["name"]
            self.payload["desc"] = data["desc"]
            self.HTTPmethod = "POST"
            self.url = self.endpoint
        elif api == "update_card":
            param_list = ["pos", "idList", "idLabels", "name", "desc"]
            for param in param_list:
                if param in data:
                    self.payload[param] = data[param]
            # if "pos" in data:
            #     self.payload["pos"] = data["pos"]
            # if "idList" in data:
            #     self.payload["idList"] = data["idList"]
            # if "idLabels" in data:
            #     self.payload["idLabels"] = data["idLabels"]
            # if "name" in data:
            #     self.payload["name"] = data["name"]
            # if "desc" in data:
            #     self.payload["desc"] = data["desc"]
            self.HTTPmethod = "PUT"
            self.url = self.endpoint + "/{}".format(data["id"])
        elif api == "new_comment":
            self.payload["text"] = data["text"]
            self.HTTPmethod = "POST"
            self.url = self.endpoint + "/{}/actions/comments".format(data["id"])
        elif api == "add_label":
            self.payload["value"] = data["value"]
            self.HTTPmethod = "POST"
            self.url = self.endpoint + "/{}/idLabels".format(data["id"])
        elif api == "remove_label":
            self.HTTPmethod = "DELETE"
            self.url = self.endpoint + "/{}/idLabels/{}".format(data["id"], data["idLabel"])

        r = requests.request(self.HTTPmethod, self.url, headers=self.headers, params=self.payload)
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