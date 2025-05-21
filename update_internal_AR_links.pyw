# -*- coding: utf-8 -*-

# External import
import json
import re

# Internal import
from ArchiRes_Theme.theme import *
# import Trello_API_get_labels as get_labels
import api_py.Trello_API_cards as cards
import api_py.Trello_API_Search as search

service = "Python_Trello_Comment_Card"

# Load Trello API settings
with open('./settings.json', encoding="utf-8") as f:
    settings = json.load(f)

API_KEY = settings["API_KEY"]
TOKEN = settings["TOKEN"]
board = settings["specific_board_id"]
nom_createur = settings["nom_createur"]
label_python_ar_ticket_to_link = settings["label_python_ar_ticket_to_link"]

res = search.Trello_API_Search(f'label:"PYTHON_AR_TICKET_TO_LINK" board:{board}', board, API_KEY=API_KEY, TOKEN=TOKEN)

# For each card to update
card_list = res.data["cards"]
for card in card_list:
    card_id:str = card["id"]
    card_desc:str = card["desc"]

    # regexp find \[Lié à \#AR(\d+)\]\(\)
    # For each AR request not linked
    for match in re.findall(r"\[Lié à \#AR\d+\]\(\)", card_desc):
        linked_card_id = re.findall(r"AR(\d+)", match)[0]
        # Get the link
        link_res = search.Trello_API_Search(f'comment:"N° ticket ArchiRès : {linked_card_id}" board:{board}', board, API_KEY=API_KEY, TOKEN=TOKEN)

        # Leave if no request found (or multiple)
        if len(link_res.data["cards"]) != 1:
            continue

        linked_card_url = link_res.data["cards"][0]["shortUrl"]

        # Update the card desc
        card_desc = card_desc.replace(f'[Lié à #AR{linked_card_id}]()', f'[Lié à #AR{linked_card_id}]({linked_card_url})')

    # Update the card
    updated_card = cards.Trello_API_cards(
        api="update_card",
        API_KEY=API_KEY,
        TOKEN=TOKEN,
        service=service,
        data={
            "id":card_id,
            "desc":card_desc
        }
    ).data

    # Deletes the label `__CREATED_BY_PYTHON` if every AR request is linked
    if len(re.findall(r"\[Lié à \#AR\d+\]\(\)", updated_card["desc"])) == 0:
        cards.Trello_API_cards(api="remove_label",
            API_KEY=API_KEY,
            TOKEN=TOKEN,
            service=service,
            data={
                "id":card_id,
                "idLabel":label_python_ar_ticket_to_link
            }
        )