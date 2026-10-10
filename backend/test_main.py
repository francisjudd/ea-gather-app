import os
import unittest
from unittest import mock

from fastapi.testclient import TestClient

from churches import place_from_address, slugify
from db import get_db
from lookup import normalise_postcode
from main import app


class BackendRoutingTests(unittest.TestCase):
    def test_service_routes_are_unprefixed(self):
        # Included routers have no .path of their own; their routes are checked below.
        paths = {getattr(route, "path", None) for route in app.routes}
        for path in ("/", "/docs", "/redoc", "/openapi.json"):
            with self.subTest(path=path):
                self.assertIn(path, paths)

    def test_openapi_contains_service_health_route(self):
        self.assertIn("/", app.openapi()["paths"])
        self.assertEqual(app.root_path, "/openapi")

    def test_api_routes_are_unprefixed(self):
        paths = app.openapi()["paths"]
        for path in (
            "/churches",
            "/churches/{church_id}",
            "/initiatives",
            "/geocode",
            "/mp/lookup",
            "/admin/submissions",
            "/admin/submissions/{submission_id}",
        ):
            with self.subTest(path=path):
                self.assertIn(path, paths)

    def test_health_and_docs_behind_stripping_proxy(self):
        client = TestClient(app, root_path="/openapi")
        response = client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("API is running", response.json()["message"])
        docs = client.get("/docs")
        self.assertEqual(docs.status_code, 200)
        self.assertIn("/openapi/openapi.json", docs.text)
        schema = client.get("/openapi.json").json()
        self.assertIn({"url": "/openapi"}, schema["servers"])
        self.assertFalse(any(path.startswith("/openapi/") for path in schema["paths"]))


class HelperTests(unittest.TestCase):
    def test_normalise_postcode(self):
        self.assertEqual(normalise_postcode("dn13ln"), "DN1 3LN")
        self.assertEqual(normalise_postcode(" SW1A  1AA "), "SW1A 1AA")
        self.assertIsNone(normalise_postcode("DN1"))
        self.assertIsNone(normalise_postcode("hello"))

    def test_slugify(self):
        self.assertEqual(slugify("Warm spaces"), "warm-spaces")
        self.assertEqual(slugify("Older People Service"), "older-people-service")

    def test_place_from_address_skips_counties(self):
        self.assertEqual(place_from_address("Ward Street, Lostock Hall, Preston, Lancashire"), "Preston")
        self.assertEqual(place_from_address("Unit 3, Brooks Road, Lewes, East Sussex"), "Lewes")
        self.assertEqual(place_from_address("1 Main Street, Newry, County Down"), "Newry")
        self.assertEqual(place_from_address("16-18 Cross Street, London"), "London")
        self.assertEqual(place_from_address(""), "")


class AdminAuthTests(unittest.TestCase):
    def setUp(self):
        app.dependency_overrides[get_db] = lambda: None
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_refuses_when_token_not_configured(self):
        with mock.patch.dict(os.environ, {"ADMIN_TOKEN": ""}):
            response = self.client.get("/admin/submissions")
        self.assertEqual(response.status_code, 503)

    def test_rejects_missing_or_wrong_token(self):
        with mock.patch.dict(os.environ, {"ADMIN_TOKEN": "secret"}):
            for headers in ({}, {"Authorization": "Bearer wrong"}, {"Authorization": "secret"}):
                with self.subTest(headers=headers):
                    response = self.client.get("/admin/submissions", headers=headers)
                    self.assertEqual(response.status_code, 401)


if __name__ == "__main__":
    unittest.main()
