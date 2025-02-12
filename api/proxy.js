const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    // 根据需要调整允许的方法
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    return res.status(200).end();
  }

  const targetUrl = process.env.BLAST_API_URL;
  const url = targetUrl;

  const headers = {...req.headers};
  delete headers.host;

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : null,
    });

    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // 添加 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    res.status(response.status);
    for (const key in responseHeaders) {
      res.setHeader(key, responseHeaders[key]);
    }

    const body = await response.buffer();
    res.send(body);
  } catch (error) {
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
};