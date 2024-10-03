import {cache, getCountryFromIp} from './ipService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('getCountryFromIp', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        cache.clear();
    });

    it('should return country from cache if available', async () => {
        const mockIp = '192.168.1.1';
        const mockCountry = 'Test Country';

        // Manually add to cache
        cache.set(mockIp, mockCountry);

        const result = await getCountryFromIp(mockIp);
        expect(result).toBe(mockCountry);
        expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should fetch from primary vendor if not in cache', async () => {
        const mockIp = '192.168.1.2';
        const mockCountry = 'USA';

        mockedAxios.get.mockResolvedValueOnce({ data: { country_name: mockCountry } });

        const result = await getCountryFromIp(mockIp);
        expect(result).toBe(mockCountry);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('api.ipstack.com'));
    });

    it('should fetch from secondary vendor if primary fails', async () => {
        const mockIp = '192.168.1.3';
        const mockCountry = 'Mexico';

        mockedAxios.get.mockRejectedValueOnce(new Error('Primary vendor error'));
        mockedAxios.get.mockResolvedValueOnce({ data: { country: mockCountry } });

        const result = await getCountryFromIp(mockIp);
        expect(result).toBe(mockCountry);
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenLastCalledWith(expect.stringContaining('ip-api.com'));
    });

    it('should throw VendorUnavailableError if both vendors fail', async () => {
        const mockIp = '192.168.1.4';

        mockedAxios.get.mockRejectedValueOnce(new Error('Primary vendor error'));
        mockedAxios.get.mockRejectedValueOnce(new Error('Secondary vendor error'));

        await expect(getCountryFromIp(mockIp)).rejects.toThrow('Unable to fetch country information');
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
});
