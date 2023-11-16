const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const cors = require('cors');
// Initialize Supabase client with your Supabase project URL and public API key
const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_KEY || "");

const app = express();
const port = 5000; // You can change the port as needed

app.use(cors());
app.use(express.json());

// Route to handle product submissions
app.post('/submit-tool', async (req, res) => {
  const { productUrl, description, mail } = req.body;

  // Validate the URL (you can use the isValidUrl function from the previous example)

  // Insert data into the 'products' table in Supabase
  const { data, error } = await supabase
    .from('products')
    .upsert([
      {
        product_url: productUrl,
        product_description: description,
        user_mail: mail
      },
    ]);

  if (error) {
    console.error('Error inserting data:', error);
    return res.status(500).json({ error: 'Error inserting data' });
  } else {
    console.log('Data inserted successfully:', data);
    return res.json({ success: 'Data inserted successfully' });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
