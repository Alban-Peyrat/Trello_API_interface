# -*- coding: utf-8 -*-

# External import
import PySimpleGUI as sg
import json
import re
from datetime import date

# Internal import
from ArchiRes_Theme.theme import *
# import Trello_API_get_labels as get_labels
import api_py.Trello_API_boards as boards
import api_py.Trello_API_cards as cards

service = "Python_Trello_Add_Card"

# Get GUI parameters
sg.set_options(font=font, icon=theme_name + "/logo.ico", window_location=window_location)
sg.theme_add_new(theme_name, theme)
sg.theme(theme_name)

# Load Trello API settings
with open('./settings.json', encoding="utf-8") as f:
    settings = json.load(f)

API_KEY = settings["API_KEY"]
TOKEN = settings["TOKEN"]
nom_createur = settings["nom_createur"]
tickets_url = settings["tickets_url"]
tickets_idLabel = settings["tickets_idLabel"]
board = settings["specific_board_id"]
idList = settings["create_card_default_list_id"]
label_colors = settings["label_colors"]
label_urgent = settings["label_urgent_id"]
label_add_card = settings["label_created_by_python_add_card"]
label_python_ar_ticket_to_link = settings["label_python_ar_ticket_to_link"]

# Get all labels
# LABELS = get_labels.Trello_API_get_labels(board, API_KEY=API_KEY, TOKEN=TOKEN).filter_by_color()
LABELS = boards.Trello_API_boards(api=boards.Apis.GET_LABELS, API_KEY=API_KEY, TOKEN=TOKEN, data={"id":board}).filter_by_color()

# Creates the selections for labels in the GUI
LABELS_GUI = {}
LABELS_TYPE_GUI = ["APPLI", "TYPE_DEMANDE", "DEV", "ECOLE"]
# for each label type
for label_type in LABELS_TYPE_GUI:
    label_type_list = []
    # Gets the name of every label
    for label in LABELS[label_colors[label_type]]:
        label_type_list.append(label["name"])
    
    label_type_list.sort()
    LABELS_GUI[label_type] = label_type_list


def get_label_id(label_name, label_type):
    for label in LABELS[label_colors[label_type]]:
        if label_name == label["name"]:
            return label["id"]

# # --------------- The Layout ---------------
layout = [
    # Name
    [sg.Text("Nom du ticket :")],
    [sg.Input(key="name", size=(50, None))],

    # Urgent
    [
        sg.Text("Urgent ?"),
        sg.Radio("OUI", "isUrgent", default=False, size=(3,1), key='urgentYES'),
        sg.Radio("Non", "isUrgent", default=True, size=(3,1), key="urgentNO")
    ],

    # Description
    [sg.Text("Description (format Markdown) :")],
    [sg.Multiline(f"_Mail du {date.today().strftime('%d/%m/%Y')} (Louise Vallière)_\n", size=(50,5), expand_x=True, expand_y=True, key="desc")],

    # Tickets liés
    [
        sg.Text("Lier des tickets (sans le #):"),
        sg.Input(size=(30, None), key="addCommentTickets")
    ],

    # Ajouter des labels
    [sg.Text("Sélectionner les étiquettes :")],
    [
        # Applis
        sg.Listbox(LABELS_GUI["APPLI"], size=(20, 5), key="labels_APPLI", select_mode=sg.LISTBOX_SELECT_MODE_MULTIPLE),
        # Type de demande
        sg.Listbox(LABELS_GUI["TYPE_DEMANDE"], size=(20, 5), key="labels_TYPE_DEMANDE", select_mode=sg.LISTBOX_SELECT_MODE_MULTIPLE),
        # Dev
        sg.Listbox(LABELS_GUI["DEV"], size=(15, 5), key="labels_DEV", select_mode=sg.LISTBOX_SELECT_MODE_MULTIPLE),
        # Écoles
        sg.Listbox(LABELS_GUI["ECOLE"], size=(20, 5), key="labels_ECOLE", select_mode=sg.LISTBOX_SELECT_MODE_MULTIPLE)
    ],

    # Valider
    [sg.Button('Créer le ticket', key="submit")]
]

# # --------------- Window Definition ---------------
# # Create the window
window = sg.Window("Ajouter un ticket au SID ArchiRès", layout)

# # --------------- Event loop or Window.read call ---------------
# # Display and interact with the Window
# event, values = window.read()
event, val = window.read()


