# -*- coding: utf-8 -*-

# External import
import json
import re
import webbrowser
import argparse

# Internal import
import api_py.Trello_API_Search as search

# Add command line arg
parser = argparse.ArgumentParser()
parser.add_argument("-i", "--id", type=int, default=-1, required=False)
args = parser.parse_args()

# Load Trello API settings
with open('./settings.json', encoding="utf-8") as f:
    settings = json.load(f)

API_KEY = settings["API_KEY"]
TOKEN = settings["TOKEN"]
board = settings["specific_board_id"]
service = "Python_Trello_Open_Card"

ticket_nb = None
if args.id == -1:
    ticket_nb = input("Numéro du ticket (sans #AR) : ")
else:
    ticket_nb = args.id

res = search.Trello_API_Search(f'comment:"N° ticket ArchiRès : {ticket_nb}" board:{board}', API_KEY=API_KEY, TOKEN=TOKEN)

if len(res.data["cards"]) == 1:
    webbrowser.open(res.data["cards"][0]["url"], new=0, autoraise=True)
    print("Ouverture du ticket : " + res.data["cards"][0]["name"])
else:
    print("Erreur : {} tickets trouvés".format(len(res.data["cards"])))
print("\n\n\n")