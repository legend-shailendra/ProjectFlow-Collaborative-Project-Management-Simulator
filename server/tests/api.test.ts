import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

let adminToken: string;
let devToken: string;
let testProjectId: string;
let testTaskId: string;
let testStoryId: string;
let testIssueId: string;

describe('ProjectFlow API Integration Test Suite', () => {
  // 1. Health Check
  it('GET /api/health should return service health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  // 2. Authentication: Login with seeded admin and dev
  it('POST /api/auth/login should authenticate Admin user and return JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@projectflow.dev', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('ADMIN');
    adminToken = res.body.data.token;
  });

  it('POST /api/auth/login should authenticate Developer user and return JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dev@projectflow.dev', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('DEVELOPER');
    devToken = res.body.data.token;
  });

  it('GET /api/auth/me should return current authenticated user profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('admin@projectflow.dev');
  });

  // 3. User Registration
  it('POST /api/auth/register should register a new test user and reject duplicates', async () => {
    const testEmail = `testuser_${Date.now()}@example.com`;
    const regRes = await request(app).post('/api/auth/register').send({
      fullName: 'Test Automation User',
      email: testEmail,
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
      role: 'DEVELOPER',
    });

    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);

    // Duplicate check
    const dupRes = await request(app).post('/api/auth/register').send({
      fullName: 'Duplicate User',
      email: testEmail,
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
    });

    expect(dupRes.status).toBe(409);
  });

  // 4. Unauthorized Access Prevention
  it('GET /api/projects without token should return 401 Unauthorized', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
  });

  // 5. Projects Listing & Creation
  it('GET /api/projects should return all projects', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    testProjectId = res.body.data[0].id;
  });

  it('POST /api/projects should create a project with unique key', async () => {
    const randKey = `P${Math.floor(Math.random() * 8999 + 1000)}`;
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Automated Test Project',
        key: randKey,
        description: 'Created during test suite run',
        status: 'ACTIVE',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.key).toBe(randKey);
  });

  // 6. User Story Creation & Management
  it('POST /api/stories/project/:projectId should create a User Story', async () => {
    const res = await request(app)
      .post(`/api/stories/project/${testProjectId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'User Story Automated Test',
        userStatement: 'As an automated runner I want tests to pass so that quality is guaranteed',
        acceptanceCriteria: ['Must return 201', 'Must generate key'],
        priority: 'HIGH',
        storyPoints: 5,
        status: 'READY',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.storyKey).toBeDefined();
    testStoryId = res.body.data.id;
  });

  // 7. Task Creation and Kanban Status Updates
  it('POST /api/tasks/project/:projectId should create a task', async () => {
    const res = await request(app)
      .post(`/api/tasks/project/${testProjectId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Kanban Move Test Task',
        description: 'Will be transitioned from TODO to IN_PROGRESS to DONE',
        status: 'TODO',
        priority: 'MEDIUM',
        storyPoints: 3,
        userStoryId: testStoryId,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.taskKey).toBeDefined();
    testTaskId = res.body.data.id;
  });

  it('PATCH /api/tasks/:id/status should update task status for Kanban board', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${testTaskId}/status`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ status: 'IN_PROGRESS', order: 1 });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('IN_PROGRESS');
  });

  // 8. Issue Creation and Workflow Verification
  it('POST /api/issues/project/:projectId should report an issue', async () => {
    const res = await request(app)
      .post(`/api/issues/project/${testProjectId}`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({
        title: 'Automated Test Bug',
        description: 'Sample bug created to verify QA workflow',
        type: 'BUG',
        priority: 'HIGH',
        status: 'OPEN',
        reproductionSteps: 'Step 1, Step 2',
        expectedBehavior: 'No error',
        actualBehavior: 'Mock error',
        taskId: testTaskId,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.issueKey).toBeDefined();
    testIssueId = res.body.data.id;
  });

  it('PATCH /api/issues/:id/status should enforce role permissions on CLOSE', async () => {
    // Developers cannot close bugs
    const devCloseRes = await request(app)
      .patch(`/api/issues/${testIssueId}/status`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ status: 'CLOSED' });

    expect(devCloseRes.status).toBe(403);

    // Admin can close
    const adminCloseRes = await request(app)
      .patch(`/api/issues/${testIssueId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CLOSED' });

    expect(adminCloseRes.status).toBe(200);
    expect(adminCloseRes.body.data.status).toBe('CLOSED');
  });

  // 9. Comments Creation
  it('POST /api/comments should add a comment to a task', async () => {
    const res = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${devToken}`)
      .send({
        content: 'Integration test comment added to task.',
        taskId: testTaskId,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.content).toBe('Integration test comment added to task.');
  });

  // 10. Dashboard & Analytics
  it('GET /api/analytics/overview should calculate metrics from real database', async () => {
    const res = await request(app)
      .get(`/api/analytics/overview?projectId=${testProjectId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.summary).toBeDefined();
    expect(res.body.data.summary.totalTasks).toBeGreaterThan(0);
    expect(Array.isArray(res.body.data.taskStatusDistribution)).toBe(true);
    expect(Array.isArray(res.body.data.issuePriorityDistribution)).toBe(true);
  });
});
