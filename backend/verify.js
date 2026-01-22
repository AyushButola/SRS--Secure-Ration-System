const http = require('http');

const makeRequest = (method, path, data, token) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, body: body });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
};

const runVerify = async () => {
    console.log('--- Starting Verification ---');

    const testUser = {
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'password123'
    };

    // 1. Register
    console.log('\n1. Testing Register...');
    try {
        const regRes = await makeRequest('POST', '/api/auth/register', testUser);
        console.log(`Status: ${regRes.status}`);
        console.log('Response:', regRes.body);

        if (regRes.status !== 201) {
            console.error('Registration failed');
            return;
        }
    } catch (e) {
        console.error("Register Error", e);
    }

    // 2. Login
    console.log('\n2. Testing Login...');
    let token = '';
    try {
        const loginRes = await makeRequest('POST', '/api/auth/login', {
            email: testUser.email,
            password: testUser.password
        });
        console.log(`Status: ${loginRes.status}`);
        // console.log('Response:', loginRes.body);

        if (loginRes.status === 200 && loginRes.body.token) {
            token = loginRes.body.token;
            console.log('Login successful, token received.');
        } else {
            console.error('Login failed');
            return;
        }
    } catch (e) {
        console.error("Login Error", e);
    }

    // 3. Protected Route
    console.log('\n3. Testing Protected Route (/api/auth/me)...');
    try {
        const meRes = await makeRequest('GET', '/api/auth/me', null, token);
        console.log(`Status: ${meRes.status}`);
        console.log('Response:', meRes.body);

        if (meRes.status === 200 && meRes.body.username === testUser.username) {
            console.log('SUCCESS: Complete flow verified!');
        } else {
            console.log('Protected route check failed.');
        }
    } catch (e) {
        console.error("Protected Route Error", e);
    }
};

runVerify();
