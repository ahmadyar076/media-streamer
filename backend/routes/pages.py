from flask import Blueprint, render_template

pages_bp = Blueprint("pages", __name__)


@pages_bp.route("/")
def index():
    return render_template("index.html")


@pages_bp.route("/library")
def library():
    return render_template("library.html")


@pages_bp.route("/player/<media_id>")
def player(media_id):
    return render_template("player.html", media_id=media_id)
