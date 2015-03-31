import email, imaplib
from config import settings
from dateutil import parser
from flask import Flask, redirect, render_template
from jinja2 import Markup
from os import getenv

app = Flask(__name__)

pair_delimiter = '|_|'
pwd_delimiter = '||'
email_data_string = settings.EMAILS
if email_data_string:
    results = [pair.split('||') for pair in email_data_string.split('|_|')]
else:
    results = []

email_headers = ['Subject', 'Date']

def _get_email_data(client, uid, email_headers):
    ret = {}

    result, data = client.uid('fetch', uid, '(RFC822)')
    raw_email = data[0][1]
    email_message = email.message_from_string(raw_email)

    ret['to'] = email_message['To']
     # for parsing "Yuji Tomita" <yuji@grovemade.com>
    ret['from'] = email.utils.parseaddr(email_message['From'])

    ret['headers'] = {}
    for key, val in email_message.items():
        if key in email_headers:
            if key == 'Date':
                ret[key] = parser.parse(val)
            else:
                ret[key] = val

    # re-mark unread
    client.uid('STORE', uid, '-FLAGS', '\SEEN')

    return ret

def _fetch_mail(username, password, email_headers):
    mail = imaplib.IMAP4_SSL('imap.gmail.com')
    mail.login(username, password)
    mail.select("inbox")

    result, data = mail.uid("search", None, "UNSEEN")
    if not result == 'OK':
        print result, data
        return None

    email_uids = data[0].split(' ')
    email_data = [_get_email_data(mail, uid, email_headers) for uid in email_uids]
    # latest_email_uid = email_uids[-1]

    mail.close()
    mail.logout()

    return email_data


@app.route('/gmail/imap')
def get_mail():
    pass

@app.route('/')
def hello_world():
    return redirect('static/index.html', 302)

@app.route('/j')
def hello_app():
    return "hi"

if __name__ == '__main__':
    app.run(debug=True)