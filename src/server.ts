import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { getCountryFromIp } from './ipService';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/ip-to-country/:ip', async (req: Request, res: Response) => {
    const ip = req.params.ip;
    if (!isValidIPv4(ip)) {
        res.status(400).json({error: "Invalid IPv4"});
        return;
    }

    try {
        const country = await getCountryFromIp(ip);
        res.json({ ip, country });
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === 'VendorUnavailableError') {
                res.status(503).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'An unexpected error occurred' });
            }
        } else {
            res.status(500).json({ error: 'An unknown error occurred' });
        }
        console.error('Error in /ip-to-country endpoint:', error);
    }
});

function isValidIPv4(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ip);
}

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
