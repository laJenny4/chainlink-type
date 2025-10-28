// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

contract ApiConsumer is FunctionsClient {
    using FunctionsRequest for FunctionsRequest.Request;

    // Estado
    bytes32 public lastRequestId;
    uint256 public lastRate;
    uint256 public lastTimestamp;
    bytes public lastResponse;
    bytes public lastError;

    // Eventos
    event RequestSent(bytes32 indexed requestId, string asset);
    event ResponseReceived(bytes32 indexed requestId, uint256 rate, uint256 timestamp);

    // Constructor
    constructor(address router) FunctionsClient(router) {}

    // Función para hacer request
    function requestRate(
        string calldata source,
        bytes calldata secrets,
        string[] calldata args,
        uint64 subscriptionId,
        uint32 gasLimit,
        bytes32 donId
    ) external returns (bytes32 requestId) {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);

        if (secrets.length > 0) {
            req.addSecretsReference(secrets);
        }

        if (args.length > 0) {
            req.setArgs(args);
        }

        requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donId
        );

        lastRequestId = requestId;
        emit RequestSent(requestId, args.length > 0 ? args[0] : "USDC");

        return requestId;
    }

    // Callback de Chainlink
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        lastResponse = response;
        lastError = err;

        if (response.length > 0) {
            // Decommodification response (esperamos uint256 rate, uint256 timestamp)
            //(uint256 rate, uint256 timestamp) = abi.decode(response, (uint256, uint256));
            //(uint256 rate) = abi.decode(response, (uint256));
            uint256 rate = abi.decode(response, (uint256));
            lastRate = rate;
            lastTimestamp = block.timestamp;
            emit ResponseReceived(requestId, rate, block.timestamp);
        }
    }

    // Función para leer el último rate
    function getLastRate() external view returns (uint256 rate, uint256 timestamp) {
        return (lastRate, lastTimestamp);
    }
}