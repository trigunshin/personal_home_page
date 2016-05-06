from os import getenv

EMAILS = getenv('email_data', "")
DEBUG = getenv('env', 'dev')
SECRET = getenv('secret', 'abc123zyx098')
PASSWORD = getenv('password', 'password')
TWITCH_USERNAME = getenv('twitch_user', 'password')
