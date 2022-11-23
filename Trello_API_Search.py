# -*- encoding: utf-8 -*-

# External imports
import requests
import json

# ---------------------------------------- Ne pas mettre là
# Load settings
with open('settings.json', encoding="utf-8") as f:
    settings = json.load(f)

# Get the original file
API_KEY = settings["API_KEY"]
TOKEN = settings["TOKEN"]
board = settings["specific_board_id"]
# ---------------------------------------- Fin du ne pas mettre là

class Trello_API_Search(object):
    """Trello_API_Search
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

    def __init__(self,query, API_KEY, TOKEN, service='Trello_Search'):
        # self.logger = logging.getLogger(service)
        self.endpoint = "https://api.trello.com/1/search"
        self.service = service
        self.query = str(query)
        url = self.endpoint
        payload = {
            'query': self.query,
            'key': API_KEY,
            'token': TOKEN,
            "idBoards": [board], #temporaire
            "modelTypes": ["cards"], #temporaire
            "boards_limit":1000
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
            self.record = r.content.decode('utf-8')
            self.status = 'Success'
            # self.logger.debug("{} :: {} :: Notice trouvée".format(query, service))
            print(self.record)
            # print(self.text)

# Lire ça https://support.atlassian.com/trello/docs/searching-for-cards-all-boards/
query = "idShort:26"
Trello_API_Search(query, API_KEY, TOKEN)
# print(json.dumps(json.loads(response.text), sort_keys=True, indent=4, separators=(",", ": ")))