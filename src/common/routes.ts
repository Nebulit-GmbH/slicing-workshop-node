import {Request, Response, Router} from 'express';
import {WebApiSetup} from "@event-driven-io/emmett-expressjs";
import {assertNotEmpty} from "../util/assertions";
import {replayProjection} from "./replay";
import {getSharedPool} from "./db";


export const api =
    (
        // external dependencies
    ): WebApiSetup =>
        (router: Router): void => {

            router.get('/health', async (_req: Request, res: Response) => {
                try {
                    await getSharedPool().query('SELECT 1');
                    res.status(200).json({ status: 'ok', db: 'connected' });
                } catch (err) {
                    res.status(503).json({ status: 'error', db: 'disconnected' });
                }
            });

            router.post('/api/replay/:projection', async (req: Request, res: Response) => {
                const projection = assertNotEmpty(req.params.projection)
                await replayProjection(projection)
                res.status(200).json({"projection":projection})
            });
        };

