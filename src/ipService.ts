import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const IPSTACK_API_KEY = process.env.IPSTACK_API_KEY;

export const cache = new Map<string, string>();

export enum VendorType {
    PRIMARY = 'primaryVendor',
    SECONDARY = 'secondaryVendor'
}

interface VendorUsage {
    rateLimit: number;
    count: number;
    lastResetTime: number;
}

export const vendorUsage: Record<string, VendorUsage> = {
    [VendorType.PRIMARY]: { rateLimit: 100, count: 0, lastResetTime: Date.now() },
    [VendorType.SECONDARY]: { rateLimit: 100, count: 0, lastResetTime: Date.now() }
};

function resetRateLimitIfNeeded(vendor: VendorType) {
    const now = Date.now();
    if (now - vendorUsage[vendor].lastResetTime >= 3600000) { // 1 hr
        vendorUsage[vendor].count = 0;
        vendorUsage[vendor].lastResetTime = now;
    }
}

function incrementVendorUsage(vendor: VendorType) {
    resetRateLimitIfNeeded(vendor);
    vendorUsage[vendor].count++;
}

export function setVendorRateLimit(vendor: VendorType, limit: number) {
    if (vendorUsage[vendor]) {
        vendorUsage[vendor].rateLimit = limit;
    }
}

class VendorUnavailableError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'VendorUnavailableError';
    }
}

export async function getCountryFromIp(ip: string): Promise<string> {
    if (cache.has(ip)) {
        return cache.get(ip)!;
    }
    let country: string | undefined;

    resetRateLimitIfNeeded(VendorType.PRIMARY);
    if (vendorUsage.primaryVendor.count < vendorUsage.primaryVendor.rateLimit) {
        try {
            const url = `http://api.ipstack.com/${ip}?access_key=${IPSTACK_API_KEY}`
            const response = await axios.get(url);
            country = response.data.country_name;
            incrementVendorUsage(VendorType.PRIMARY);
        } catch (error) {
            console.error('Error fetching from primary vendor:', (error as Error).message);
        }
    }

    resetRateLimitIfNeeded(VendorType.SECONDARY);
    if (!country && vendorUsage.secondaryVendor.count < vendorUsage.secondaryVendor.rateLimit) {
        try {
            const response = await axios.get(`http://ip-api.com/json/${ip}`);
            country = response.data.country;
            incrementVendorUsage(VendorType.SECONDARY);
        } catch (error) {
            console.error('Error fetching from secondary vendor:', (error as Error).message);
        }
    }

    if (country) {
        cache.set(ip, country);
        return country;
    }

    throw new VendorUnavailableError('Unable to fetch country information. All vendors unavailable or rate limits exceeded.');
}
