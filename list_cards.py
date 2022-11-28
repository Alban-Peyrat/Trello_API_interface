# -*- coding: utf-8 -*-

# VOIR LIST_TICKETS pour la version JS

# External import
# import PySimpleGUI as sg
import json
# import re

# Internal import
# from ArchiRes_Theme.theme import *
import Trello_API_boards as boards
import Trello_API_lists as lists

service = "Python_Trello_List_Cards"

# Load Trello API settings
with open('./settings.json', encoding="utf-8") as f:
    settings = json.load(f)

API_KEY = settings["API_KEY"]
TOKEN = settings["TOKEN"]
nom_createur = settings["nom_createur"]
board = settings["specific_board_id"]

# Get all lists
all_list = boards.Trello_API_boards(api="get_lists",
    API_KEY=API_KEY,
    TOKEN=TOKEN,
    service=service,
    data={
        "id":board
    }
).data

for list in all_list:
    print(list)