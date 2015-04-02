from os import getenv

EMAILS = getenv('email_data', "")
DEBUG = getenv('env', 'dev')
