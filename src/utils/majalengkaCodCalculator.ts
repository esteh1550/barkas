/**
 * Kalkulator Estimasi Kurir Lokal & Rekomendasi Titik Tengah COD
 * Berdasarkan 26 Kecamatan di Kabupaten Majalengka
 */

export type MajalengkaZone =
  | 'PUSAT_KOTA'
  | 'BARAT_UTARA'
  | 'TIMUR_UTARA'
  | 'SELATAN_PEGUNUNGAN';

interface KecamatanZoneInfo {
  zone: MajalengkaZone;
  landmarkCod: string;
  coord: [number, number]; // approx relative grid (km from Majalengka Alun-Alun)
}

const KECAMATAN_MAP: Record<string, KecamatanZoneInfo> = {
  // Zona Pusat Kota & Sekitarnya
  Majalengka: { zone: 'PUSAT_KOTA', landmarkCod: 'Alun-Alun Majalengka / GGM / Bundaran Munjul', coord: [0, 0] },
  Cigasong: { zone: 'PUSAT_KOTA', landmarkCod: 'Bundaran Cigasong / Terminal Cigasong', coord: [3, 1] },
  Panyingkiran: { zone: 'PUSAT_KOTA', landmarkCod: 'Bundaran Munjul / Perempatan Panyingkiran', coord: [-3, 1] },
  Sukahaji: { zone: 'PUSAT_KOTA', landmarkCod: 'Alun-Alun Sukahaji / Bundaran Cigasong', coord: [6, 2] },
  Kasokandel: { zone: 'PUSAT_KOTA', landmarkCod: 'Pasar Kasokandel / Bundaran Munjul', coord: [-6, 3] },

  // Zona Barat & Utara (Kadipaten - Jatiwangi - Kertajati - Ligung)
  Kadipaten: { zone: 'BARAT_UTARA', landmarkCod: 'Pasar Kadipaten / Surya Kadipaten', coord: [-11, 4] },
  Dawuan: { zone: 'BARAT_UTARA', landmarkCod: 'Jalan Raya Dawuan / Perempatan Kasokandel', coord: [-8, 4] },
  Jatiwangi: { zone: 'BARAT_UTARA', landmarkCod: 'Alun-Alun Jatiwangi / Eks Pabrik Gula Jatiwangi', coord: [-10, 8] },
  Kertajati: { zone: 'BARAT_UTARA', landmarkCod: 'Simpang Kertajati / Kadipaten', coord: [-16, 12] },
  Jatitujuh: { zone: 'BARAT_UTARA', landmarkCod: 'Alun-Alun Jatitujuh / Jatiwangi', coord: [-14, 16] },
  Ligung: { zone: 'BARAT_UTARA', landmarkCod: 'Alun-Alun Ligung / Jatiwangi', coord: [-8, 15] },

  // Zona Timur & Timur Laut (Rajagaluh - Sindangwangi - Sumberjaya - Leuwimunding - Palasah)
  Palasah: { zone: 'TIMUR_UTARA', landmarkCod: 'Pertigaan Weragati Palasah / Jatiwangi', coord: [6, 7] },
  Leuwimunding: { zone: 'TIMUR_UTARA', landmarkCod: 'Alun-Alun Leuwimunding / Prapatan', coord: [11, 8] },
  Sumberjaya: { zone: 'TIMUR_UTARA', landmarkCod: 'Prapatan Sumberjaya / Leuwimunding', coord: [8, 12] },
  Rajagaluh: { zone: 'TIMUR_UTARA', landmarkCod: 'Terminal Rajagaluh / Alun-Alun Rajagaluh', coord: [14, 5] },
  Sindangwangi: { zone: 'TIMUR_UTARA', landmarkCod: 'Pasar Sindangwangi / Terminal Rajagaluh', coord: [17, 3] },
  Sindang: { zone: 'TIMUR_UTARA', landmarkCod: 'Kecamatan Sindang / Sukahaji', coord: [10, 1] },

  // Zona Selatan & Pegunungan (Maja - Argapura - Talaga - Cikijing - Bantarujeg - Lemahsugih)
  Maja: { zone: 'SELATAN_PEGUNUNGAN', landmarkCod: 'Terminal Maja / Pasar Maja', coord: [4, -10] },
  Argapura: { zone: 'SELATAN_PEGUNUNGAN', landmarkCod: 'Terminal Maja / Simpang Argapura', coord: [7, -12] },
  Banjaran: { zone: 'SELATAN_PEGUNUNGAN', landmarkCod: 'Simpang Banjaran / Pasar Maja', coord: [5, -15] },
  Talaga: { zone: 'SELATAN_PEGUNUNGAN', landmarkCod: 'Alun-Alun Talaga / Pasar Talaga', coord: [6, -20] },
  Cikijing: { zone: 'SELATAN_PEGUNUNGAN', landmarkCod: 'Terminal Cikijing / Alun-Alun Cikijing', coord: [9, -25] },
  Cingambul: { zone: 'SELATAN_PEGUNUNGAN', landmarkCod: 'Terminal Cikijing / Simpang Cingambul', coord: [12, -28] },
  Bantarujeg: { zone: 'SELATAN_PEGUNUNGAN', landmarkCod: 'Alun-Alun Bantarujeg / Talaga', coord: [-3, -22] },
  Malausma: { zone: 'SELATAN_PEGUNUNGAN', landmarkCod: 'Pasar Malausma / Bantarujeg', coord: [-5, -28] },
  Lemahsugih: { zone: 'SELATAN_PEGUNUNGAN', landmarkCod: 'Pasar Lemahsugih / Bantarujeg', coord: [-10, -26] },
};

