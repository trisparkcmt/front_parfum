#!/usr/bin/env bash
# exit on error
set -o errexit

# Installer les dépendances
pip install -r requirements.txt

# Appliquer les migrations de base de données
python manage.py migrate

# Collecter les fichiers statiques
python manage.py collectstatic --no-input
