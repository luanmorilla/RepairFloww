import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const repairCategories = {
    ANDROID: [
      { repair: 'Troca de tela', difficulty: 'Média' },
      { repair: 'Troca de display LCD', difficulty: 'Média' },
      { repair: 'Troca de display OLED', difficulty: 'Alta' },
      { repair: 'Troca de touch screen', difficulty: 'Média' },
      { repair: 'Tela preta', difficulty: 'Alta' },
      { repair: 'Tela piscando', difficulty: 'Alta' },
      { repair: 'Tela com listras', difficulty: 'Alta' },
      { repair: 'Troca de bateria', difficulty: 'Média' },
      { repair: 'Troca de conector de carga', difficulty: 'Alta' },
      { repair: 'Celular não carrega', difficulty: 'Alta' },
      { repair: 'Celular descarregando rápido', difficulty: 'Média' },
      { repair: 'Troca câmera frontal', difficulty: 'Média' },
      { repair: 'Troca câmera traseira', difficulty: 'Média' },
      { repair: 'Troca microfone', difficulty: 'Alta' },
      { repair: 'Troca alto-falante', difficulty: 'Média' },
      { repair: 'Troca campainha', difficulty: 'Média' },
      { repair: 'Troca botão power', difficulty: 'Alta' },
      { repair: 'Troca botão volume', difficulty: 'Alta' },
      { repair: 'Atualização Android', difficulty: 'Baixa' },
      { repair: 'Remoção conta Google', difficulty: 'Alta' },
      { repair: 'Formatação', difficulty: 'Baixa' },
      { repair: 'Loop infinito', difficulty: 'Alta' },
      { repair: 'Sistema corrompido', difficulty: 'Alta' },
      { repair: 'Desoxidação', difficulty: 'Alta' },
      { repair: 'Curto na placa', difficulty: 'Muito Alta' },
      { repair: 'Reparo em placa', difficulty: 'Muito Alta' },
      { repair: 'Troca CI de carga', difficulty: 'Muito Alta' },
      { repair: 'Troca CI touch', difficulty: 'Muito Alta' },
      { repair: 'Reballing CPU', difficulty: 'Muito Alta' },
    ],
    IPHONE: [
      { repair: 'Troca de tela iPhone', difficulty: 'Média' },
      { repair: 'Troca display OLED iPhone', difficulty: 'Alta' },
      { repair: 'Troca vidro traseiro iPhone', difficulty: 'Alta' },
      { repair: 'Troca bateria iPhone', difficulty: 'Média' },
      { repair: 'Programação True Tone', difficulty: 'Alta' },
      { repair: 'Troca Face ID', difficulty: 'Muito Alta' },
      { repair: 'Reparo Face ID', difficulty: 'Muito Alta' },
      { repair: 'Face ID indisponível', difficulty: 'Muito Alta' },
      { repair: 'Troca Touch ID', difficulty: 'Muito Alta' },
      { repair: 'Touch ID não funciona', difficulty: 'Muito Alta' },
      { repair: 'Troca conector de carga', difficulty: 'Alta' },
      { repair: 'Erro 4013', difficulty: 'Muito Alta' },
      { repair: 'Erro 1110', difficulty: 'Muito Alta' },
      { repair: 'Erro iTunes', difficulty: 'Alta' },
      { repair: 'iPhone travado na maçã', difficulty: 'Alta' },
      { repair: 'Reinstalação iOS', difficulty: 'Alta' },
      { repair: 'Desbloqueio iCloud', difficulty: 'Muito Alta' },
      { repair: 'Troca câmera frontal', difficulty: 'Média' },
      { brand: 'Apple', repair: 'Troca câmera traseira', difficulty: 'Média' },
      { repair: 'Troca auricular', difficulty: 'Alta' },
      { repair: 'Troca microfone', difficulty: 'Alta' },
      { repair: 'Sem sinal', difficulty: 'Alta' },
      { repair: 'Sem IMEI', difficulty: 'Muito Alta' },
      { repair: 'Troca baseband', difficulty: 'Muito Alta' },
      { repair: 'Troca NAND', difficulty: 'Muito Alta' },
      { repair: 'Reparo linha PP_VDD_MAIN', difficulty: 'Muito Alta' },
      { repair: 'Curto na placa', difficulty: 'Muito Alta' },
      { repair: 'Desoxidação iPhone', difficulty: 'Alta' },
    ],
    SAMSUNG: [
      { repair: 'Troca tela AMOLED Samsung', difficulty: 'Alta' },
      { repair: 'Tela verde Samsung', difficulty: 'Alta' },
      { repair: 'Burn-in AMOLED', difficulty: 'Alta' },
      { repair: 'Troca bateria Samsung', difficulty: 'Média' },
      { repair: 'Troca conector USB-C', difficulty: 'Alta' },
      { repair: 'Troca subplaca Samsung', difficulty: 'Alta' },
      { repair: 'Loop Samsung logo', difficulty: 'Alta' },
      { repair: 'Atualização firmware Samsung', difficulty: 'Média' },
      { repair: 'Troca câmera Samsung', difficulty: 'Média' },
      { repair: 'Troca sensor biometria', difficulty: 'Muito Alta' },
      { repair: 'Troca flex power', difficulty: 'Alta' },
      { repair: 'Troca flex volume', difficulty: 'Alta' },
      { repair: 'Reparo oxidação', difficulty: 'Alta' },
      { repair: 'Reparo placa Samsung', difficulty: 'Muito Alta' },
      { repair: 'Troca CI de carga', difficulty: 'Muito Alta' },
      { repair: 'Troca processador', difficulty: 'Muito Alta' },
    ],
    MOTOROLA: [
      { repair: 'Troca tela Motorola', difficulty: 'Média' },
      { repair: 'Troca display OLED Motorola', difficulty: 'Alta' },
      { repair: 'Troca bateria Motorola', difficulty: 'Média' },
      { repair: 'Moto travado logo', difficulty: 'Alta' },
      { repair: 'Moto sem boot', difficulty: 'Alta' },
      { repair: 'Troca conector de carga', difficulty: 'Alta' },
      { repair: 'Reparo Turbo Power', difficulty: 'Muito Alta' },
      { repair: 'Troca câmera Motorola', difficulty: 'Média' },
      { repair: 'Troca microfone Motorola', difficulty: 'Alta' },
      { repair: 'Troca auricular Motorola', difficulty: 'Média' },
      { repair: 'Desoxidação Motorola', difficulty: 'Alta' },
      { repair: 'Reparo em placa Motorola', difficulty: 'Muito Alta' },
      { repair: 'Troca CI carga Motorola', difficulty: 'Muito Alta' },
    ],
    XIAOMI: [
      { repair: 'Troca tela Xiaomi', difficulty: 'Média' },
      { repair: 'Troca display AMOLED Xiaomi', difficulty: 'Alta' },
      { repair: 'Troca bateria Xiaomi', difficulty: 'Média' },
      { repair: 'Loop MIUI', difficulty: 'Alta' },
      { repair: 'Brick Xiaomi', difficulty: 'Muito Alta' },
      { repair: 'Conta Mi bloqueada', difficulty: 'Alta' },
      { repair: 'Troca conector de carga Xiaomi', difficulty: 'Alta' },
      { repair: 'Troca câmera Xiaomi', difficulty: 'Média' },
      { repair: 'Troca flex power Xiaomi', difficulty: 'Alta' },
      { repair: 'Reinstalação MIUI', difficulty: 'Alta' },
      { repair: 'Desoxidação Xiaomi', difficulty: 'Alta' },
      { repair: 'Reparo placa Xiaomi', difficulty: 'Muito Alta' },
      { repair: 'Troca CI carga Xiaomi', difficulty: 'Muito Alta' },
    ],
    REALME: [
      { repair: 'Troca tela Realme', difficulty: 'Média' },
      { repair: 'Troca bateria Realme', difficulty: 'Média' },
      { repair: 'Troca conector de carga Realme', difficulty: 'Alta' },
      { repair: 'Loop sistema Realme', difficulty: 'Alta' },
      { repair: 'Troca câmera Realme', difficulty: 'Média' },
      { repair: 'Desoxidação Realme', difficulty: 'Alta' },
      { repair: 'Reparo placa Realme', difficulty: 'Muito Alta' },
    ],
    ASUS: [
      { repair: 'Troca tela ROG Phone', difficulty: 'Alta' },
      { repair: 'Troca bateria ROG Phone', difficulty: 'Alta' },
      { repair: 'Troca cooler interno', difficulty: 'Alta' },
      { repair: 'Superaquecimento gamer', difficulty: 'Alta' },
      { repair: 'Troca USB lateral', difficulty: 'Muito Alta' },
      { repair: 'Reparo placa gamer', difficulty: 'Muito Alta' },
    ],
    GERAIS: [
      { repair: 'Limpeza interna', difficulty: 'Baixa' },
      { repair: 'Aplicação película', difficulty: 'Baixa' },
      { repair: 'Troca tampa traseira', difficulty: 'Baixa' },
      { repair: 'Troca aro lateral', difficulty: 'Alta' },
      { repair: 'Troca carcaça completa', difficulty: 'Alta' },
      { repair: 'Diagnóstico técnico', difficulty: 'Baixa' },
      { repair: 'Backup de dados', difficulty: 'Baixa' },
      { repair: 'Recuperação de dados', difficulty: 'Muito Alta' },
      { repair: 'Solda micro componente', difficulty: 'Muito Alta' },
      { repair: 'Ultrassom em placa', difficulty: 'Alta' },
      { repair: 'Reparo pós água', difficulty: 'Muito Alta' },
    ]
  }

  console.log('🚀 Iniciando cadastro de categorias e defeitos...')

  const dataToInsert = Object.entries(repairCategories).flatMap(([category, repairs]) => 
    repairs.map(r => ({
      category: category,
      name: r.repair,
      difficulty: r.difficulty
    }))
  )

  await prisma.repairType.createMany({
    data: dataToInsert,
    skipDuplicates: true
  })

  console.log('✅ Todos os defeitos injetados com sucesso!')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })
