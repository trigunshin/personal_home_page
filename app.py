from flask import Flask, redirect

app = Flask(__name__)

@app.route('/')
def hello_world():
    return redirect('static/index.html', 302)

if __name__ == '__main__':
    app.run()