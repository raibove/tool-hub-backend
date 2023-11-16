import {
    PangeaConfig,
    DomainIntelService,
    PangeaErrors,
} from "pangea-node-sdk";
import express from 'express';
import cors from 'cors';
import { createClient } from "@supabase/supabase-js";
import { config as envConfig } from "dotenv";
envConfig();

// Initialize Supabase client with your Supabase project URL and public API key
const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_KEY || "");

const app = express();
const port = 5000; // You can change the port as needed

app.use(cors());
app.use(express.json());


const domain = process.env.PANGEA_DOMAIN;
const token = process.env.PANGEA_CLIENT_TOKEN;
const config = new PangeaConfig({ domain: domain });
const domainIntel = new DomainIntelService(String(token), config);
// Route to handle product submissions
app.post('/submit-tool', async (req, res) => {
    const { productUrl, description, mail } = req.body;

    const urlObject = new URL(productUrl);
    const domainUrl = urlObject.hostname;

    try {
        const response = await domainIntel.reputation(domainUrl, { provider: "domaintools" });
        if (response.status === "Success" &&
            (response.result.data.verdict === "unknown" || response.result.data.verdict === "benign")) {
            const supabaseResponse = await saveToSupabase(productUrl, description, mail);
            if (supabaseResponse.error) {
                console.error('Error saving data to Supabase:', supabaseResponse.error);
                res.status(500).json({ error: 'Error in saving tool' });
            } else {
                console.log('Data saved to Supabase successfully:', supabaseResponse.data);
                res.json({ success: 'Tool submitted successfully' });
            }
        } else {
            console.log('Malicious domain detected. Data not saved.');
            res.status(403).json({ error: 'Malicious domain detected. Data not saved.' });
        }
    } catch (e) {
        console.error('Error checking domain reputation:', e.message);
        res.status(500).json({ error: 'Error checking domain reputation' });
    }

});

const saveToSupabase = async (productUrl, description, mail) => {
    try {
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
            return { error: 'Error inserting data into Supabase' };
        } else {
            return { data: 'data inserted successfully' };
        }
    } catch (error) {
        return { error: 'Error inserting data into Supabase' };
    }
}

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
