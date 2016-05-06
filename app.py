import email, imaplib
from config import settings
from dateutil import parser
from flask import Flask, jsonify, redirect, render_template, session
from jinja2 import Markup
from os import getenv

app = Flask(__name__)
DEBUG = False if settings.DEBUG == 'prod' else True
app.config['SECRET_KEY'] = settings.SECRET

pair_delimiter = '|_|'
pwd_delimiter = '||'
email_data_string = settings.EMAILS
email_dict = {}
if email_data_string:
    results = [pair.split('||') for pair in email_data_string.split('|_|')]
    for addr, passw in results:
        email_dict[addr] = passw

email_headers = ['Subject', 'Date']

def _get_email_data(client, uid, email_headers):
    ret = {}

    result, data = client.uid('fetch', uid, '(RFC822)')
    raw_email = data[0][1]
    email_message = email.message_from_string(raw_email)

    ret['to'] = email_message['To']
     # for parsing "Yuji Tomita" <yuji@grovemade.com>
    ret['from'] = email.utils.parseaddr(email_message['From'])

    for key, val in email_message.items():
        if key in email_headers:
            if key == 'Date':
                ret[key.lower()] = parser.parse(val)
            else:
                ret[key.lower()] = val

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
    try:
        email_data = [_get_email_data(mail, uid, email_headers) for uid in email_uids if not uid == '']
    finally:
        mail.close()
        mail.logout()

    return email_data


@app.route('/api/imap/<addr>')
def get_mail(addr):
    if not session.get('authorized', False):
        return jsonify(emails=[])
    passw = email_dict.get(addr, False)
    ret = []
    if passw:
        ret = _fetch_mail(addr, passw, email_headers)
    return jsonify(emails=ret)

@app.route('/api/imap/list')
def get_addresses():
    if not session.get('authorized', False):
        return jsonify(emails=[])
    return jsonify(emails=email_dict.keys())

@app.route('/api/auth/login/<password>')
def login(password):
    if password == settings.PASSWORD:
        session['authorized'] = True
        return 'success'
    return 'fail', 401

@app.route('/api/auth/logout')
def logout():
    session['authorized'] = False
    return 'success'

@app.route('/')
def hello_world():
    return redirect('static/index.html', 302)

@app.route('/j')
def hello_app():
    return "hi"

if __name__ == '__main__':
    app.run(port=4999, debug=DEBUG)
