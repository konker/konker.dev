export const mockEnv1 = {
  DATABASE_HOST: 'database_host',
  DATABASE_PORT: '1234',
  DATABASE_USER: 'database_username',
  DATABASE_PASSWORD: 'database_password',
  DATABASE_NAME: 'database_dbname',
  DATABASE_SSL: 'true',
  OTEL_TRACE_EXPORTER_URL: 'http://test-exporter-url/',
  LOG_LEVEL: 'Debug',
} as const;
