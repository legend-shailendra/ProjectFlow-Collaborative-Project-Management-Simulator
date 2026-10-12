import { app } from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 ProjectFlow Server running at http://localhost:${PORT}`);
  console.log(`📋 Health check available at http://localhost:${PORT}/api/health`);
  console.log(`🎯 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`====================================================`);
});
