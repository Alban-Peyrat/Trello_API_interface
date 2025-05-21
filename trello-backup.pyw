# -*- encoding: utf-8 -*-
#!/usr/bin/env python3 -u

# MIT License

# Copyright (c) 2022 Smarty

# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:

# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

# NOTE: Various optional and subordinate components carry their own licensing
# requirements and restrictions.  Use of those components is subject to the terms
# and conditions outlined the respective license of each component.

import configparser
import os, sys
import json
import requests
import time
import io
import logging
from logging.handlers import RotatingFileHandler
from win10toast import ToastNotifier #for Windows notif

import dotenv
dotenv.load_dotenv()

# Internal import


configFile = 'trello-backup.config'
configFile = os.path.join(os.path.abspath(os.path.dirname(__file__)), configFile)

API_KEY = TOKEN = API_URL = ''

class Logger(object):
    def __init__(self, logsrep:str, service:str, level:str) -> None:
        self.__init_logs(logsrep, service, level)
        self.logger = logging.getLogger(service)

    def __init_logs(self, logsrep:str, programme:str, level:str) -> logging.Logger:
        # logs.py by @louxfaure, check file for more comments
        # D'aprés http://sametmax.com/ecrire-des-logs-en-python/
        logsfile = logsrep + "/" + programme + ".log"
        logger = logging.getLogger(programme)
        # Make sure the log level is correct
        level = level.strip().upper()
        if level not in ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]:
            level = "INFO"
        logger.setLevel(getattr(logging, level))
        # Formatter
        formatter = logging.Formatter(u'%(asctime)s :: %(levelname)s :: %(message)s')
        file_handler = RotatingFileHandler(logsfile, 'a', 100000000, 1, encoding="utf-8")
        file_handler.setLevel(getattr(logging, level))
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
        # For console
        stream_handler = logging.StreamHandler()
        stream_handler.setLevel(getattr(logging, level))
        stream_handler.setFormatter(formatter)
        logger.addHandler(stream_handler)

        logger.info('Logger initialised')

        return logger

    def critical(self, msg:str):
        """Basic log critical function"""
        self.logger.critical(f"{msg}")

    def debug(self, msg:str):
        """Log a debug statement logging first the service then the message"""
        self.logger.debug(f"{msg}")

    def info(self, msg:str):
        """Basic log info function"""
        self.logger.info(f"{msg}")

    def error(self, msg:str):
        """Basic log error function"""
        self.logger.error(f"{msg}")


