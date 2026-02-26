export interface suratKeluar {
    id: number;
    nomorSurat: string;
    perihal: string;
    nama: string;
    alamat: string;
    koordinat: string;
    jenisPohon: string;
    pemangkasan: string;
    penebangan: string;
    diameter_cm: string;
    tanggalMasuk: Date;
    tanggalBalasan: Date;
    rekomendasi: string;
    pergantian: string;
    keterangan: string;
    status: string;
    fileUrl: string;
    created_at: Date;
  }