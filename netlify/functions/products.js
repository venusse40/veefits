exports.handler = async function () {
  const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTFfviAg2YVAss8sHB23_ExdCN-qrwtM4og9iRzRRWa7RfXQNs63e2DGoKJa4AHqcaNvcoZYbbRf77e/pub?gid=0&single=true&output=csv';

  try {
    const res = await fetch(SHEET_URL);
    const csv = await res.text();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      },
      body: csv
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};