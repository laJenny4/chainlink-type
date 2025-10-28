import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createWalletClient, createPublicClient, http, decodeEventLog } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import ApiConsumerAbi from "../contracts/ApiConsumerAbi.json";
import dotenv from "dotenv";

dotenv.config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS as `0x${string}`;
const SUBSCRIPTION_ID = 502;
const GAS_LIMIT = 300000;
const DON_ID = "0x66756e2d626173652d7365706f6c69612d310000000000000000000000000000";
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    const sourceCode = fs.readFileSync(
        path.join(__dirname, "../../functions/source.js"),
        "utf8"
    );
    console.log("source cargado");

    const account = privateKeyToAccount(PRIVATE_KEY);

    const walletClient = createWalletClient({
        account,
        chain: baseSepolia,
        transport: http(),
    });

    const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(),
    });

    const args = ["USDC"];

    try {
        const hash = await walletClient.writeContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: ApiConsumerAbi,
            functionName: "requestRate",
            args: [sourceCode, '0x', args, SUBSCRIPTION_ID, GAS_LIMIT, DON_ID]
        });

        console.log('transacción enviada', hash);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log('transacción confirmada en el bloque', receipt.blockNumber);

        // Buscar el evento RequestSent
        const requestSentLog = receipt.logs.find(log => {
            try {
                const decoded = decodeEventLog({
                    abi: ApiConsumerAbi,
                    data: log.data,
                    topics: log.topics
                });
                return decoded.eventName === 'RequestSent';
            } catch {
                return false;
            }
        });

        if (requestSentLog) {
            const decoded = decodeEventLog({
                abi: ApiConsumerAbi,
                data: requestSentLog.data,
                topics: requestSentLog.topics
            });
            console.log('evento decodificado:', decoded);
            const args = decoded.args as any;
            const requestId = args.requestId || args.id || args[0];
            console.log('\n request ID:', requestId);
            console.log('\n chainlink puede tardar 1-2 minutos');
            console.log(`   https://sepolia.basescan.org/tx/${hash}`);}

    } catch (error: any) {
        console.error(error);
        if (error?.message?.includes("insufficient funds")) {
            console.log("\n se necesita ETH en la wallet para gas fees");
        } else if (error?.message?.includes("subscription")) {
            console.log("\n verificar la subscription id y que el contrato esté agregado como consumer");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });