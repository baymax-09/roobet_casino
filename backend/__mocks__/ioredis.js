const IORedis = jest.genMockFromModule("ioredis");
IORedis.prototype.hget = jest.fn((key, link) => {
  { }
});

module.exports = IORedis;