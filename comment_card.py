# -*- coding: utf-8 -*-

# External import
import json
import re
import argparse

# Internal import
from ArchiRes_Theme.theme import *
# import Trello_API_get_labels as get_labels
import api_py.Trello_API_boards as boards
import api_py.Trello_API_cards as cards
import api_py.Trello_API_Search as search

# Add command line arg
parser = argparse.ArgumentParser()
parser.add_argument("-i", "--id", type=int, default=-1, required=False)
args = parser.parse_args()

service = "Python_Trello_Comment_Card"

# Load Trello API settings
with open('./settings.json', encoding="utf-8") as f:
    settings = json.load(f)

API_KEY = settings["API_KEY"]
TOKEN = settings["TOKEN"]
board = settings["specific_board_id"]
nom_createur = settings["nom_createur"]

# Get card
ticket_nb = None
if args.id == -1:
    ticket_nb = input("Numéro du ticket (sans #AR) : ")
else:
    ticket_nb = args.id

res = search.Trello_API_Search(f'comment:"N° ticket ArchiRès : {ticket_nb}" board:{board}', board, API_KEY=API_KEY, TOKEN=TOKEN)

def __leave():
    print("\n\n\n")
    exit()

# Leave if no request found (or multiple)
if len(res.data["cards"]) != 1:
    print("Erreur : {} tickets trouvés".format(len(res.data["cards"])))
    __leave()

# Retrieve data
card_id = res.data["cards"][0]["id"]
current_list_id = res.data["cards"][0]["idList"]

# Show what request was found
print("Nom : " + res.data["cards"][0]["name"])
print("Description :\n" + res.data["cards"][0]["desc"] + "\n")
comment = input("Commentaire à ajouter (laisser vide pour ignorer):\n")

# Publish commetn if needed
if re.sub(r"\s+", "", comment) != "":
    cards.Trello_API_cards(api="new_comment",
        API_KEY=API_KEY,
        TOKEN=TOKEN,
        service=service,
        data={
            "id":card_id,
            "text":f"{comment}\n\nCréé par {nom_createur} via l'application `{service}`"
        }
    )
    print("Commentaire envoyé")
else:
    print("Aucun commentaire ajouté")

# get lists
res = boards.Trello_API_boards(
    api=boards.Apis.GET_LISTS,
    API_KEY=API_KEY,
    TOKEN=TOKEN,
    service=service,
    data={
        "id":board
    }
)

lists = res.data
lists_as_text = ""
for index, value in enumerate(lists):
    lists_as_text += f"{index} : {value['name']}\n"

# Asks user for new list
print(f"Nouvelle liste ? (Laisser vide pour ne rien faire)\n{lists_as_text}")
new_list_index = input("List index : ")
# List error management
new_list_index = re.sub(r"\s+", "", new_list_index)
if not new_list_index.isdigit():
    print("Changement de liste ignoré")
    __leave()
new_list_index = int(new_list_index)
if new_list_index < 0 or new_list_index > (len(lists)-1):
    print("Index de liste erroné, pas de changement de liste")
    __leave()
new_list_id = lists[new_list_index]["id"]
if new_list_id == current_list_id:
    print(f"La liste choisie ({lists[new_list_index]['name']}) est déjà la liste de cette carte")
    __leave()

# Move list
cards.Trello_API_cards(
    api="update_card",
    API_KEY=API_KEY,
    TOKEN=TOKEN,
    service=service,
    data={
        "id":card_id,
        "idList":new_list_id
    })
__leave()

