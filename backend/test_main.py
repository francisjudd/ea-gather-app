import unittest

from main import app


class BackendRoutingTests(unittest.TestCase):
    def test_public_routes_have_openapi_prefix(self):
        paths = {route.path for route in app.routes}
        for path in ("/openapi", "/openapi/", "/openapi/docs", "/openapi/redoc", "/openapi/openapi.json"):
            with self.subTest(path=path):
                self.assertIn(path, paths)

    def test_openapi_contains_public_health_route(self):
        self.assertIn("/openapi", app.openapi()["paths"])


if __name__ == "__main__":
    unittest.main()
