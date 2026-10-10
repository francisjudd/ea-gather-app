import os
import unittest
from unittest import mock

from fastapi.testclient import TestClient

from churches import place_from_address, slugify
from db import get_db
from lookup import normalise_postcode
from main import app


class BackendRoutingTests(unittest.TestCase):
    def test_public_routes_are_served_with_openapi_prefix(self):
        # vercel.json routes /openapi/* to this service, forwarding the full
        # /openapi path, so the FastAPI routes are defined with the prefix.
        paths = {getattr(route, "path", None) for route in app.routes}
        for path in ("/openapi/docs", "/openapi/redoc", "/openapi/openapi.json"):
            with self.subTest(path=path):
                self.assertIn(path, paths)

    def test_openapi_contains_public_health_route(self):
        self.assertIn("/", app.openapi()["paths"])

    def test_api_routes_are_served_with_openapi_prefix(self):
        paths = app.openapi()["paths"]
        for path in (
            "/openapi/churches",
            "/openapi/churches/{church_id}",
            "/openapi/initiatives",
            "/openapi/geocode",
            "/openapi/mp/lookup",
            "/openapi/admin/submissions",
            "/openapi/admin/submissions/{submission_id}",
            "/openapi/areas",
            "/openapi/areas/{slug}",
        ):
            with self.subTest(path=path):
                self.assertIn(path, paths)


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
            response = self.client.get("/openapi/admin/submissions")
        self.assertEqual(response.status_code, 503)

    def test_rejects_missing_or_wrong_token(self):
        with mock.patch.dict(os.environ, {"ADMIN_TOKEN": "secret"}):
            for headers in ({}, {"Authorization": "Bearer wrong"}, {"Authorization": "secret"}):
                with self.subTest(headers=headers):
                    response = self.client.get("/openapi/admin/submissions", headers=headers)
                    self.assertEqual(response.status_code, 401)


if __name__ == "__main__":
    unittest.main()
