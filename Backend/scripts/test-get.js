
const axios = require('axios');

async function testGet() {
  try {
    console.log('Testing GET /api/marketing/banners (List)...');
    const responseList = await axios.get('http://localhost:3000/api/marketing/banners');
    console.log('List Status:', responseList.status);
    console.log('List Count:', responseList.data.length);

    console.log('Testing GET /api/marketing/banner (Singular - Latest)...');
    const responseSingle = await axios.get('http://localhost:3000/api/marketing/banner');
    console.log('Single Status:', responseSingle.status);
    console.log('Single ID:', responseSingle.data.id_banner);

  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
    }
  }
}

testGet();
