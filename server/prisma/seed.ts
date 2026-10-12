import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting ProjectFlow database seeding...');

  // 1. Create Default Workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'acme-software-labs' },
    update: {},
    create: {
      name: 'Acme Software Labs',
      slug: 'acme-software-labs',
      description: 'Central engineering workspace for agile delivery and simulation.',
    },
  });

  console.log(`✓ Workspace ensured: ${workspace.name}`);

  // 2. Hash default password
  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // 3. Create Sample Users (4 Roles)
  const usersData = [
    {
      email: 'admin@projectflow.dev',
      fullName: 'Alex Rivera (Admin)',
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
    {
      email: 'pm@projectflow.dev',
      fullName: 'Sarah Chen (Project Manager)',
      role: 'PROJECT_MANAGER',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    },
    {
      email: 'dev@projectflow.dev',
      fullName: 'David Miller (Senior Developer)',
      role: 'DEVELOPER',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
    {
      email: 'tester@projectflow.dev',
      fullName: 'Emily Watson (QA Engineer)',
      role: 'TESTER',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  ];

  const createdUsers: Record<string, any> = {};

  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        fullName: u.fullName,
        role: u.role,
        avatarUrl: u.avatarUrl,
      },
      create: {
        email: u.email,
        passwordHash: defaultPasswordHash,
        fullName: u.fullName,
        role: u.role,
        avatarUrl: u.avatarUrl,
        workspaceMemberships: {
          create: {
            workspaceId: workspace.id,
            role: u.role,
          },
        },
      },
    });
    createdUsers[u.role] = user;
    console.log(`✓ User ensured: ${user.fullName} [${user.role}]`);
  }

  // 4. Create Primary Project: Online Food Delivery System (OFD)
  const ofdProject = await prisma.project.upsert({
    where: { key: 'OFD' },
    update: {
      name: 'Online Food Delivery System',
      description:
        'Develop an end-to-end cloud platform for restaurant discovery, digital menus, online payments, and live order tracking.',
      status: 'ACTIVE',
      managerId: createdUsers.PROJECT_MANAGER.id,
    },
    create: {
      key: 'OFD',
      name: 'Online Food Delivery System',
      description:
        'Develop an end-to-end cloud platform for restaurant discovery, digital menus, online payments, and live order tracking.',
      status: 'ACTIVE',
      startDate: new Date('2026-09-01'),
      targetDate: new Date('2026-12-15'),
      workspaceId: workspace.id,
      managerId: createdUsers.PROJECT_MANAGER.id,
    },
  });

  console.log(`✓ Project ensured: ${ofdProject.name} (${ofdProject.key})`);

  // Ensure Project Memberships
  for (const roleKey of Object.keys(createdUsers)) {
    const user = createdUsers[roleKey];
    await prisma.projectMembership.upsert({
      where: {
        projectId_userId: {
          projectId: ofdProject.id,
          userId: user.id,
        },
      },
      update: { role: user.role },
      create: {
        projectId: ofdProject.id,
        userId: user.id,
        role: user.role,
      },
    });
  }

  // 5. Seed User Stories (US01 - US07)
  const storiesData = [
    {
      storyKey: 'OFD-US01',
      title: 'Customer Registration & Profile',
      description: 'Allow new food ordering customers to register, verify email, and save addresses.',
      userStatement:
        'As a customer, I want to create an account so that I can save my delivery addresses and view past order history.',
      acceptanceCriteria: JSON.stringify([
        'Customer can register with email and strong password.',
        'Validation errors display inline for duplicate emails.',
        'Upon successful registration, user profile is saved.',
      ]),
      priority: 'HIGH',
      storyPoints: 3,
      status: 'DONE',
      reporterId: createdUsers.PROJECT_MANAGER.id,
      assigneeId: createdUsers.DEVELOPER.id,
    },
    {
      storyKey: 'OFD-US02',
      title: 'Restaurant Search & Dietary Filtering',
      description: 'Search restaurants by cuisine, rating, delivery speed, and dietary preferences.',
      userStatement:
        'As a customer, I want to search for restaurants so that I can quickly find suitable food options matching my tastes.',
      acceptanceCriteria: JSON.stringify([
        'Search bar filters restaurants in real-time.',
        'Dietary tag pills filter results (Vegan, Halal, Gluten-Free).',
        'Displays empty state if no restaurant matches query.',
      ]),
      priority: 'CRITICAL',
      storyPoints: 5,
      status: 'IN_PROGRESS',
      reporterId: createdUsers.PROJECT_MANAGER.id,
      assigneeId: createdUsers.DEVELOPER.id,
    },
    {
      storyKey: 'OFD-US03',
      title: 'Interactive Shopping Cart',
      description: 'Dynamic cart drawer displaying chosen dishes, quantities, and price calculations.',
      userStatement:
        'As a customer, I want to add items to a shopping cart so that I can review and customize my meal before checkout.',
      acceptanceCriteria: JSON.stringify([
        'User can add/remove items and change quantity.',
        'Subtotal, taxes, delivery fees, and discount codes calculate accurately.',
        'Cart persists during browser session.',
      ]),
      priority: 'HIGH',
      storyPoints: 5,
      status: 'IN_REVIEW',
      reporterId: createdUsers.PROJECT_MANAGER.id,
      assigneeId: createdUsers.DEVELOPER.id,
    },
    {
      storyKey: 'OFD-US04',
      title: 'Online Payment Integration',
      description: 'Secure multi-channel payment gateway supporting Credit Cards, UPI, and Digital Wallets.',
      userStatement:
        'As a customer, I want to pay securely via credit card or UPI so that my order is confirmed instantly.',
      acceptanceCriteria: JSON.stringify([
        'PCI-compliant payment form with card tokenization.',
        'Supports instant refund on order cancellation.',
        'Generates download-ready PDF invoice receipt.',
      ]),
      priority: 'CRITICAL',
      storyPoints: 8,
      status: 'BACKLOG',
      reporterId: createdUsers.PROJECT_MANAGER.id,
      assigneeId: createdUsers.DEVELOPER.id,
    },
    {
      storyKey: 'OFD-US05',
      title: 'Live Order Tracking & Driver Telemetry',
      description: 'Real-time telemetry map showing food prep, driver pickup, and GPS estimated arrival.',
      userStatement:
        'As a customer, I want to track my order in real-time so that I know exactly when my food will arrive.',
      acceptanceCriteria: JSON.stringify([
        'Live progress bar: Order Placed -> Preparing -> Out for Delivery -> Delivered.',
        'Interactive map pin showing courier location updates.',
        'SMS/Push alert notifications at key milestones.',
      ]),
      priority: 'MEDIUM',
      storyPoints: 8,
      status: 'BACKLOG',
      reporterId: createdUsers.PROJECT_MANAGER.id,
      assigneeId: createdUsers.DEVELOPER.id,
    },
    {
      storyKey: 'OFD-US06',
      title: 'Restaurant Partner Menu Management',
      description: 'Backoffice portal for kitchen managers to toggle in-stock items and update pricing.',
      userStatement:
        'As a restaurant owner, I want to manage my menu items and pricing so that customers see current offerings.',
      acceptanceCriteria: JSON.stringify([
        'CRUD interface for food categories and items.',
        'Instant "Sold Out" toggle switch.',
        'Audit log of price revisions.',
      ]),
      priority: 'MEDIUM',
      storyPoints: 5,
      status: 'READY',
      reporterId: createdUsers.PROJECT_MANAGER.id,
      assigneeId: createdUsers.DEVELOPER.id,
    },
    {
      storyKey: 'OFD-US07',
      title: 'Customer Ratings & Reviews',
      description: 'Post-delivery feedback prompt with 1-5 star ratings and photo uploads.',
      userStatement:
        'As a customer, I want to rate and review restaurants so that other users can make informed choices.',
      acceptanceCriteria: JSON.stringify([
        'Verified purchaser badge on submitted reviews.',
        'Restaurant rating recalculated dynamically.',
      ]),
      priority: 'LOW',
      storyPoints: 3,
      status: 'BACKLOG',
      reporterId: createdUsers.PROJECT_MANAGER.id,
      assigneeId: createdUsers.DEVELOPER.id,
    },
  ];

  const createdStories: Record<string, any> = {};

  for (const s of storiesData) {
    const story = await prisma.userStory.upsert({
      where: { storyKey: s.storyKey },
      update: {
        title: s.title,
        description: s.description,
        userStatement: s.userStatement,
        acceptanceCriteria: s.acceptanceCriteria,
        priority: s.priority,
        storyPoints: s.storyPoints,
        status: s.status,
      },
      create: {
        ...s,
        projectId: ofdProject.id,
      },
    });
    createdStories[s.storyKey] = story;
    console.log(`✓ User story ensured: ${story.title} (${story.storyKey})`);
  }

  // 6. Seed Tasks across 4 Kanban Columns (TODO, IN_PROGRESS, TESTING, DONE)
  const tasksData = [
    {
      taskKey: 'OFD-101',
      title: 'Implement customer registration form',
      description: 'Create responsive registration UI with Zod schema validation and password strength indicators.',
      status: 'DONE',
      priority: 'HIGH',
      storyPoints: 3,
      dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      order: 0,
      userStoryKey: 'OFD-US01',
      assigneeId: createdUsers.DEVELOPER.id,
    },
    {
      taskKey: 'OFD-102',
      title: 'Build restaurant search & filter service',
      description: 'Build indexed search queries in backend with debounce search filter in React.',
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
      storyPoints: 5,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      order: 0,
      userStoryKey: 'OFD-US02',
      assigneeId: createdUsers.DEVELOPER.id,
    },
    {
      taskKey: 'OFD-103',
      title: 'Develop reactive shopping cart drawer',
      description: 'Implement flyout cart drawer with optimistic total calculation and local item storage.',
      status: 'TESTING',
      priority: 'HIGH',
      storyPoints: 5,
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      order: 0,
      userStoryKey: 'OFD-US03',
      assigneeId: createdUsers.DEVELOPER.id,
    },
    {
      taskKey: 'OFD-104',
      title: 'Integrate Stripe payment processing gateway',
      description: 'Configure server-side Stripe webhook listeners for payment_intent.succeeded events.',
      status: 'TODO',
      priority: 'CRITICAL',
      storyPoints: 8,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      order: 0,
      userStoryKey: 'OFD-US04',
      assigneeId: createdUsers.DEVELOPER.id,
    },
    {
      taskKey: 'OFD-105',
      title: 'Create real-time order tracking map UI',
      description: 'Design interactive delivery tracker with simulated GPS coordinates and ETA clock.',
      status: 'TODO',
      priority: 'MEDIUM',
      storyPoints: 5,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      order: 1,
      userStoryKey: 'OFD-US05',
      assigneeId: createdUsers.DEVELOPER.id,
    },
    {
      taskKey: 'OFD-106',
      title: 'Test checkout and coupon calculation',
      description: 'Validate edge cases for cart zero balance, percentage coupons, and minimum order values.',
      status: 'TESTING',
      priority: 'HIGH',
      storyPoints: 3,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      order: 1,
      userStoryKey: 'OFD-US03',
      assigneeId: createdUsers.TESTER.id,
    },
    {
      taskKey: 'OFD-107',
      title: 'Design restaurant menu management portal',
      description: 'Create admin CRUD interface for restaurant managers to update prices and photos.',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      storyPoints: 5,
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      order: 1,
      userStoryKey: 'OFD-US06',
      assigneeId: createdUsers.DEVELOPER.id,
    },
    {
      taskKey: 'OFD-108',
      title: 'Optimize restaurant search indexing query',
      description: 'Add database indexes on cuisine and status columns for fast search response time.',
      status: 'DONE',
      priority: 'MEDIUM',
      storyPoints: 2,
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      order: 1,
      userStoryKey: 'OFD-US02',
      assigneeId: createdUsers.DEVELOPER.id,
    },
    {
      taskKey: 'OFD-109',
      title: 'Implement customer review submission form',
      description: 'Build star rating selector and verified purchaser review posting workflow.',
      status: 'TODO',
      priority: 'LOW',
      storyPoints: 3,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      order: 2,
      userStoryKey: 'OFD-US07',
      assigneeId: createdUsers.DEVELOPER.id,
    },
    {
      taskKey: 'OFD-110',
      title: 'Configure SSL & payment encryption audit',
      description: 'Ensure tokenized card data and HTTPS headers meet security standards.',
      status: 'DONE',
      priority: 'CRITICAL',
      storyPoints: 5,
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      order: 2,
      userStoryKey: 'OFD-US04',
      assigneeId: createdUsers.ADMIN.id,
    },
  ];

  const createdTasks: Record<string, any> = {};

  for (const t of tasksData) {
    const storyId = t.userStoryKey ? createdStories[t.userStoryKey]?.id : null;
    const task = await prisma.task.upsert({
      where: { taskKey: t.taskKey },
      update: {
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        storyPoints: t.storyPoints,
        dueDate: t.dueDate,
        order: t.order,
        userStoryId: storyId,
        assigneeId: t.assigneeId,
      },
      create: {
        taskKey: t.taskKey,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        storyPoints: t.storyPoints,
        dueDate: t.dueDate,
        order: t.order,
        projectId: ofdProject.id,
        userStoryId: storyId,
        assigneeId: t.assigneeId,
        reporterId: createdUsers.PROJECT_MANAGER.id,
      },
    });
    createdTasks[t.taskKey] = task;
    console.log(`✓ Task ensured: ${task.title} (${task.taskKey}) [${task.status}]`);
  }

  // 7. Seed Realistic Issues & Bugs
  const issuesData = [
    {
      issueKey: 'OFD-ISS-101',
      title: 'Login button does not respond on Safari mobile',
      description: 'Tapping submit on iOS WebKit produces no network call or feedback.',
      type: 'BUG',
      priority: 'HIGH',
      status: 'OPEN',
      reproductionSteps: '1. Open Safari on iOS 17. 2. Fill login form. 3. Click Sign In.',
      expectedBehavior: 'Form submits and authenticates.',
      actualBehavior: 'Button click event ignored due to touch handler conflict.',
      taskId: createdTasks['OFD-101']?.id,
      reporterId: createdUsers.TESTER.id,
      assigneeId: createdUsers.DEVELOPER.id,
    },
    {
      issueKey: 'OFD-ISS-102',
      title: 'Food menu dish images fail to render with 403 error',
      description: 'Cloudinary CDN asset URLs expire prematurely, showing broken images in menus.',
      type: 'BUG',
      priority: 'CRITICAL',
      status: 'IN_PROGRESS',
      reproductionSteps: '1. Navigate to Italian Bistro menu. 2. Observe broken image placeholders.',
      expectedBehavior: 'High-res dish photos load cleanly.',
      actualBehavior: 'HTTP 403 Forbidden on CDN links.',
      taskId: createdTasks['OFD-102']?.id,
      reporterId: createdUsers.TESTER.id,
      assigneeId: createdUsers.DEVELOPER.id,
    },
    {
      issueKey: 'OFD-ISS-103',
      title: 'Cart total calculation is incorrect with promo codes',
      description: 'Applying a 15% discount calculates deduction on total with delivery fee included instead of subtotal.',
      type: 'BUG',
      priority: 'HIGH',
      status: 'FIXED',
      reproductionSteps: '1. Add $20 item to cart ($5 fee). 2. Apply 10% coupon.',
      expectedBehavior: 'Discount is $2.00.',
      actualBehavior: 'Discount was $2.50.',
      taskId: createdTasks['OFD-103']?.id,
      reporterId: createdUsers.TESTER.id,
      assigneeId: createdUsers.DEVELOPER.id,
    },
    {
      issueKey: 'OFD-ISS-104',
      title: 'Payment fails intermittently during 3D Secure checkout challenge',
      description: 'Webhook listener times out on OTP verification callback.',
      type: 'BUG',
      priority: 'CRITICAL',
      status: 'OPEN',
      reproductionSteps: '1. Initiate payment with test card requiring 3DS OTP.',
      expectedBehavior: 'OTP prompt completes and callback verifies status.',
      actualBehavior: 'Request times out after 30 seconds.',
      taskId: createdTasks['OFD-104']?.id,
      reporterId: createdUsers.TESTER.id,
      assigneeId: createdUsers.DEVELOPER.id,
    },
    {
      issueKey: 'OFD-ISS-105',
      title: 'Order tracking telemetry map loads slowly on low bandwidth',
      description: 'Mapbox tiles are downloaded uncompressed on 3G network profiles.',
      type: 'IMPROVEMENT',
      priority: 'MEDIUM',
      status: 'CLOSED',
      reproductionSteps: '1. Throttle network to Slow 3G. 2. Open tracking view.',
      expectedBehavior: 'Lightweight static map fallback displays immediately.',
      actualBehavior: 'Blank gray container for 8 seconds.',
      taskId: createdTasks['OFD-105']?.id,
      reporterId: createdUsers.DEVELOPER.id,
      assigneeId: createdUsers.DEVELOPER.id,
    },
  ];

  for (const i of issuesData) {
    const issue = await prisma.issue.upsert({
      where: { issueKey: i.issueKey },
      update: {
        title: i.title,
        description: i.description,
        type: i.type,
        priority: i.priority,
        status: i.status,
        reproductionSteps: i.reproductionSteps,
        expectedBehavior: i.expectedBehavior,
        actualBehavior: i.actualBehavior,
        taskId: i.taskId,
        assigneeId: i.assigneeId,
      },
      create: {
        issueKey: i.issueKey,
        title: i.title,
        description: i.description,
        type: i.type,
        priority: i.priority,
        status: i.status,
        reproductionSteps: i.reproductionSteps,
        expectedBehavior: i.expectedBehavior,
        actualBehavior: i.actualBehavior,
        projectId: ofdProject.id,
        taskId: i.taskId,
        reporterId: i.reporterId,
        assigneeId: i.assigneeId,
      },
    });
    console.log(`✓ Issue ensured: ${issue.title} (${issue.issueKey}) [${issue.status}]`);
  }

  // 8. Seed Sample Comments
  const sampleComments = [
    {
      content: 'All registration unit tests and input validation criteria pass in staging.',
      authorId: createdUsers.DEVELOPER.id,
      taskId: createdTasks['OFD-101']?.id,
    },
    {
      content: 'Added elasticsearch debounce of 300ms to reduce database load during rapid typing.',
      authorId: createdUsers.DEVELOPER.id,
      taskId: createdTasks['OFD-102']?.id,
    },
    {
      content: 'Verified discount formula fix in commit 7a8f9b; ready for regression testing.',
      authorId: createdUsers.TESTER.id,
      taskId: createdTasks['OFD-103']?.id,
    },
  ];

  for (const c of sampleComments) {
    if (c.taskId) {
      const existing = await prisma.comment.findFirst({
        where: { taskId: c.taskId, authorId: c.authorId },
      });
      if (!existing) {
        await prisma.comment.create({ data: c });
      }
    }
  }

  // 9. Seed Activities for Audit Trail
  const activities = [
    {
      actionType: 'TASK_CREATED',
      details: 'Created task "Implement customer registration form" (OFD-101)',
      entityType: 'TASK',
      entityId: createdTasks['OFD-101']?.id || 'ofd-101',
      userId: createdUsers.PROJECT_MANAGER.id,
      projectId: ofdProject.id,
    },
    {
      actionType: 'TASK_STATUS_CHANGED',
      details: 'Moved task "Implement customer registration form" from TESTING to DONE',
      entityType: 'TASK',
      entityId: createdTasks['OFD-101']?.id || 'ofd-101',
      userId: createdUsers.TESTER.id,
      projectId: ofdProject.id,
    },
    {
      actionType: 'ISSUE_REPORTED',
      details: 'Reported critical bug "Food menu dish images fail to render" (OFD-ISS-102)',
      entityType: 'ISSUE',
      entityId: 'ofd-iss-102',
      userId: createdUsers.TESTER.id,
      projectId: ofdProject.id,
    },
    {
      actionType: 'STORY_CREATED',
      details: 'Created user story "Interactive Shopping Cart" (OFD-US03)',
      entityType: 'STORY',
      entityId: createdStories['OFD-US03']?.id || 'ofd-us03',
      userId: createdUsers.PROJECT_MANAGER.id,
      projectId: ofdProject.id,
    },
  ];

  for (const act of activities) {
    await prisma.activity.create({ data: act });
  }

  // 10. Seed Notifications for Demo Users
  const sampleNotifications = [
    {
      userId: createdUsers.DEVELOPER.id,
      title: 'Task Assigned',
      message: 'You have been assigned to "Build restaurant search & filter service" (OFD-102)',
      link: `/kanban?projectId=${ofdProject.id}`,
    },
    {
      userId: createdUsers.TESTER.id,
      title: 'Ready for Testing',
      message: 'Task "Develop reactive shopping cart drawer" moved to TESTING column.',
      link: `/kanban?projectId=${ofdProject.id}`,
    },
    {
      userId: createdUsers.ADMIN.id,
      title: 'Security Milestone Met',
      message: 'Task "Configure SSL & payment encryption audit" completed.',
      link: `/kanban?projectId=${ofdProject.id}`,
    },
  ];

  for (const notif of sampleNotifications) {
    await prisma.notification.create({ data: notif });
  }

  console.log('✅ ProjectFlow Database seeding completed successfully!');
  console.log('===========================================================');
  console.log('Demo Login Credentials:');
  console.log('  Admin:           admin@projectflow.dev  / Password123!');
  console.log('  Project Manager: pm@projectflow.dev     / Password123!');
  console.log('  Developer:       dev@projectflow.dev    / Password123!');
  console.log('  Tester:          tester@projectflow.dev / Password123!');
  console.log('===========================================================');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
