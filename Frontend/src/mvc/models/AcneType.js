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

// Katalog jenis jerawat (isi dari ACNE_INFO lama)
export const ACNE_TYPES = {
  papula: new AcneType({ acneTypeId: 1, name: 'Papula', characteristics: 'Jerawat meradang, tanpa nanah', description: 'Benjolan kecil kemerahan yang teraba keras dan tidak berisi nanah. Sebaiknya tidak dipencet agar radang tidak makin parah.' }),
  pustula: new AcneType({ acneTypeId: 2, name: 'Pustula', characteristics: 'Jerawat meradang, berisi nanah', description: 'Mirip papula, tetapi ada nanah putih atau kekuningan di ujungnya dan kulit sekitarnya kemerahan. Memencetnya bisa memicu infeksi dan bekas.' }),
  komedo: new AcneType({ acneTypeId: 3, name: 'Komedo', characteristics: 'Jerawat tidak meradang', description: 'Pori tersumbat minyak dan sel kulit mati tanpa peradangan berarti. Bisa terbuka (tampak hitam karena teroksidasi, bukan kotoran) atau tertutup (tampak putih kecil).' }),
  nodul: new AcneType({ acneTypeId: 4, name: 'Nodul', characteristics: 'Jerawat meradang berat, di bawah kulit', description: 'Benjolan besar, keras, dan nyeri yang tumbuh lebih dalam di bawah kulit. Cenderung meninggalkan bekas, sebaiknya diperiksakan ke dokter kulit.' }),
  kista: new AcneType({ acneTypeId: 5, name: 'Kista', characteristics: 'Jerawat meradang berat, berisi cairan', description: 'Benjolan dalam berisi cairan atau nanah, nyeri, dan mudah meninggalkan bekas. Perlu penanganan dokter kulit.' })
}
