const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
p.deviceModel.count()
  .then(n => {
    console.log('Total DeviceModel:', n)
    return p.$disconnect()
  })