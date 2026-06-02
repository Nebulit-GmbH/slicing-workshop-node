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
const CreateCatalogEntryCommand_1 = require("./CreateCatalogEntryCommand");
const api = () => (router) => {
    /**
     * @openapi
     * /api/catalog-entries/{id}:
     *   post:
     *     summary: Create a new catalog entry
     *     tags: [CatalogEntry]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: string }
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [title, isbn, author, description]
     *             properties:
     *               title:
     *                 type: string
     *               isbn:
     *                 type: string
     *               author:
     *                 type: string
     *               description:
     *                 type: string
     *     responses:
     *       201:
     *         description: Catalog entry created
     *       409:
     *         description: Catalog entry already exists
     */
    router.post('/api/catalog-entries/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        const id = req.params.id;
        const correlationId = (_a = req.header('correlation_id')) !== null && _a !== void 0 ? _a : id;
        const { title, isbn, author, description } = req.body;
        if (!title || !isbn || !author || !description) {
            return res.status(400).json({ error: 'title, isbn, author, and description are required' });
        }
        try {
            const command = {
                type: 'CreateCatalogEntry',
                data: { id, title, isbn, author, description },
                metadata: {
                    correlation_id: correlationId,
                    causation_id: id,
                },
            };
            const result = yield (0, CreateCatalogEntryCommand_1.handleCreateCatalogEntry)(id, command);
            res.set('correlation_id', correlationId);
            res.set('causation_id', id);
            return res.status(201).json({
                ok: true,
                next_expected_stream_version: (_b = result.nextExpectedStreamVersion) === null || _b === void 0 ? void 0 : _b.toString(),
                last_event_global_position: (_c = result.lastEventGlobalPosition) === null || _c === void 0 ? void 0 : _c.toString(),
            });
        }
        catch (err) {
            const errorMessage = errorMapping(err === null || err === void 0 ? void 0 : err.code);
            if (errorMessage) {
                return res.status(409).json({ error: errorMessage });
            }
            console.error(err);
            return res.status(500).json({ ok: false, error: 'Server error' });
        }
    }));
};
exports.api = api;
const errorMapping = (code) => {
    switch (code) {
        case 'already_created': return 'This catalog entry already exists.';
        default: return null;
    }
};
