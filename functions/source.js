// este código se ejecuta en el entorno de Chainlink Functions
const asset = args[0] || "USDC";
const apiUrl = `https://chainlink-poc.onrender.com/v1/rate?asset=${asset}`;

const response = await Functions.makeHttpRequest({
    url: apiUrl,
    method: "GET",
    timeout: 60000,
    headers: {
        "Content-Type": "application/json"
    }
});

if (response.error) {
    throw Error("API request failed");
}

const data = response.data;

// validar que tenemos los datos necesarios
if (!data.rate || !data.timestamp || !data.signature) {
    throw Error("Invalid API response");
}

// convertir rate a entero multiplicar por 10^18 para precisión
const rate = Math.round(data.rate * 1e18);
const timestamp = data.timestamp;

// retornar datos codificados
return Functions.encodeUint256(rate);