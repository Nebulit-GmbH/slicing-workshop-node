"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const assertions_1 = require("../util/assertions");
const replay_1 = require("./replay");
const db_1 = require("./db");
const api = (
// external dependencies
) => (router) => {
    router.get('/health', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield (0, db_1.getSharedPool)().query('SELECT 1');
            res.status(200).json({ status: 'ok', db: 'connected' });
        }
        catch (err) {
            res.status(503).json({ status: 'error', db: 'disconnected' });
        }
    }));
    router.post('/api/replay/:projection', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const projection = (0, assertions_1.assertNotEmpty)(req.params.projection);
        yield (0, replay_1.replayProjection)(projection);
        res.status(200).json({ "projection": projection });
    }));
};
exports.api = api;
