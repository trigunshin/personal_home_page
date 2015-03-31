import email, imaplib
from config import settings
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
print results


def _fetch_mail(username, password):
    mail = imaplib.IMAP4_SSL('imap.gmail.com')
    mail.login(username, password)
    mail.select("inbox")

    result, data = mail.uid("search", None, "UNSEEN")
    if not result == 'OK':
        print result, data
        return None

    latest_email_uid = data[0].split()[-1]
    result, data = mail.uid('fetch', latest_email_uid, '(RFC822)')
    raw_email = data[0][1]
    email_message = email.message_from_string(raw_email)

    print email_message['To']
    print email.utils.parseaddr(email_message['From']) # for parsing "Yuji Tomita" <yuji@grovemade.com>
    print email_message.items() # print all headers
    # re-mark unread
    mail.uid('STORE', latest_email_uid, '-FLAGS', '\SEEN')
    mail.close()
    mail.logout()


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