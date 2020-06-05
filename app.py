import os

from flask import Flask, jsonify, render_template, request
from flask_socketio import SocketIO, emit
import sys


app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

channels = {'general': []}
channelNames = ['general']
users = []
color = []
colors = ['#0388fc', '#eb4034', '#7e42f5', '#eb8034','#4287f5', '#d9eb34', '#7deb34', '#42c5f5', '#3aeb34', '#1d8020', '#425df5', '#e042f5', '#f54299', '#ebb134']
colorCounter = {'counter': 0}

@app.route("/")
def index():
    return render_template("index.html", channelNames=channelNames, users=users, color=color)

@app.route("/openChannel", methods=["POST"])
def openChannel():
    return jsonify(channels)

@app.route("/checkExistingUsername", methods=["POST"])
def check():
    name = request.form.get("name") 
    result = {'exists': checkUsername(name)}
    return jsonify(result)

@socketio.on("new channel")
def newChannel(data):
    channelName = data["channel"]
    if channelName in channelNames:
        return
    channels[channelName] = []
    channelNames.append(channelName)
    emit("add new channel", channelName, broadcast=True)

@socketio.on("user online")
def online(data):
    for channel in channels[data["channel"]]:
        if (channel['type'] == 'online' and channel['data']['name'] == data["user"]):
            return
    if not checkUsername(data["user"]):
        users.append(data["user"])
        color.append(colors[colorCounter['counter']])
        if (colorCounter['counter'] <= 13):
            colorCounter['counter'] += 1
        else:
            colorCounter['counter'] = 0
    newInput = {'type': 'online',
                'data': {
                    'name': data["user"],
                    'date': data["date"],
                    'color': color[getColor(data["user"])]
                }}
    channels[data["channel"]].append(newInput)
    newInput["channel"] = data["channel"]
    emit("user is online", newInput , broadcast=True)

@socketio.on("user message")
def message(data):
    newInput = {'type': 'message',
                'data': {
                    'name': data["user"],
                    'date': data["date"],
                    'message': data["message"],
                    'color': color[getColor(data["user"])]
                }}
    channels[data["channel"]].append(newInput)
    newInput["channel"] = data["channel"]
    emit("user post message", newInput, broadcast=True)

@socketio.on("user status")
def newUser(data):
    emit("new user", data, broadcast=True)

def checkUsername(name):
    for user in users:
        if (user == name):
            return True
    return False

def getColor(name):
    for x in range(len(users)):
        if (users[x] == name):
            return x