if event == sg.WIN_CLOSED or event == 'Cancel': # if user closes window or clicks cancel
    print("Application quittée par l'usager")
    exit()

# Gather card infos
card_infos = {}
card_infos["name"] = val["name"]
card_infos["desc"] = "\n" + val["desc"]

# Labels
card_infos["idLabels"] = []
for label_type in LABELS_TYPE_GUI:
    # Gets the name of every label
    for label in val["labels_"+label_type]:
        card_infos["idLabels"].append(get_label_id(label, label_type))
# Label URGENT
if val["urgentYES"]:
    card_infos["idLabels"].append(label_urgent)
# Label pour idniquer que créé par python
card_infos["idLabels"].append(label_add_card)

# Tickets
# Utiliser une API pour tous ?
card_infos["tickets"] = val["addCommentTickets"]
tickets_base_regex = r"\d+";
ticket_comment = ""
has_AR_ticket = False
if card_infos["tickets"] != "":
    ticket_comment = "Tickets liés `{}` : ".format(service)
    for plat in tickets_url:
        tickets = re.findall(plat + tickets_base_regex, card_infos["tickets"])
        for ticket in tickets:
            ticket_comment += ticket + " "
            if plat == "AR":
                has_AR_ticket = True
                card_infos["idLabels"].append(label_python_ar_ticket_to_link)
                card_infos["desc"] = f"[Lié à #{ticket}]()\n" + card_infos["desc"]
            else:
                card_infos["desc"] = f"[Lié à #{ticket}]({tickets_url[plat]}{ticket[2:]})\n" + card_infos["desc"]
            
new_card = cards.Trello_API_cards(
    api="new_card",
    API_KEY=API_KEY,
    TOKEN=TOKEN,
    service=service,
    data={
        "idList":idList,
        "name":card_infos["name"],
        "desc":card_infos["desc"],
        "idLabels":card_infos["idLabels"]
    }
).data

# Publish first comment with IDs
first_comment = "__[N° ticket ArchiRès : {}]({})__ - ID : {} - Long ID : {}\n\nCréé par {} via l'application `{}`".format(new_card["idShort"], new_card["shortUrl"], new_card["shortLink"], new_card["id"], nom_createur, service)
cards.Trello_API_cards(api="new_comment",
    API_KEY=API_KEY,
    TOKEN=TOKEN,
    service=service,
    data={
        "id":new_card["id"],
        "text":first_comment
    }
)

# If tickets are linked : publish a comment with those tickets
if ticket_comment != "":
    cards.Trello_API_cards(api="new_comment",
        API_KEY=API_KEY,
        TOKEN=TOKEN,
        service=service,
        data={
            "id":new_card["id"],
            "text":ticket_comment
        }
    )

    # Adds the label
    for plat in tickets_idLabel:
        tickets = re.findall(plat + tickets_base_regex, ticket_comment)
        if len(tickets) > 0:
            cards.Trello_API_cards(api="add_label",
                API_KEY=API_KEY,
                TOKEN=TOKEN,
                service=service,
                data={
                    "id":new_card["id"],
                    "value":tickets_idLabel[plat]
                }
            )

# Deletes the label `__CREATED_BY_PYTHON`
cards.Trello_API_cards(api="remove_label",
    API_KEY=API_KEY,
    TOKEN=TOKEN,
    service=service,
    data={
        "id":new_card["id"],
        "idLabel":label_add_card
    }
)

# Update la description
new_card["desc"] = "__[Ticket #AR{}]({})__\n".format(new_card["idShort"], new_card["shortUrl"]) + new_card["desc"]
new_card = cards.Trello_API_cards(api="update_card",
    API_KEY=API_KEY,
    TOKEN=TOKEN,
    service=service,
    data={
        "id":new_card["id"],
        "desc":new_card["desc"]
    }
).data


# Output les infos rentrées dans la console
print("Nom du ticket :", new_card["name"])
if val["urgentYES"]:
    print("/!\\ URGENT /!\\")
print("Description :\n" + new_card["desc"])
print("Applications :", " ; ".join(val["labels_APPLI"]))
print("Type de demande :", " ; ".join(val["labels_TYPE_DEMANDE"]))
print("Développement :", " ; ".join(val["labels_DEV"]))
print("Écoles :", " ; ".join(val["labels_ECOLE"]))
print(first_comment)
print(ticket_comment)
print("\n\n\n")

# # --------------- Closing the window ---------------
window.close()