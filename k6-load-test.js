import { io, Scenario } from 'k6/execution';
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    baseline_load_test: {
      executor: 'constant-vus',
      vus: 100, // 100 Virtual Users
      duration: '1m', // 1 Minute continuous execution
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests must finish within 1000ms
    http_req_failed: ['rate<0.01'],    // Error rate must be under 1%
  },
};

export default function () {
  const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000/api';

  // 1. GET /products/
  const resProducts = http.get(`${BASE_URL}/products/`);
  check(resProducts, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(0.5);

  // 2. POST /session/start/
  const payload = JSON.stringify({
    host_app_id: 'load_tester_app',
    product_id: 'chair_sheen_002',
    product_name: 'Designer Sheen Accent Chair',
    model_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb',
    scale: 1.0,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const resSession = http.post(`${BASE_URL}/session/start/`, payload, params);
  check(resSession, {
    'session start status 200 or 201': (r) => r.status === 200 || r.status === 201,
  });

  sleep(0.5);
}