export interface CodEstimationResult {
  estimatedDistanceKm: number;
  recommendedMidpointCod: string;
  alternativeCodPoints: string[];
  localCourierFeeMin: number;
  localCourierFeeMax: number;
  expeditionEstimate: string;
  summaryNote: string;
}

export const calculateMajalengkaCodAndCourier = (
  itemKecamatan: string,
  buyerKecamatan: string
): CodEstimationResult => {
  const origin = KECAMATAN_MAP[itemKecamatan] || KECAMATAN_MAP.Majalengka;
  const dest = KECAMATAN_MAP[buyerKecamatan] || KECAMATAN_MAP.Majalengka;

  if (itemKecamatan === buyerKecamatan) {
    return {
      estimatedDistanceKm: 2,
      recommendedMidpointCod: `COD Langsung Satu Kecamatan (${origin.landmarkCod})`,
      alternativeCodPoints: [
        origin.landmarkCod,
        'Alun-Alun Majalengka',
        'Kirim Kurir Lokal Instan',
      ],
      localCourierFeeMin: 8000,
      localCourierFeeMax: 12000,
      expeditionEstimate: 'Rp 8.000 - Rp 10.000 (Same Day Lokal)',
      summaryNote: `Barang dan lokasi Anda sama-sama di Kec. ${itemKecamatan}. Sangat dekat untuk COD hari ini!`,
    };
  }

  const dx = origin.coord[0] - dest.coord[0];
  const dy = origin.coord[1] - dest.coord[1];
  const rawDist = Math.round(Math.sqrt(dx * dx + dy * dy) * 1.25);
  const estimatedDistanceKm = Math.max(4, rawDist);

  // Determine strategic midpoint
  let recommendedMidpointCod = 'Alun-Alun Majalengka / Bundaran Munjul';
  if (origin.zone === dest.zone) {
    if (origin.zone === 'BARAT_UTARA') {
      recommendedMidpointCod = 'Titik Tengah: Alun-Alun Jatiwangi / Pasar Kadipaten';
    } else if (origin.zone === 'TIMUR_UTARA') {
      recommendedMidpointCod = 'Titik Tengah: Alun-Alun Leuwimunding / Terminal Rajagaluh';
    } else if (origin.zone === 'SELATAN_PEGUNUNGAN') {
      recommendedMidpointCod = 'Titik Tengah: Alun-Alun Talaga / Terminal Maja';
    } else {
      recommendedMidpointCod = 'Titik Tengah: Alun-Alun Majalengka / Bundaran Cigasong';
    }
  } else if (
    (origin.zone === 'PUSAT_KOTA' && dest.zone === 'BARAT_UTARA') ||
    (origin.zone === 'BARAT_UTARA' && dest.zone === 'PUSAT_KOTA')
  ) {
    recommendedMidpointCod = 'Titik Tengah: Bundaran Munjul / Pasar Kasokandel';
  } else if (
    (origin.zone === 'PUSAT_KOTA' && dest.zone === 'TIMUR_UTARA') ||
    (origin.zone === 'TIMUR_UTARA' && dest.zone === 'PUSAT_KOTA')
  ) {
    recommendedMidpointCod = 'Titik Tengah: Bundaran Cigasong / Alun-Alun Sukahaji';
  } else if (
    (origin.zone === 'PUSAT_KOTA' && dest.zone === 'SELATAN_PEGUNUNGAN') ||
    (origin.zone === 'SELATAN_PEGUNUNGAN' && dest.zone === 'PUSAT_KOTA')
  ) {
    recommendedMidpointCod = 'Titik Tengah: Terminal Maja / Bundaran Cigasong';
  } else if (
    (origin.zone === 'BARAT_UTARA' && dest.zone === 'TIMUR_UTARA') ||
    (origin.zone === 'TIMUR_UTARA' && dest.zone === 'BARAT_UTARA')
  ) {
    recommendedMidpointCod = 'Titik Tengah: Alun-Alun Jatiwangi / Pertigaan Palasah';
  }

  const baseFee = Math.max(10000, Math.round((estimatedDistanceKm * 1800) / 1000) * 1000);
  const localCourierFeeMin = Math.min(35000, baseFee);
  const localCourierFeeMax = Math.min(45000, baseFee + 7000);

  return {
    estimatedDistanceKm,
    recommendedMidpointCod,
    alternativeCodPoints: [
      recommendedMidpointCod,
      `Lokasi Barang (${origin.landmarkCod})`,
      `Lokasi Pembeli (${dest.landmarkCod})`,
      'Kirim Kurir Lokal / Ekspedisi (J&T / JNE Majalengka)',
    ],
    localCourierFeeMin,
    localCourierFeeMax,
    expeditionEstimate: 'Rp 9.000 - Rp 13.000 (J&T / JNE Reguler Kab. Majalengka 1 Hari Sampai)',
    summaryNote: `Estimasi jarak Kec. ${itemKecamatan} ke Kec. ${buyerKecamatan} ±${estimatedDistanceKm} km. Bisa ketemuan di titik tengah atau diantar kurir lokal.`,
  };
};
