import os
import tempfile

import pytest

from transitops import create_app
from transitops.db import init_db
from transitops.seed import seed


@pytest.fixture
def app():
    fd, path = tempfile.mkstemp(suffix=".sqlite")
    os.close(fd)
    app = create_app({"TESTING": True, "DATABASE": path})
    with app.app_context():
        init_db()
        seed()
    yield app
    os.unlink(path)


@pytest.fixture
def client(app):
    return app.test_client()


def login(client, email, password="transit123"):
    return client.post("/auth/login",
                       data={"email": email, "password": password, "role": ""},
                       follow_redirects=True)


@pytest.fixture
def as_dispatcher(client):
    login(client, "raven.k@transitops.in")
    return client


@pytest.fixture
def as_fleet_manager(client):
    login(client, "meera.f@transitops.in")
    return client
