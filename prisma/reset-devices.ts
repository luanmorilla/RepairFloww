import * as dotenv from 'dotenv'
dotenv.config()

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  await prisma.deviceModel.deleteMany()
  console.log('🗑️ Tabela DeviceModel limpa!')
  await prisma.repairType.deleteMany()
  console.log('🗑️ Tabela RepairType limpa!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())