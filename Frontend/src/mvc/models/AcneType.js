export class AcneType {
  constructor({ acneTypeId = 0, name = '', description = '', characteristics = '' } = {}) {
    this.acneTypeId = acneTypeId
    this.name = name
    this.description = description
    this.characteristics = characteristics
  }

  getInfo() {
    return { name: this.name, description: this.description, characteristics: this.characteristics }
  }
}

export const ACNE_TYPES = {
  papules: new AcneType({ acneTypeId: 1, name: 'Papula', characteristics: 'Jerawat meradang, tanpa nanah', description: 'Benjolan kecil kemerahan yang teraba keras dan tidak berisi nanah. Sebaiknya tidak dipencet agar radang tidak makin parah.' }),
  pustules: new AcneType({ acneTypeId: 2, name: 'Pustula', characteristics: 'Jerawat meradang, berisi nanah', description: 'Mirip papula, tetapi ada nanah putih atau kekuningan di ujungnya dan kulit sekitarnya kemerahan. Memencetnya bisa memicu infeksi dan bekas.' }),
  blackheads: new AcneType({ acneTypeId: 3, name: 'Komedo hitam', characteristics: 'Jerawat tidak meradang, pori terbuka', description: 'Pori tersumbat minyak dan sel kulit mati yang terbuka ke permukaan. Warna gelapnya berasal dari oksidasi, bukan kotoran.' }),
  whiteheads: new AcneType({ acneTypeId: 4, name: 'Komedo putih', characteristics: 'Jerawat tidak meradang, pori tertutup', description: 'Pori tersumbat minyak dan sel kulit mati yang tertutup lapisan kulit, tampak sebagai bintik kecil putih atau sewarna kulit.' }),
  cyst: new AcneType({ acneTypeId: 5, name: 'Kista', characteristics: 'Jerawat meradang berat, berisi cairan', description: 'Benjolan dalam berisi cairan atau nanah, nyeri, dan mudah meninggalkan bekas. Perlu penanganan dokter kulit.' })
}

const ACNE_ALIAS = new Map([
  ['papules', 'papules'], ['papule', 'papules'], ['papula', 'papules'],
  ['pustules', 'pustules'], ['pustule', 'pustules'], ['pustula', 'pustules'],
  ['blackheads', 'blackheads'], ['blackhead', 'blackheads'], ['komedo hitam', 'blackheads'], ['komedo', 'blackheads'],
  ['whiteheads', 'whiteheads'], ['whitehead', 'whiteheads'], ['komedo putih', 'whiteheads'],
  ['cyst', 'cyst'], ['cysts', 'cyst'], ['kista', 'cyst']
])

export function acneKey(label) {
  return ACNE_ALIAS.get(String(label || '').toLowerCase().trim()) || ''
}

export function normalizeAcneCounts(counts) {
  const out = {}
  Object.entries(counts || {}).forEach(([k, v]) => {
    const key = acneKey(k)
    if (key) out[key] = (out[key] || 0) + Number(v || 0)
  })
  return out
}