def main():
	LOG = Logger(os.getenv("LOGS_FOLDER"), "ArchiRes_Trello_Save", "DEBUG")

	if os.path.isfile(configFile):
		config = configparser.RawConfigParser()
		config.read(configFile)
	else:
		LOG.critical(f"Config file {configFile} does not exist.")
		sys.exit('Config file "{0}" does not exist.'.format(configFile))

	global API_KEY, TOKEN, API_URL
	API_KEY = config.get('Credentials', 'API_KEY')
	TOKEN = config.get('Credentials', 'TOKEN')

	API_URL = config.get('Paths', 'API_URL')
	OUTPUT_DIRECTORY = config.get('Paths', 'OUTPUT_DIRECTORY')

	TOKEN_EXPIRATION = config.get('Options', 'TOKEN_EXPIRATION')
	APP_NAME = config.get('Options', 'APP_NAME')
	ORGANIZATION_IDS = config.get('Options', 'ORGANIZATION_IDS')
	ORGANIZATION_NAMES = config.get('Options', 'ORGANIZATION_NAMES')
	PRETTY_PRINT = config.get('Options', 'PRETTY_PRINT') == 'yes'

	if not API_KEY:
		LOG.critical("No API Key")
		LOG.info('You need an API key to run this app.')
		LOG.info('Visit this url: https://trello.com/1/appKey/generate')
		LOG.info('[IMPORTANT] Make sure to add the key to the config file.')
		sys.exit("No API key.")

	if not TOKEN:
		LOG.critical("No Token")
		LOG.info('You need a token to run this app.')
		LOG.info("Visit this url: {0}connect?key={1}&name={2}&response_type=token&expiration={3}".format(API_URL, API_KEY, APP_NAME, TOKEN_EXPIRATION))
		LOG.info('[IMPORTANT] Make sure to add the token to the config file.')
		sys.exit("No Token")

	if ORGANIZATION_NAMES and not ORGANIZATION_IDS:
		ORGANIZATION_IDS = get_organization_ids(ORGANIZATION_NAMES)

	# Parameters to get list of boards
	boardsPayload = {
		'key':API_KEY,
		'token':TOKEN,
		'filter':'open',
		'lists':'open',
	}
	# Parameters to get board contents
	boardPayload = {
		'key':API_KEY,
		'token':TOKEN,
		'fields':'all',
		'actions':'all',
		'action_fields':'all',
		'actions_limit':'1000',
		'cards':'all',
		'card_fields':'all',
		'card_attachments':'true',
		'lists':'all',
		'list_fields':'all',
		'members':'all',
		'member_fields':'all',
		'checklists':'all',
		'checklist_fields':'all',
		'organization':'false',
	}
	boards = requests.get(API_URL + "members/me/boards", params=boardsPayload)
	try:
		if len(boards.json()) <= 0:
			LOG.info('No boards found.')
			return
	except ValueError:
		LOG.error('Unable to access your boards. Check your key and token.')
		return
	if not os.path.exists(OUTPUT_DIRECTORY):
		os.makedirs(OUTPUT_DIRECTORY)

	# print('Backing up boards:')
	epoch_time = str(int(time.time()))

	for board in boards.json():
		if ORGANIZATION_IDS and (not board["idOrganization"] or not board["idOrganization"] in ORGANIZATION_IDS):
			continue

		# print(u"    - {0} - {1} ({2})".format(board["idOrganization"], board["name"], board["id"]))
		boardContents = requests.get(API_URL + "boards/" + board["id"], params=boardPayload)
		filename = boardFilename(OUTPUT_DIRECTORY, board, epoch_time)
		with io.open(filename, 'w', encoding='utf8') as file:
			args = dict( sort_keys=True, indent=4) if PRETTY_PRINT else dict()
			data = json.dumps(boardContents.json(), ensure_ascii=False, **args)
			file.write(data)
	
	notif_msg=""
	if not os.path.exists(filename):
		notif_msg = "Failed to save Trello board"
		LOG.critical(notif_msg)
	else:
		notif_msg=f"Successfully saved trello board : {filename}"
		LOG.info(notif_msg)
	# Init windows notification now that everything is done
	toaster = ToastNotifier()
	toaster.show_toast("[SID ArchiRès - Sauvegarde Trello]",
			notif_msg,
			icon_path=os.path.dirname(__file__) + "/ArchiRes_Theme/win_logo.ico",
			duration=10)

def boardFilename(output_dir, board, epoch_time):
	organization_id = sanitize(board["idOrganization"])
	boardName = sanitize(board["name"])

	formatted = u'{0}-{1}_'.format(organization_id, boardName)
	filename = formatted + epoch_time + '.json'
	return os.path.join(output_dir, filename)

def sanitize(name):
	if name is None:
		return "None"

	return name.replace("/","-").replace(":","-")

def get_organization_ids(ORGANIZATION_NAMES):
	selected_organizations = []
	for organization in ORGANIZATION_NAMES.split(','):
		selected_organizations.append(organization.strip())
	organization_ids = []

	# Parameters to get a list of organizations
	organizationsPayload = {
		'key':API_KEY,
		'token':TOKEN,
	}

	organizations = requests.get(API_URL + "members/my/organizations", params=organizationsPayload)
	if len(organizations.json()) <= 0:
		print('No organizations found.')
	else:
		for organization in organizations.json():
			if organization["name"] in selected_organizations:
				organization_ids.append(organization["id"])
	return organization_ids


if __name__ == '__main__':
	main()
