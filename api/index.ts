import express from "express";
import crypto from "crypto";
const HMAC_SECRET = process.env.HMAC_SECRET || "mi_clave";
const PORT = process.env.PORT || 3000;
const app = express();
import dotenv from "dotenv";

dotenv.config();
function generateSignature(data: object) {
    return crypto
        .createHmac('sha256', HMAC_SECRET)
        .update(JSON.stringify(data))
        .digest('hex');
}

async function getChainlinkRate(asset: string) {
    try {
        const priceFeeds: Record<string, string> =  {
            'USDC': '0xd30e2101a97dcbAeBCBC04F14C3f624E67A35165',
            'ETH': '0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1',
            'BTC': '0x0FB99723Aee6f420beAD13e6bBB79b7E6F034298'
        };

        const feedAddress = priceFeeds[asset] || priceFeeds['USDC'];
        const rpcUrl = 'https://sepolia.base.org';

        // abi de latestRoundData()
        const data = '0xfeaf968c';

        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_call',
                params: [{
                    to: feedAddress,
                    data: data
                }, 'latest'],
                id: 1
            })
        });

        const resultJson = await response.json();
        const result = resultJson.result;
        const priceHex = '0x' + result.slice(66, 130);
        const price = parseInt(priceHex, 16);
        const rate = price / 1e8;
        console.log(`rate obtenido de chainlink para ${asset}: $${rate}`);
        return rate;

    } catch (error) {
        console.error('Error getting Chainlink rate:', error);
    }
}
app.get('/v1/rate', async (req: express.Request, res: express.Response) => {
    const asset: string = (req.query.asset as string) || 'USDC';
    const rate = await getChainlinkRate(asset);
    const timestamp = Math.floor(Date.now() / 1000);
    const data = { asset, rate, timestamp };
    const signature = generateSignature(data);

    res.json({
        ...data,
        signature,
        source: 'chainlink-data-feed'
    });
});

app.get('/healthz', (res: express.Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`api corriendo en http://localhost:${PORT}`);
    console.log(`http://localhost:${PORT}/v1/rate?asset=USDC`);
});