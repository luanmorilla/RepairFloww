import * as dotenv from 'dotenv'
dotenv.config()

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {

  const devices = [
    // APPLE
    { brand: 'Apple', model: 'iPhone 5',            marketValue: 350 },
    { brand: 'Apple', model: 'iPhone 5c',           marketValue: 300 },
    { brand: 'Apple', model: 'iPhone 5s',           marketValue: 400 },
    { brand: 'Apple', model: 'iPhone 6',            marketValue: 500 },
    { brand: 'Apple', model: 'iPhone 6 Plus',       marketValue: 650 },
    { brand: 'Apple', model: 'iPhone 6s',           marketValue: 700 },
    { brand: 'Apple', model: 'iPhone 6s Plus',      marketValue: 850 },
    { brand: 'Apple', model: 'iPhone 7',            marketValue: 900 },
    { brand: 'Apple', model: 'iPhone 7 Plus',       marketValue: 1100 },
    { brand: 'Apple', model: 'iPhone 8',            marketValue: 1300 },
    { brand: 'Apple', model: 'iPhone 8 Plus',       marketValue: 1600 },
    { brand: 'Apple', model: 'iPhone X',            marketValue: 1800 },
    { brand: 'Apple', model: 'iPhone XR',           marketValue: 2000 },
    { brand: 'Apple', model: 'iPhone XS',           marketValue: 2200 },
    { brand: 'Apple', model: 'iPhone XS Max',       marketValue: 2600 },
    { brand: 'Apple', model: 'iPhone 11',           marketValue: 2900 },
    { brand: 'Apple', model: 'iPhone 11 Pro',       marketValue: 3400 },
    { brand: 'Apple', model: 'iPhone 11 Pro Max',   marketValue: 4000 },
    { brand: 'Apple', model: 'iPhone SE 2020',      marketValue: 2000 },
    { brand: 'Apple', model: 'iPhone 12 Mini',      marketValue: 2900 },
    { brand: 'Apple', model: 'iPhone 12',           marketValue: 3300 },
    { brand: 'Apple', model: 'iPhone 12 Pro',       marketValue: 4200 },
    { brand: 'Apple', model: 'iPhone 12 Pro Max',   marketValue: 4900 },
    { brand: 'Apple', model: 'iPhone 13 Mini',      marketValue: 3700 },
    { brand: 'Apple', model: 'iPhone 13',           marketValue: 4400 },
    { brand: 'Apple', model: 'iPhone 13 Pro',       marketValue: 5700 },
    { brand: 'Apple', model: 'iPhone 13 Pro Max',   marketValue: 6300 },
    { brand: 'Apple', model: 'iPhone SE 2022',      marketValue: 2800 },
    { brand: 'Apple', model: 'iPhone 14',           marketValue: 5000 },
    { brand: 'Apple', model: 'iPhone 14 Plus',      marketValue: 5600 },
    { brand: 'Apple', model: 'iPhone 14 Pro',       marketValue: 7000 },
    { brand: 'Apple', model: 'iPhone 14 Pro Max',   marketValue: 7800 },
    { brand: 'Apple', model: 'iPhone 15',           marketValue: 5500 },
    { brand: 'Apple', model: 'iPhone 15 Plus',      marketValue: 6200 },
    { brand: 'Apple', model: 'iPhone 15 Pro',       marketValue: 7800 },
    { brand: 'Apple', model: 'iPhone 15 Pro Max',   marketValue: 9000 },
    { brand: 'Apple', model: 'iPhone 16',           marketValue: 6200 },
    { brand: 'Apple', model: 'iPhone 16 Plus',      marketValue: 7000 },
    { brand: 'Apple', model: 'iPhone 16 Pro',       marketValue: 8800 },
    { brand: 'Apple', model: 'iPhone 16 Pro Max',   marketValue: 10200 },

    // SAMSUNG GALAXY A
    { brand: 'Samsung', model: 'Galaxy A01',  marketValue: 450 },
    { brand: 'Samsung', model: 'Galaxy A02',  marketValue: 550 },
    { brand: 'Samsung', model: 'Galaxy A03',  marketValue: 650 },
    { brand: 'Samsung', model: 'Galaxy A04',  marketValue: 750 },
    { brand: 'Samsung', model: 'Galaxy A05',  marketValue: 850 },
    { brand: 'Samsung', model: 'Galaxy A06',  marketValue: 950 },
    { brand: 'Samsung', model: 'Galaxy A10',  marketValue: 600 },
    { brand: 'Samsung', model: 'Galaxy A11',  marketValue: 700 },
    { brand: 'Samsung', model: 'Galaxy A12',  marketValue: 850 },
    { brand: 'Samsung', model: 'Galaxy A13',  marketValue: 1000 },
    { brand: 'Samsung', model: 'Galaxy A14',  marketValue: 1200 },
    { brand: 'Samsung', model: 'Galaxy A15',  marketValue: 1400 },
    { brand: 'Samsung', model: 'Galaxy A16',  marketValue: 1600 },
    { brand: 'Samsung', model: 'Galaxy A20',  marketValue: 750 },
    { brand: 'Samsung', model: 'Galaxy A21s', marketValue: 900 },
    { brand: 'Samsung', model: 'Galaxy A22',  marketValue: 1100 },
    { brand: 'Samsung', model: 'Galaxy A23',  marketValue: 1300 },
    { brand: 'Samsung', model: 'Galaxy A24',  marketValue: 1500 },
    { brand: 'Samsung', model: 'Galaxy A25',  marketValue: 1800 },
    { brand: 'Samsung', model: 'Galaxy A30',  marketValue: 850 },
    { brand: 'Samsung', model: 'Galaxy A31',  marketValue: 950 },
    { brand: 'Samsung', model: 'Galaxy A32',  marketValue: 1150 },
    { brand: 'Samsung', model: 'Galaxy A33',  marketValue: 1450 },
    { brand: 'Samsung', model: 'Galaxy A34',  marketValue: 1750 },
    { brand: 'Samsung', model: 'Galaxy A35',  marketValue: 2100 },
    { brand: 'Samsung', model: 'Galaxy A36',  marketValue: 2400 },
    { brand: 'Samsung', model: 'Galaxy A50',  marketValue: 950 },
    { brand: 'Samsung', model: 'Galaxy A51',  marketValue: 1050 },
    { brand: 'Samsung', model: 'Galaxy A52',  marketValue: 1450 },
    { brand: 'Samsung', model: 'Galaxy A53',  marketValue: 1750 },
    { brand: 'Samsung', model: 'Galaxy A54',  marketValue: 2100 },
    { brand: 'Samsung', model: 'Galaxy A55',  marketValue: 2500 },
    { brand: 'Samsung', model: 'Galaxy A56',  marketValue: 2900 },

    // SAMSUNG GALAXY S
    { brand: 'Samsung', model: 'Galaxy S8',        marketValue: 1200 },
    { brand: 'Samsung', model: 'Galaxy S8 Plus',   marketValue: 1500 },
    { brand: 'Samsung', model: 'Galaxy S9',        marketValue: 1600 },
    { brand: 'Samsung', model: 'Galaxy S9 Plus',   marketValue: 1900 },
    { brand: 'Samsung', model: 'Galaxy S10',       marketValue: 2200 },
    { brand: 'Samsung', model: 'Galaxy S10 Plus',  marketValue: 2600 },
    { brand: 'Samsung', model: 'Galaxy S20 FE',    marketValue: 2000 },
    { brand: 'Samsung', model: 'Galaxy S21',       marketValue: 2700 },
    { brand: 'Samsung', model: 'Galaxy S21 FE',    marketValue: 3000 },
    { brand: 'Samsung', model: 'Galaxy S22',       marketValue: 3600 },
    { brand: 'Samsung', model: 'Galaxy S22 Ultra', marketValue: 5500 },
    { brand: 'Samsung', model: 'Galaxy S23',       marketValue: 4400 },
    { brand: 'Samsung', model: 'Galaxy S23 Ultra', marketValue: 7200 },
    { brand: 'Samsung', model: 'Galaxy S24',       marketValue: 5500 },
    { brand: 'Samsung', model: 'Galaxy S24 Ultra', marketValue: 7800 },
    { brand: 'Samsung', model: 'Galaxy S25',       marketValue: 6300 },
    { brand: 'Samsung', model: 'Galaxy S25 Ultra', marketValue: 9500 },

    // MOTOROLA
    { brand: 'Motorola', model: 'Moto E6',        marketValue: 500 },
    { brand: 'Motorola', model: 'Moto E7',        marketValue: 650 },
    { brand: 'Motorola', model: 'Moto E13',       marketValue: 750 },
    { brand: 'Motorola', model: 'Moto G8',        marketValue: 850 },
    { brand: 'Motorola', model: 'Moto G9',        marketValue: 950 },
    { brand: 'Motorola', model: 'Moto G10',       marketValue: 1000 },
    { brand: 'Motorola', model: 'Moto G20',       marketValue: 1100 },
    { brand: 'Motorola', model: 'Moto G22',       marketValue: 1200 },
    { brand: 'Motorola', model: 'Moto G23',       marketValue: 1300 },
    { brand: 'Motorola', model: 'Moto G24',       marketValue: 1400 },
    { brand: 'Motorola', model: 'Moto G31',       marketValue: 1250 },
    { brand: 'Motorola', model: 'Moto G32',       marketValue: 1350 },
    { brand: 'Motorola', model: 'Moto G34',       marketValue: 1500 },
    { brand: 'Motorola', model: 'Moto G41',       marketValue: 1400 },
    { brand: 'Motorola', model: 'Moto G42',       marketValue: 1550 },
    { brand: 'Motorola', model: 'Moto G52',       marketValue: 1700 },
    { brand: 'Motorola', model: 'Moto G53',       marketValue: 1850 },
    { brand: 'Motorola', model: 'Moto G54',       marketValue: 2000 },
    { brand: 'Motorola', model: 'Moto G62',       marketValue: 1900 },
    { brand: 'Motorola', model: 'Moto G73',       marketValue: 2200 },
    { brand: 'Motorola', model: 'Moto G84',       marketValue: 2400 },
    { brand: 'Motorola', model: 'Edge 20',        marketValue: 2000 },
    { brand: 'Motorola', model: 'Edge 30',        marketValue: 2600 },
    { brand: 'Motorola', model: 'Edge 40',        marketValue: 3400 },
    { brand: 'Motorola', model: 'Edge 50 Fusion', marketValue: 3200 },
    { brand: 'Motorola', model: 'Razr 40',        marketValue: 5000 },
    { brand: 'Motorola', model: 'Razr 50 Ultra',  marketValue: 7200 },

    // XIAOMI / REDMI / POCO
    { brand: 'Xiaomi', model: 'Redmi 9A',          marketValue: 650 },
    { brand: 'Xiaomi', model: 'Redmi 10A',         marketValue: 750 },
    { brand: 'Xiaomi', model: 'Redmi 12C',         marketValue: 850 },
    { brand: 'Xiaomi', model: 'Redmi 13C',         marketValue: 950 },
    { brand: 'Xiaomi', model: 'Redmi 14C',         marketValue: 1050 },
    { brand: 'Xiaomi', model: 'Redmi Note 9',      marketValue: 950 },
    { brand: 'Xiaomi', model: 'Redmi Note 10',     marketValue: 1100 },
    { brand: 'Xiaomi', model: 'Redmi Note 11',     marketValue: 1300 },
    { brand: 'Xiaomi', model: 'Redmi Note 12',     marketValue: 1500 },
    { brand: 'Xiaomi', model: 'Redmi Note 13',     marketValue: 1800 },
    { brand: 'Xiaomi', model: 'Redmi Note 14',     marketValue: 2000 },
    { brand: 'Xiaomi', model: 'Redmi Note 14 Pro', marketValue: 2700 },
    { brand: 'Xiaomi', model: 'Poco C40',          marketValue: 850 },
    { brand: 'Xiaomi', model: 'Poco C65',          marketValue: 950 },
    { brand: 'Xiaomi', model: 'Poco X3 Pro',       marketValue: 1600 },
    { brand: 'Xiaomi', model: 'Poco X5',           marketValue: 1900 },
    { brand: 'Xiaomi', model: 'Poco X6',           marketValue: 2300 },
    { brand: 'Xiaomi', model: 'Poco X7',           marketValue: 2800 },
    { brand: 'Xiaomi', model: 'Poco F4',           marketValue: 2300 },
    { brand: 'Xiaomi', model: 'Poco F5',           marketValue: 2700 },
    { brand: 'Xiaomi', model: 'Poco F6',           marketValue: 3300 },
    { brand: 'Xiaomi', model: 'Xiaomi 11T',        marketValue: 2900 },
    { brand: 'Xiaomi', model: 'Xiaomi 12T',        marketValue: 3400 },
    { brand: 'Xiaomi', model: 'Xiaomi 13T',        marketValue: 3900 },
    { brand: 'Xiaomi', model: 'Xiaomi 14T',        marketValue: 4500 },
    { brand: 'Xiaomi', model: 'Xiaomi 15T Pro',    marketValue: 5300 },

    // REALME
    { brand: 'Realme', model: 'Realme C30',    marketValue: 700 },
    { brand: 'Realme', model: 'Realme C33',    marketValue: 850 },
    { brand: 'Realme', model: 'Realme C53',    marketValue: 950 },
    { brand: 'Realme', model: 'Realme C67',    marketValue: 1250 },
    { brand: 'Realme', model: 'Realme 9',      marketValue: 1700 },
    { brand: 'Realme', model: 'Realme 10',     marketValue: 1900 },
    { brand: 'Realme', model: 'Realme 11 Pro', marketValue: 2400 },
    { brand: 'Realme', model: 'Realme 12 Pro', marketValue: 2700 },

    // ASUS
    { brand: 'Asus', model: 'Zenfone 8',   marketValue: 2800 },
    { brand: 'Asus', model: 'Zenfone 9',   marketValue: 3400 },
    { brand: 'Asus', model: 'Zenfone 10',  marketValue: 4200 },
    { brand: 'Asus', model: 'ROG Phone 6', marketValue: 5800 },
    { brand: 'Asus', model: 'ROG Phone 7', marketValue: 6700 },
    { brand: 'Asus', model: 'ROG Phone 8', marketValue: 7500 },
  ]

  const repairs = [
    // TELA
    { category: 'TELA',     name: 'Troca de tela completa',               difficulty: 'Média' },
    { category: 'TELA',     name: 'Troca de vidro (display OK)',           difficulty: 'Alta' },
    { category: 'TELA',     name: 'Troca de LCD',                          difficulty: 'Média' },
    { category: 'TELA',     name: 'Troca de touch',                        difficulty: 'Média' },
    { category: 'TELA',     name: 'Reparo de backlight',                   difficulty: 'Muito Alta' },
    { category: 'TELA',     name: 'Troca de tela OLED',                    difficulty: 'Alta' },
    { category: 'TELA',     name: 'Troca de tela AMOLED',                  difficulty: 'Alta' },

    // BATERIA E CARGA
    { category: 'BATERIA',  name: 'Troca de bateria',                      difficulty: 'Baixa' },
    { category: 'BATERIA',  name: 'Reparo de conector de carga',           difficulty: 'Média' },
    { category: 'BATERIA',  name: 'Troca de conector de carga',            difficulty: 'Média' },
    { category: 'BATERIA',  name: 'Reparo de circuito de carga',           difficulty: 'Alta' },
    { category: 'BATERIA',  name: 'Calibração de bateria',                 difficulty: 'Baixa' },

    // CÂMERA
    { category: 'CAMERA',   name: 'Troca de câmera traseira',              difficulty: 'Média' },
    { category: 'CAMERA',   name: 'Troca de câmera frontal',               difficulty: 'Baixa' },
    { category: 'CAMERA',   name: 'Reparo de câmera com defeito',          difficulty: 'Alta' },
    { category: 'CAMERA',   name: 'Troca de lente da câmera',              difficulty: 'Baixa' },
    { category: 'CAMERA',   name: 'Reparo de foco automático',             difficulty: 'Alta' },

    // PLACA
    { category: 'PLACA',    name: 'Reparo de placa mãe',                   difficulty: 'Muito Alta' },
    { category: 'PLACA',    name: 'Troca de CI de energia',                difficulty: 'Muito Alta' },
    { category: 'PLACA',    name: 'Reballing de chip',                     difficulty: 'Muito Alta' },
    { category: 'PLACA',    name: 'Reparo de dano por água',               difficulty: 'Muito Alta' },
    { category: 'PLACA',    name: 'Reparo de curto-circuito',              difficulty: 'Muito Alta' },
    { category: 'PLACA',    name: 'Troca de memória RAM',                  difficulty: 'Muito Alta' },
    { category: 'PLACA',    name: 'Reparo de chip de áudio',               difficulty: 'Muito Alta' },
    { category: 'PLACA',    name: 'Reparo de chip de Wi-Fi',               difficulty: 'Muito Alta' },

    // CARCAÇA
    { category: 'CARCACA',  name: 'Troca de carcaça/tampa traseira',       difficulty: 'Baixa' },
    { category: 'CARCACA',  name: 'Troca de botões laterais',              difficulty: 'Baixa' },
    { category: 'CARCACA',  name: 'Troca de botão home',                   difficulty: 'Média' },
    { category: 'CARCACA',  name: 'Troca de alto-falante',                 difficulty: 'Média' },
    { category: 'CARCACA',  name: 'Troca de microfone',                    difficulty: 'Média' },
    { category: 'CARCACA',  name: 'Troca de vibrador',                     difficulty: 'Baixa' },
    { category: 'CARCACA',  name: 'Troca de conector P2/fone',             difficulty: 'Média' },
    { category: 'CARCACA',  name: 'Troca de antena',                       difficulty: 'Média' },
    { category: 'CARCACA',  name: 'Troca de leitor de impressão digital',  difficulty: 'Alta' },
    { category: 'CARCACA',  name: 'Troca de Face ID',                      difficulty: 'Muito Alta' },
    { category: 'CARCACA',  name: 'Troca de chip SIM/bandeja',             difficulty: 'Baixa' },

    // SOFTWARE
    { category: 'SOFTWARE', name: 'Formatação e restauração',              difficulty: 'Baixa' },
    { category: 'SOFTWARE', name: 'Remoção de vírus/malware',              difficulty: 'Baixa' },
    { category: 'SOFTWARE', name: 'Desbloqueio de conta Google (FRP)',     difficulty: 'Alta' },
    { category: 'SOFTWARE', name: 'Desbloqueio de iCloud',                 difficulty: 'Muito Alta' },
    { category: 'SOFTWARE', name: 'Recuperação de dados',                  difficulty: 'Alta' },
    { category: 'SOFTWARE', name: 'Atualização de software/firmware',      difficulty: 'Baixa' },
    { category: 'SOFTWARE', name: 'Desbloqueio de senha/padrão',           difficulty: 'Média' },
    { category: 'SOFTWARE', name: 'Backup e transferência de dados',       difficulty: 'Baixa' },

    // GERAIS
    { category: 'GERAIS',   name: 'Limpeza interna completa',              difficulty: 'Baixa' },
    { category: 'GERAIS',   name: 'Diagnóstico completo',                  difficulty: 'Baixa' },
    { category: 'GERAIS',   name: 'Aplicação de película',                 difficulty: 'Baixa' },
    { category: 'GERAIS',   name: 'Reparo de entrada de fone molhado',     difficulty: 'Média' },
    { category: 'GERAIS',   name: 'Vedação e impermeabilização',           difficulty: 'Alta' },
  ]

  console.log('🚀 Iniciando seed do catálogo RepairFlow...')

  await prisma.deviceModel.createMany({ data: devices, skipDuplicates: true })
  console.log(`✅ ${devices.length} aparelhos cadastrados!`)

  await prisma.repairType.createMany({ data: repairs, skipDuplicates: true })
  console.log(`✅ ${repairs.length} tipos de reparo cadastrados!`)

  console.log('🎉 Seed concluído com sucesso! Banco Neon populado.')
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })