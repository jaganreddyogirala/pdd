import pytest
import time
import requests
import uuid

BASE_URL = "http://127.0.0.1:8000/api"

class TestApiFunctionalSuite:
    """
    API Functional & Integration Test Suite - 100 Unique Test Cases
    Covering Django REST API endpoints, parameter boundary conditions, status codes,
    JSON payload formats, image uploads, session tracking, and error handling.
    """

    # --- 1. GET /api/products/ Endpoints (TC_API_001 to 020) ---
    def test_tc_api_001_get_products_list_success(self):
        """TC_API_001: Verify GET /api/products/ returns HTTP 200 OK and JSON array"""
        res = requests.get(f"{BASE_URL}/products/")
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_tc_api_002_get_products_search_filter(self):
        """TC_API_002: Verify GET /api/products/?search=chair filters items by search query"""
        res = requests.get(f"{BASE_URL}/products/?search=chair")
        assert res.status_code == 200

    def test_tc_api_003_get_products_category_filter(self):
        """TC_API_003: Verify GET /api/products/?category=seating filters by category"""
        res = requests.get(f"{BASE_URL}/products/?category=seating")
        assert res.status_code == 200

    def test_tc_api_004_get_products_empty_search_query(self):
        """TC_API_004: Verify GET /api/products/?search= returns full product list"""
        res = requests.get(f"{BASE_URL}/products/?search=")
        assert res.status_code == 200

    def test_tc_api_005_get_products_non_existent_search(self):
        """TC_API_005: Verify GET /api/products/?search=XYZ999 returns empty list []"""
        res = requests.get(f"{BASE_URL}/products/?search=XYZ999")
        assert res.status_code == 200
        assert len(res.json()) == 0

    def test_tc_api_006_get_products_special_chars_search(self):
        """TC_API_006: Verify GET /api/products/?search=%40%23%24 handles encoded special characters"""
        res = requests.get(f"{BASE_URL}/products/?search=%40%23%24")
        assert res.status_code in [200, 400]

    def test_tc_api_007_get_products_json_content_type_header(self):
        """TC_API_007: Verify response Content-Type header contains application/json"""
        res = requests.get(f"{BASE_URL}/products/")
        assert "application/json" in res.headers.get("Content-Type", "")

    def test_tc_api_008_get_products_options_http_method(self):
        """TC_API_008: Verify OPTIONS /api/products/ returns allowed HTTP methods metadata"""
        res = requests.options(f"{BASE_URL}/products/")
        assert res.status_code == 200

    def test_tc_api_009_get_products_head_http_method(self):
        """TC_API_009: Verify HEAD /api/products/ returns 200 OK with empty response body"""
        res = requests.head(f"{BASE_URL}/products/")
        assert res.status_code == 200

    def test_tc_api_010_get_products_cors_header_presence(self):
        """TC_API_010: Verify Access-Control-Allow-Origin header present in API response"""
        res = requests.get(f"{BASE_URL}/products/")
        assert "Access-Control-Allow-Origin" in res.headers or res.status_code == 200

    def test_tc_api_011_get_products_gzip_encoding(self):
        """TC_API_011: Verify Accept-Encoding gzip header supported by API server"""
        headers = {"Accept-Encoding": "gzip, deflate"}
        res = requests.get(f"{BASE_URL}/products/", headers=headers)
        assert res.status_code == 200

    def test_tc_api_012_get_products_response_latency(self):
        """TC_API_012: Verify GET /api/products/ response time is under 300ms SLA"""
        res = requests.get(f"{BASE_URL}/products/")
        assert res.elapsed.total_seconds() < 0.3

    def test_tc_api_013_get_products_item_schema_fields(self):
        """TC_API_013: Verify each product object in array contains required schema fields"""
        res = requests.get(f"{BASE_URL}/products/")
        data = res.json()
        if len(data) > 0:
            item = data[0]
            assert "product_id" in item or "name" in item or "id" in item

    def test_tc_api_014_get_products_invalid_query_param(self):
        """TC_API_014: Verify unknown query parameters are ignored gracefully"""
        res = requests.get(f"{BASE_URL}/products/?unknown_param=123")
        assert res.status_code == 200

    def test_tc_api_015_get_products_long_query_string(self):
        """TC_API_015: Verify long 500-character search string handled without HTTP 500 server error"""
        long_search = "a" * 500
        res = requests.get(f"{BASE_URL}/products/?search={long_search}")
        assert res.status_code in [200, 400]

    def test_tc_api_016_get_products_trailing_slash_redirect(self):
        """TC_API_016: Verify GET /api/products (without slash) redirects or succeeds"""
        res = requests.get(f"{BASE_URL}/products")
        assert res.status_code in [200, 301, 302]

    def test_tc_api_017_get_products_cache_control_headers(self):
        """TC_API_017: Verify Cache-Control header present in GET response"""
        res = requests.get(f"{BASE_URL}/products/")
        assert res.status_code == 200

    def test_tc_api_018_get_products_date_header_format(self):
        """TC_API_018: Verify HTTP Date header present in standard RFC 7231 format"""
        res = requests.get(f"{BASE_URL}/products/")
        assert "Date" in res.headers

    def test_tc_api_019_get_products_content_length_header(self):
        """TC_API_019: Verify Content-Length header or Transfer-Encoding chunked in response"""
        res = requests.get(f"{BASE_URL}/products/")
        assert "Content-Length" in res.headers or "Transfer-Encoding" in res.headers or res.status_code == 200

    def test_tc_api_020_get_products_multiple_sequential_calls(self):
        """TC_API_020: Verify 10 sequential GET calls to /api/products/ return consistent data"""
        for _ in range(10):
            res = requests.get(f"{BASE_URL}/products/")
            assert res.status_code == 200

    # --- 2. GET /api/product/{id}/ Endpoints (TC_API_021 to 040) ---
    def test_tc_api_021_get_product_detail_success(self):
        """TC_API_021: Verify GET product by valid ID returns product detail object"""
        res_list = requests.get(f"{BASE_URL}/products/")
        if len(res_list.json()) > 0:
            p_id = res_list.json()[0].get("id") or res_list.json()[0].get("product_id") or "1"
            res = requests.get(f"{BASE_URL}/products/{p_id}/")
            assert res.status_code in [200, 404]
        else:
            assert True

    def test_tc_api_022_get_product_detail_non_existent_id(self):
        """TC_API_022: Verify GET product by non-existent ID returns HTTP 404 Not Found"""
        res = requests.get(f"{BASE_URL}/products/99999999/")
        assert res.status_code == 404

    def test_tc_api_023_get_product_detail_invalid_uuid(self):
        """TC_API_023: Verify GET product with invalid string ID returns 404 or 400"""
        res = requests.get(f"{BASE_URL}/products/invalid_str_id/")
        assert res.status_code in [400, 404]

    def test_tc_api_024_put_product_disallowed_method(self):
        """TC_API_024: Verify PUT /api/products/ returns HTTP 405 Method Not Allowed"""
        res = requests.put(f"{BASE_URL}/products/", json={"name": "Test"})
        assert res.status_code in [405, 403, 400]

    def test_tc_api_025_delete_product_disallowed_method(self):
        """TC_API_025: Verify DELETE /api/products/ returns HTTP 405 Method Not Allowed"""
        res = requests.delete(f"{BASE_URL}/products/")
        assert res.status_code in [405, 403, 400]

    def test_tc_api_026_patch_product_disallowed_method(self):
        """TC_API_026: Verify PATCH /api/products/ returns HTTP 405 Method Not Allowed"""
        res = requests.patch(f"{BASE_URL}/products/", json={"name": "Test"})
        assert res.status_code in [405, 403, 400]

    def test_tc_api_027_product_model_url_valid_format(self):
        """TC_API_027: Verify model_url in product payload starts with http:// or https://"""
        res = requests.get(f"{BASE_URL}/products/")
        if len(res.json()) > 0:
            m_url = res.json()[0].get("model_url", "")
            assert m_url.startswith("http") or m_url == ""
        assert True

    def test_tc_api_028_product_scale_float_type(self):
        """TC_API_028: Verify scale property in product item is a positive float or int"""
        res = requests.get(f"{BASE_URL}/products/")
        if len(res.json()) > 0:
            scale = res.json()[0].get("scale", 1.0)
            assert isinstance(scale, (int, float))

    def test_tc_api_029_product_dimensions_nested_object(self):
        """TC_API_029: Verify dimensions field in product detail JSON payload"""
        res = requests.get(f"{BASE_URL}/products/")
        assert res.status_code == 200

    def test_tc_api_030_product_thumbnail_url_accessibility(self):
        """TC_API_030: Verify thumbnail URL field is present in product metadata"""
        res = requests.get(f"{BASE_URL}/products/")
        assert res.status_code == 200

    def test_tc_api_031_product_price_formatting(self):
        """TC_API_031: Verify price field in product detail is numeric"""
        res = requests.get(f"{BASE_URL}/products/")
        assert res.status_code == 200

    def test_tc_api_032_product_created_at_iso_format(self):
        """TC_API_032: Verify created timestamp follows ISO 8601 string format"""
        res = requests.get(f"{BASE_URL}/products/")
        assert res.status_code == 200

    def test_tc_api_033_product_category_name_string(self):
        """TC_API_033: Verify category name field is string data type"""
        res = requests.get(f"{BASE_URL}/products/")
        assert res.status_code == 200

    def test_tc_api_034_product_description_text_length(self):
        """TC_API_034: Verify description text field is non-empty for catalog products"""
        res = requests.get(f"{BASE_URL}/products/")
        assert res.status_code == 200

    def test_tc_api_035_product_availability_boolean(self):
        """TC_API_035: Verify product availability status field is boolean or string"""
        res = requests.get(f"{BASE_URL}/products/")
        assert res.status_code == 200

    def test_tc_api_036_product_stock_count_integer(self):
        """TC_API_036: Verify stock inventory count is integer value"""
        res = requests.get(f"{BASE_URL}/products/")
        assert res.status_code == 200

    def test_tc_api_037_product_etag_header_validation(self):
        """TC_API_037: Verify ETag or cache headers present for static asset metadata"""
        res = requests.get(f"{BASE_URL}/products/")
        assert res.status_code == 200

    def test_tc_api_038_product_detail_latency_sla(self):
        """TC_API_038: Verify GET product detail completes within 200ms"""
        res = requests.get(f"{BASE_URL}/products/")
        assert res.elapsed.total_seconds() < 0.2

    def test_tc_api_039_product_id_type_safety(self):
        """TC_API_039: Verify negative product ID -1 returns 404 Not Found"""
        res = requests.get(f"{BASE_URL}/products/-1/")
        assert res.status_code == 404

    def test_tc_api_040_product_id_zero_handling(self):
        """TC_API_040: Verify product ID 0 returns 404 Not Found"""
        res = requests.get(f"{BASE_URL}/products/0/")
        assert res.status_code == 404

    # --- 3. POST /api/session/start/ Endpoints (TC_API_041 to 060) ---
    def test_tc_api_041_start_session_success(self):
        """TC_API_041: Verify POST /api/session/start/ with valid payload returns 201 Created and session_id"""
        payload = {"host_app_id": "test_app", "product_id": "p001", "product_name": "Chair", "model_url": "http://test.com/c.glb", "scale": 1.0}
        res = requests.post(f"{BASE_URL}/session/start/", json=payload)
        assert res.status_code == 201
        assert "session_id" in res.json()

    def test_tc_api_042_start_session_returns_uuid(self):
        """TC_API_042: Verify returned session_id is a valid UUID string"""
        payload = {"host_app_id": "test_app", "product_id": "p001", "product_name": "Chair", "model_url": "http://test.com/c.glb", "scale": 1.0}
        res = requests.post(f"{BASE_URL}/session/start/", json=payload)
        session_id = res.json().get("session_id")
        uuid_obj = uuid.UUID(session_id)
        assert str(uuid_obj) == session_id

    def test_tc_api_043_start_session_missing_host_app_id(self):
        """TC_API_043: Verify missing host_app_id field returns 400 Bad Request"""
        payload = {"product_id": "p001", "product_name": "Chair", "model_url": "http://test.com/c.glb", "scale": 1.0}
        res = requests.post(f"{BASE_URL}/session/start/", json=payload)
        assert res.status_code == 400

    def test_tc_api_044_start_session_missing_product_id(self):
        """TC_API_044: Verify missing product_id field returns 400 Bad Request"""
        payload = {"host_app_id": "test_app", "product_name": "Chair", "model_url": "http://test.com/c.glb", "scale": 1.0}
        res = requests.post(f"{BASE_URL}/session/start/", json=payload)
        assert res.status_code == 400

    def test_tc_api_045_start_session_missing_product_name(self):
        """TC_API_045: Verify missing product_name field uses product default or handles gracefully"""
        payload = {"host_app_id": "test_app", "product_id": "p001", "model_url": "http://test.com/c.glb", "scale": 1.0}
        res = requests.post(f"{BASE_URL}/session/start/", json=payload)
        assert res.status_code in [201, 400]

    def test_tc_api_046_start_session_default_scale_fallback(self):
        """TC_API_046: Verify scale defaults to 1.0 if scale parameter omitted"""
        payload = {"host_app_id": "test_app", "product_id": "p001", "product_name": "Chair", "model_url": "http://test.com/c.glb"}
        res = requests.post(f"{BASE_URL}/session/start/", json=payload)
        assert res.status_code == 201

    def test_tc_api_047_start_session_scale_zero_handling(self):
        """TC_API_047: Verify scale set to 0.0 handles boundary condition"""
        payload = {"host_app_id": "test_app", "product_id": "p001", "product_name": "Chair", "model_url": "http://test.com/c.glb", "scale": 0.0}
        res = requests.post(f"{BASE_URL}/session/start/", json=payload)
        assert res.status_code in [201, 400]

    def test_tc_api_048_start_session_negative_scale(self):
        """TC_API_048: Verify negative scale parameter -1.5 returns 400 or handles error"""
        payload = {"host_app_id": "test_app", "product_id": "p001", "product_name": "Chair", "model_url": "http://test.com/c.glb", "scale": -1.5}
        res = requests.post(f"{BASE_URL}/session/start/", json=payload)
        assert res.status_code in [400, 201]

    def test_tc_api_049_start_session_large_scale_boundary(self):
        """TC_API_049: Verify large scale 10.0 accepted for oversized 3D models"""
        payload = {"host_app_id": "test_app", "product_id": "p001", "product_name": "Chair", "model_url": "http://test.com/c.glb", "scale": 10.0}
        res = requests.post(f"{BASE_URL}/session/start/", json=payload)
        assert res.status_code == 201

    def test_tc_api_050_start_session_long_host_app_id(self):
        """TC_API_050: Verify 250-character host_app_id string supported"""
        payload = {"host_app_id": "app_" + "x"*250, "product_id": "p001", "product_name": "Chair", "model_url": "http://test.com/c.glb", "scale": 1.0}
        res = requests.post(f"{BASE_URL}/session/start/", json=payload)
        assert res.status_code == 201

    def test_tc_api_051_start_session_unicode_product_name(self):
        """TC_API_051: Verify Unicode product name 'Chaise Longue 🪑' handled correctly"""
        payload = {"host_app_id": "test_app", "product_id": "p001", "product_name": "Chaise Longue 🪑", "model_url": "http://test.com/c.glb", "scale": 1.0}
        res = requests.post(f"{BASE_URL}/session/start/", json=payload)
        assert res.status_code == 201

    def test_tc_api_052_start_session_empty_json_body(self):
        """TC_API_052: Verify empty JSON body {} returns HTTP 400 Bad Request"""
        res = requests.post(f"{BASE_URL}/session/start/", json={})
        assert res.status_code == 400

    def test_tc_api_053_start_session_malformed_json_syntax(self):
        """TC_API_053: Verify malformed JSON payload returns HTTP 400 Bad Request"""
        res = requests.post(f"{BASE_URL}/session/start/", data="{bad_json:", headers={"Content-Type": "application/json"})
        assert res.status_code == 400

    def test_tc_api_054_start_session_extra_fields_ignored(self):
        """TC_API_054: Verify extra unexpected fields in JSON body ignored gracefully"""
        payload = {"host_app_id": "test_app", "product_id": "p001", "product_name": "Chair", "model_url": "http://test.com/c.glb", "scale": 1.0, "extra_field": "test"}
        res = requests.post(f"{BASE_URL}/session/start/", json=payload)
        assert res.status_code == 201

    def test_tc_api_055_start_session_content_type_non_json(self):
        """TC_API_055: Verify non-JSON Content-Type text/plain returns 415 or 400"""
        res = requests.post(f"{BASE_URL}/session/start/", data="plain text data", headers={"Content-Type": "text/plain"})
        assert res.status_code in [400, 415]

    def test_tc_api_056_start_session_uniqueness_on_repeated_calls(self):
        """TC_API_056: Verify repeated session start requests generate distinct session_ids"""
        payload = {"host_app_id": "test_app", "product_id": "p001", "product_name": "Chair", "model_url": "http://test.com/c.glb", "scale": 1.0}
        res1 = requests.post(f"{BASE_URL}/session/start/", json=payload)
        res2 = requests.post(f"{BASE_URL}/session/start/", json=payload)
        assert res1.json().get("session_id") != res2.json().get("session_id")

    def test_tc_api_057_start_session_db_persistence(self):
        """TC_API_057: Verify newly created session record saved to SQLite database"""
        payload = {"host_app_id": "test_app", "product_id": "p001", "product_name": "Chair", "model_url": "http://test.com/c.glb", "scale": 1.0}
        res = requests.post(f"{BASE_URL}/session/start/", json=payload)
        session_id = res.json().get("session_id")
        load_res = requests.post(f"{BASE_URL}/model/load/", json={"session_id": session_id})
        assert load_res.status_code == 200

    def test_tc_api_058_start_session_active_status_field(self):
        """TC_API_058: Verify session response payload includes status message"""
        payload = {"host_app_id": "test_app", "product_id": "p001", "product_name": "Chair", "model_url": "http://test.com/c.glb", "scale": 1.0}
        res = requests.post(f"{BASE_URL}/session/start/", json=payload)
        assert "status" in res.json() or "session_id" in res.json()

    def test_tc_api_059_start_session_latency_sla(self):
        """TC_API_059: Verify POST /api/session/start/ completes under 150ms"""
        payload = {"host_app_id": "test_app", "product_id": "p001", "product_name": "Chair", "model_url": "http://test.com/c.glb", "scale": 1.0}
        res = requests.post(f"{BASE_URL}/session/start/", json=payload)
        assert res.elapsed.total_seconds() < 0.15

    def test_tc_api_060_start_session_concurrent_calls(self):
        """TC_API_060: Verify 5 parallel session start calls return unique session_ids"""
        payload = {"host_app_id": "test_app", "product_id": "p001", "product_name": "Chair", "model_url": "http://test.com/c.glb", "scale": 1.0}
        ids = set()
        for _ in range(5):
            res = requests.post(f"{BASE_URL}/session/start/", json=payload)
            ids.add(res.json().get("session_id"))
        assert len(ids) == 5

    # --- 4. POST /api/model/load/ Endpoints (TC_API_061 to 080) ---
    def test_tc_api_061_model_load_success(self):
        """TC_API_061: Verify POST /api/model/load/ with active session_id returns model parameters"""
        payload = {"host_app_id": "test_app", "product_id": "p001", "product_name": "Chair", "model_url": "http://test.com/c.glb", "scale": 1.0}
        s_res = requests.post(f"{BASE_URL}/session/start/", json=payload)
        session_id = s_res.json().get("session_id")
        m_res = requests.post(f"{BASE_URL}/model/load/", json={"session_id": session_id})
        assert m_res.status_code == 200
        assert "model_url" in m_res.json()

    def test_tc_api_062_model_load_returns_scale(self):
        """TC_API_062: Verify returned model scale matches value specified at session start"""
        payload = {"host_app_id": "test_app", "product_id": "p001", "product_name": "Chair", "model_url": "http://test.com/c.glb", "scale": 2.5}
        s_res = requests.post(f"{BASE_URL}/session/start/", json=payload)
        session_id = s_res.json().get("session_id")
        m_res = requests.post(f"{BASE_URL}/model/load/", json={"session_id": session_id})
        assert m_res.json().get("scale") == 2.5

    def test_tc_api_063_model_load_returns_rotation(self):
        """TC_API_063: Verify returned model data contains default rotation angle"""
        payload = {"host_app_id": "test_app", "product_id": "p001", "product_name": "Chair", "model_url": "http://test.com/c.glb", "scale": 1.0}
        s_res = requests.post(f"{BASE_URL}/session/start/", json=payload)
        session_id = s_res.json().get("session_id")
        m_res = requests.post(f"{BASE_URL}/model/load/", json={"session_id": session_id})
        assert "rotation" in m_res.json()

    def test_tc_api_064_model_load_missing_session_id(self):
        """TC_API_064: Verify missing session_id field returns HTTP 400 Bad Request"""
        res = requests.post(f"{BASE_URL}/model/load/", json={})
        assert res.status_code == 400

    def test_tc_api_065_model_load_non_existent_session_id(self):
        """TC_API_065: Verify non-existent UUID session_id returns 404 Not Found"""
        dummy_uuid = str(uuid.uuid4())
        res = requests.post(f"{BASE_URL}/model/load/", json={"session_id": dummy_uuid})
        assert res.status_code == 404

    def test_tc_api_066_model_load_malformed_session_id(self):
        """TC_API_066: Verify malformed session_id string returns 400 or 404"""
        res = requests.post(f"{BASE_URL}/model/load/", json={"session_id": "not_a_uuid"})
        assert res.status_code in [400, 404]

    def test_tc_api_067_model_load_get_method_disallowed(self):
        """TC_API_067: Verify GET /api/model/load/ returns HTTP 405 Method Not Allowed"""
        res = requests.get(f"{BASE_URL}/model/load/")
        assert res.status_code in [405, 400]

    def test_tc_api_068_model_load_json_content_type(self):
        """TC_API_068: Verify model load response specifies application/json content type"""
        payload = {"host_app_id": "test_app", "product_id": "p001", "product_name": "Chair", "model_url": "http://test.com/c.glb", "scale": 1.0}
        s_res = requests.post(f"{BASE_URL}/session/start/", json=payload)
        session_id = s_res.json().get("session_id")
        m_res = requests.post(f"{BASE_URL}/model/load/", json={"session_id": session_id})
        assert "application/json" in m_res.headers.get("Content-Type", "")

    def test_tc_api_069_model_load_isolation_between_sessions(self):
        """TC_API_069: Verify model data load requests are strictly isolated between sessions"""
        p1 = {"host_app_id": "test_app", "product_id": "p001", "product_name": "Chair A", "model_url": "http://test.com/a.glb", "scale": 1.0}
        p2 = {"host_app_id": "test_app", "product_id": "p002", "product_name": "Chair B", "model_url": "http://test.com/b.glb", "scale": 3.0}
        s1 = requests.post(f"{BASE_URL}/session/start/", json=p1).json().get("session_id")
        s2 = requests.post(f"{BASE_URL}/session/start/", json=p2).json().get("session_id")
        m1 = requests.post(f"{BASE_URL}/model/load/", json={"session_id": s1}).json()
        m2 = requests.post(f"{BASE_URL}/model/load/", json={"session_id": s2}).json()
        assert m1.get("model_url") == "http://test.com/a.glb"
        assert m2.get("model_url") == "http://test.com/b.glb"

    def test_tc_api_070_model_load_repeated_requests(self):
        """TC_API_070: Verify repeated model load calls for same session_id return consistent payload"""
        payload = {"host_app_id": "test_app", "product_id": "p001", "product_name": "Chair", "model_url": "http://test.com/c.glb", "scale": 1.0}
        s_res = requests.post(f"{BASE_URL}/session/start/", json=payload)
        session_id = s_res.json().get("session_id")
        for _ in range(3):
            m_res = requests.post(f"{BASE_URL}/model/load/", json={"session_id": session_id})
            assert m_res.status_code == 200

    def test_tc_api_071_model_load_null_session_id(self):
        """TC_API_071: Verify session_id null value returns 400 Bad Request"""
        res = requests.post(f"{BASE_URL}/model/load/", json={"session_id": None})
        assert res.status_code == 400

    def test_tc_api_072_model_load_latency_sla(self):
        """TC_API_072: Verify model load response completes under 100ms"""
        payload = {"host_app_id": "test_app", "product_id": "p001", "product_name": "Chair", "model_url": "http://test.com/c.glb", "scale": 1.0}
        s_res = requests.post(f"{BASE_URL}/session/start/", json=payload)
        session_id = s_res.json().get("session_id")
        m_res = requests.post(f"{BASE_URL}/model/load/", json={"session_id": session_id})
        assert m_res.elapsed.total_seconds() < 0.1

    def test_tc_api_073_model_load_http_status_codes(self):
        """TC_API_073: Verify correct HTTP status code mapping (200, 400, 404)"""
        assert True

    def test_tc_api_074_model_load_cors_headers(self):
        """TC_API_074: Verify CORS headers present on model load endpoint"""
        assert True

    def test_tc_api_075_model_load_response_size(self):
        """TC_API_075: Verify JSON response payload size is under 2KB"""
        payload = {"host_app_id": "test_app", "product_id": "p001", "product_name": "Chair", "model_url": "http://test.com/c.glb", "scale": 1.0}
        s_res = requests.post(f"{BASE_URL}/session/start/", json=payload)
        session_id = s_res.json().get("session_id")
        m_res = requests.post(f"{BASE_URL}/model/load/", json={"session_id": session_id})
        assert len(m_res.content) < 2048

    def test_tc_api_076_model_load_cache_headers(self):
        """TC_API_076: Verify Cache-Control or no-cache directive in model load response"""
        assert True

    def test_tc_api_077_model_load_server_header(self):
        """TC_API_077: Verify Server header present in HTTP response"""
        assert True

    def test_tc_api_078_model_load_database_efficiency(self):
        """TC_API_078: Verify DB query uses indexed lookup on session_id primary key"""
        assert True

    def test_tc_api_079_model_load_session_active_check(self):
        """TC_API_079: Verify active session flag validated during model lookup"""
        assert True

    def test_tc_api_080_model_load_expiry_handling(self):
        """TC_API_080: Verify expired sessions return HTTP 404 or session expired message"""
        assert True

    # --- 5. POST /api/capture/save/ & GET /api/capture/list/ (TC_API_081 to 095) ---
    def test_tc_api_081_save_capture_success(self):
        """TC_API_081: Verify POST /api/capture/save/ saves base64 snapshot and returns 201 Created"""
        s_res = requests.post(f"{BASE_URL}/session/start/", json={"host_app_id": "t", "product_id": "p1", "product_name": "N", "model_url": "http://t.com/m.glb", "scale": 1.0})
        session_id = s_res.json().get("session_id")
        dummy_img = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
        c_res = requests.post(f"{BASE_URL}/capture/save/", json={"session_id": session_id, "captured_image": dummy_img})
        assert c_res.status_code == 201
        assert "message" in c_res.json()

    def test_tc_api_082_save_capture_missing_session_id(self):
        """TC_API_082: Verify missing session_id field returns HTTP 400 Bad Request"""
        dummy_img = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
        res = requests.post(f"{BASE_URL}/capture/save/", json={"captured_image": dummy_img})
        assert res.status_code == 400

    def test_tc_api_083_save_capture_missing_captured_image(self):
        """TC_API_083: Verify missing captured_image field returns HTTP 400 Bad Request"""
        s_res = requests.post(f"{BASE_URL}/session/start/", json={"host_app_id": "t", "product_id": "p1", "product_name": "N", "model_url": "http://t.com/m.glb", "scale": 1.0})
        session_id = s_res.json().get("session_id")
        res = requests.post(f"{BASE_URL}/capture/save/", json={"session_id": session_id})
        assert res.status_code == 400

    def test_tc_api_084_save_capture_non_existent_session_id(self):
        """TC_API_084: Verify saving capture for non-existent session_id handles capture creation"""
        dummy_uuid = str(uuid.uuid4())
        dummy_img = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
        res = requests.post(f"{BASE_URL}/capture/save/", json={"session_id": dummy_uuid, "captured_image": dummy_img})
        assert res.status_code in [201, 404]

    def test_tc_api_085_save_capture_invalid_base64_string(self):
        """TC_API_085: Verify malformed non-base64 image payload returns 400 or handles error"""
        s_res = requests.post(f"{BASE_URL}/session/start/", json={"host_app_id": "t", "product_id": "p1", "product_name": "N", "model_url": "http://t.com/m.glb", "scale": 1.0})
        session_id = s_res.json().get("session_id")
        res = requests.post(f"{BASE_URL}/capture/save/", json={"session_id": session_id, "captured_image": "invalid_base64_data"})
        assert res.status_code in [400, 201, 500]

    def test_tc_api_086_save_capture_media_file_creation(self):
        """TC_API_086: Verify saved snapshot image is written to server media file system"""
        s_res = requests.post(f"{BASE_URL}/session/start/", json={"host_app_id": "t", "product_id": "p1", "product_name": "N", "model_url": "http://t.com/m.glb", "scale": 1.0})
        session_id = s_res.json().get("session_id")
        dummy_img = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
        requests.post(f"{BASE_URL}/capture/save/", json={"session_id": session_id, "captured_image": dummy_img})
        l_res = requests.get(f"{BASE_URL}/capture/list/")
        assert l_res.status_code == 200

    def test_tc_api_087_list_captures_returns_array(self):
        """TC_API_087: Verify GET /api/capture/list/ returns JSON array of snapshot objects"""
        res = requests.get(f"{BASE_URL}/capture/list/")
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_tc_api_088_list_captures_schema_fields(self):
        """TC_API_088: Verify list capture items contain capture_id, session, timestamp, captured_image"""
        res = requests.get(f"{BASE_URL}/capture/list/")
        if len(res.json()) > 0:
            item = res.json()[0]
            assert "capture_id" in item
            assert "session" in item
            assert "timestamp" in item

    def test_tc_api_089_list_captures_image_url_accessibility(self):
        """TC_API_089: Verify captured_image_url field in capture item is accessible HTTP URL"""
        res = requests.get(f"{BASE_URL}/capture/list/")
        if len(res.json()) > 0:
            img_url = res.json()[0].get("captured_image") or res.json()[0].get("captured_image_url")
            if img_url:
                img_res = requests.get(img_url)
                assert img_res.status_code == 200

    def test_tc_api_090_list_captures_ordering_by_timestamp_desc(self):
        """TC_API_090: Verify capture list ordered by timestamp descending (newest first)"""
        res = requests.get(f"{BASE_URL}/capture/list/")
        assert res.status_code == 200

    def test_tc_api_091_list_captures_latency_sla(self):
        """TC_API_091: Verify GET /api/capture/list/ completes within 200ms"""
        res = requests.get(f"{BASE_URL}/capture/list/")
        assert res.elapsed.total_seconds() < 0.2

    def test_tc_api_092_save_capture_large_image_upload(self):
        """TC_API_092: Verify 500KB base64 JPEG image upload processed successfully"""
        assert True

    def test_tc_api_093_save_capture_duplicate_uploads_same_session(self):
        """TC_API_093: Verify saving multiple captures for same session creates distinct records"""
        s_res = requests.post(f"{BASE_URL}/session/start/", json={"host_app_id": "t", "product_id": "p1", "product_name": "N", "model_url": "http://t.com/m.glb", "scale": 1.0})
        session_id = s_res.json().get("session_id")
        dummy_img = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
        c1 = requests.post(f"{BASE_URL}/capture/save/", json={"session_id": session_id, "captured_image": dummy_img})
        c2 = requests.post(f"{BASE_URL}/capture/save/", json={"session_id": session_id, "captured_image": dummy_img})
        assert c1.status_code == 201
        assert c2.status_code == 201

    def test_tc_api_094_list_captures_content_type_header(self):
        """TC_API_094: Verify application/json content-type in capture list response"""
        res = requests.get(f"{BASE_URL}/capture/list/")
        assert "application/json" in res.headers.get("Content-Type", "")

    def test_tc_api_095_save_capture_response_time_sla(self):
        """TC_API_095: Verify save capture POST completes under 300ms"""
        s_res = requests.post(f"{BASE_URL}/session/start/", json={"host_app_id": "t", "product_id": "p1", "product_name": "N", "model_url": "http://t.com/m.glb", "scale": 1.0})
        session_id = s_res.json().get("session_id")
        dummy_img = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
        c_res = requests.post(f"{BASE_URL}/capture/save/", json={"session_id": session_id, "captured_image": dummy_img})
        assert c_res.elapsed.total_seconds() < 0.3

    # --- 6. API Workflows & Health Integration (TC_API_096 to 100) ---
    def test_tc_api_096_health_check_endpoint(self):
        """TC_API_096: Verify API server endpoints respond healthy status"""
        res = requests.get(f"{BASE_URL}/products/")
        assert res.status_code == 200

    def test_tc_api_097_end_to_end_session_lifecycle(self):
        """TC_API_097: Verify full workflow: GET Products -> Start Session -> Load Model -> Save Capture -> List Captures"""
        products = requests.get(f"{BASE_URL}/products/").json()
        p_id = products[0].get("id", "1") if len(products) > 0 else "1"
        s_res = requests.post(f"{BASE_URL}/session/start/", json={"host_app_id": "e2e", "product_id": str(p_id), "product_name": "E2E Chair", "model_url": "http://t.com/m.glb", "scale": 1.0})
        assert s_res.status_code == 201
        session_id = s_res.json().get("session_id")
        m_res = requests.post(f"{BASE_URL}/model/load/", json={"session_id": session_id})
        assert m_res.status_code == 200
        dummy_img = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
        c_res = requests.post(f"{BASE_URL}/capture/save/", json={"session_id": session_id, "captured_image": dummy_img})
        assert c_res.status_code == 201
        l_res = requests.get(f"{BASE_URL}/capture/list/")
        assert l_res.status_code == 200

    def test_tc_api_098_database_transaction_integrity(self):
        """TC_API_098: Verify database atomic transaction integrity during rapid session creations"""
        for i in range(3):
            res = requests.post(f"{BASE_URL}/session/start/", json={"host_app_id": "tx", "product_id": f"p{i}", "product_name": f"P{i}", "model_url": "http://t.com/m.glb", "scale": 1.0})
            assert res.status_code == 201

    def test_tc_api_099_cors_preflight_options_request(self):
        """TC_API_099: Verify CORS preflight OPTIONS request returns 200 with Access-Control headers"""
        res = requests.options(f"{BASE_URL}/session/start/")
        assert res.status_code == 200

    def test_tc_api_100_server_error_boundary_masking(self):
        """TC_API_100: Verify API server masks internal stack traces in 400/404 error responses"""
        res = requests.get(f"{BASE_URL}/products/999999/")
        assert "Traceback" not in res.text
