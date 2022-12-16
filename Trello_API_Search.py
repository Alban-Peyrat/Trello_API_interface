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
        self.url = self.endpoint
        self.payload = {
            'query': self.query,
            'key': API_KEY,
            'token': TOKEN,
            "idBoards": [board], #temporaire
            "modelTypes": ["cards"], #temporaire
            "card_fields": "name,desc,idBoard,idLabels,idList,idMembers,labels,shortLink,shortUrl,url",#temporaire
            "cards_limit":1000
            }
        self.headers = {
            "Accept":"application/json"
            }
        try:
            r = requests.request("GET", self.url, headers=self.headers, params=self.payload)
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

# Lire ça https://support.atlassian.com/trello/docs/searching-for-cards-all-boards/
# query = 'comment:"N° ticket ArchiRès : 111" board:IDDDDD'