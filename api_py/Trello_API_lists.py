# -*- encoding: utf-8 -*-

# External imports
import requests
import json

class Trello_API_lists(object):
    """Trello_API_lists
    =======
    On init take as arguments :
    - api {str} : name of the API to call
        - "get_cards"
    - API_KEY {str}
    - TOKEN {str}
    - [optional] service {str} : name of the service
    - data {dict} : all informations needed to use the API
"""

    def __init__(self, api, API_KEY, TOKEN, service='Trello_Lists', data={}):
        # self.logger = logging.getLogger(service)
        self.endpoint = "https://api.trello.com/1/lists/"
        self.service = service
        self.payload = {
            'key': API_KEY,
            'token': TOKEN
            }
        self.headers = {
            "Accept":"application/json"
            }

        # Différentes API
        if api == "get_cards":
            self.HTTPmethod = "GET"
            self.url = self.endpoint + "/" + data["id"] + "/cards"
        
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