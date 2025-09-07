const axios = require('axios');

const serviceProxy = async (serviceUrl, req, res) => {
  try {
    const url = `${serviceUrl}${req.originalUrl}`;
    const response = await axios({
      url,
      method: req.method,
      headers: req.headers, // forward exactly
      data: req.body,
      params: req.query,
    });

    res.status(response.status).json(response.data);
  } catch (err) {
    const status = err.response ? err.response.status : 500;
    const data = err.response ? err.response.data : { message: err.message };
    res.status(status).json(data);
  }
};

module.exports = serviceProxy;
