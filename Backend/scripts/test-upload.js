
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUpload() {
  try {
    console.log('Logging in...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'jaimeandre17@hotmail.com',
      password: 'EthaN2505'
    });

    const token = loginResponse.data.token;
    console.log('Login successful. Token acquired.');

    // Create a dummy image
    const imagePath = path.join(__dirname, 'test-image.png');
    if (!fs.existsSync(imagePath)) {
      // Create a minimal valid PNG
      const pngBuffer = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2d0b0000000049454e44ae426082', 'hex');
      fs.writeFileSync(imagePath, pngBuffer); 
    }

    const form = new FormData();
    form.append('imagen_banner', fs.createReadStream(imagePath), 'test-image.png');
    form.append('whatsapp', '999888777');

    console.log('Attempting upload to http://localhost:3000/api/marketing/banners...');
    
    const response = await axios.post('http://localhost:3000/api/marketing/banners', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      validateStatus: () => true 
    });

    console.log('Status:', response.status);
    console.log('Data:', response.data);

  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
        console.error('Response data:', error.response.data);
    }
  }
}

testUpload();
