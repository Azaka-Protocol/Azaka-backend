import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import capabilitiesRouter from '../../src/api/routes/capabilities';

const app = express();
app.use('/capabilities', capabilitiesRouter);

describe('Capabilities API', () => {
  it('should expose the alpha implementation boundary', async () => {
    const response = await request(app).get('/capabilities');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.implementationPercentage).toBe(40);
    expect(response.body.data.implementedCount).toBe(4);
    expect(response.body.data.totalCount).toBe(10);
    expect(response.body.data.implemented).toHaveLength(4);
    expect(response.body.data.planned).toHaveLength(6);
  });
});
