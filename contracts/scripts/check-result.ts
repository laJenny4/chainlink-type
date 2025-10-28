import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import dotenv from "dotenv";

dotenv.config();

import ApiConsumerAbi from "../contracts/ApiConsumerAbi.json";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS as `0x${string}`;


async function main() {
    try {
        const client = createPublicClient({
            chain: sepolia,
            transport: http('https://sepolia.base.org')
        });
        const [rate, timestamp] = await client.readContract({
            address: CONTRACT_ADDRESS,
            abi: ApiConsumerAbi,
            functionName: 'getLastRate',
        }) as [bigint, bigint] ;

        console.log('Rate (raw):', rate.toString());
        console.log('Rate (decimal):', Number(rate) / 1e18);
        console.log('Timestamp:', timestamp.toString());
        const lastResponse = await client.readContract({
            address: CONTRACT_ADDRESS,
            abi: ApiConsumerAbi,
            functionName: 'lastResponse',
        }) as bigint | string;

        const lastError = await client.readContract({
            address: CONTRACT_ADDRESS,
            abi: ApiConsumerAbi,
            functionName: 'lastError',
        }) as bigint | string;

        if (lastResponse !== '0x') console.log('Respuesta raw:', lastResponse);
        if (lastError !== '0x') console.log('Error reportado:', lastError);
    } catch (error) {
        console.error("Error al leer del contrato:");
        console.error(error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });