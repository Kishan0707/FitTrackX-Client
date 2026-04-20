const http = require("http");

const login = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: "kishan@test.com",
      password: "123456",
    });
    const options = {
      hostname: "localhost",
      port: 5000,
      path: "/api/auth/login",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
};

const fetchStats = (token) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 5000,
      path: "/api/stats",
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });

    req.on("error", reject);
    req.end();
  });
};

(async () => {
  try {
    const loginRes = await login();
    console.log("login", loginRes);
    const statsRes = await fetchStats(loginRes.token);
    console.log("stats", statsRes);
  } catch (err) {
    console.error("error", err);
  }
})();
