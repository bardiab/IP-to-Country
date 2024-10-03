import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const IPSTACK_API_KEY = process.env.IPSTACK_API_KEY;

export const cache = new Map<string, string>();

const rateLimits = {
    primaryVendor: { limit: 100, count: 0 },
    secondaryVendor: { limit: 100, count: 0 }
};

class VendorUnavailableError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'VendorUnavailableError';
    }
}

export async function getCountryFromIp(ip: string): Promise<string> {
    console.log(rateLimits);
    if (cache.has(ip)) {
        return cache.get(ip)!;
    }
    let country: string | undefined;

    if (rateLimits.primaryVendor.count < rateLimits.primaryVendor.limit) {
        try {
            const url = `http://api.ipstack.com/${ip}?access_key=${IPSTACK_API_KEY}`
            const response = await axios.get(url);
            country = response.data.country_name;
            rateLimits.primaryVendor.count++;
        } catch (error) {
            console.error('Error fetching from primary vendor:', (error as Error).message);
        }
    } else {
        console.log('Primary vendor rate limit reached')
    }

    if (!country && rateLimits.secondaryVendor.count < rateLimits.secondaryVendor.limit) {
        try {
            const response = await axios.get(`http://ip-api.com/json/${ip}`);
            country = response.data.country;
            rateLimits.secondaryVendor.count++;
        } catch (error) {
            console.error('Error fetching from secondary vendor:', (error as Error).message);
        }
    } else {
        console.log('Secondary vendor rate limit reached')
    }

    if (country) {
        cache.set(ip, country);
        return country;
    }

    throw new VendorUnavailableError('Unable to fetch country information. All vendors unavailable or rate limits exceeded.');
}
