/**
 * Google Forms API Integration for info.barkasmajalengka
 */

export interface GoogleFormCreationResult {
  formId: string;
  responderUri: string;
  editUri: string;
  title: string;
}

export const createConsignmentGoogleForm = async (accessToken: string): Promise<GoogleFormCreationResult> => {
  // 1. Create blank form
  const createRes = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      info: {
        title: 'info.barkasmajalengka - Formulir Titip Jual Barang Bekas',
        documentTitle: 'Titip Jual - info.barkasmajalengka',
      },
    }),
  });

  if (!createRes.ok) {
    const errorData = await createRes.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gagal membuat Google Form: status ${createRes.status}`);
  }

  const formData = await createRes.json();
  const formId = formData.formId;
  const responderUri = formData.responderUri || `https://docs.google.com/forms/d/e/${formId}/viewform`;
  const editUri = `https://docs.google.com/forms/d/${formId}/edit`;

  // 2. Batch update to insert questions and description
  const updatePayload = {
    requests: [
      {
        updateFormInfo: {
          info: {
            description: 'Formulir resmi titip jual barang bekas (consignment/jasa titip) berkualitas Majalengka. Dikelola oleh platform info.barkasmajalengka.',
          },
          updateMask: 'description',
        },
      },
      {
        createItem: {
          item: {
            title: 'Nama Lengkap Penitip',
            description: 'Sesuai dengan KTP / identitas asli',
            questionItem: {
              question: {
                required: true,
                textQuestion: { paragraph: false },
              },
            },
          },
          location: { index: 0 },
        },
      },
      {
        createItem: {
          item: {
            title: 'Nomor WhatsApp Aktif',
            description: 'Contoh: 081234567890 (Digunakan untuk konfirmasi & info laku)',
            questionItem: {
              question: {
                required: true,
                textQuestion: { paragraph: false },
              },
            },
          },
          location: { index: 1 },
        },
      },
      {
        createItem: {
          item: {
            title: 'Domisili / Kecamatan di Majalengka',
            description: 'Pilih kecamatan tempat tinggal penitip di wilayah Majalengka',
            questionItem: {
              question: {
                required: true,
                choiceQuestion: {
                  type: 'DROP_DOWN',
                  options: [
                    { value: 'Majalengka' },
                    { value: 'Kadipaten' },
                    { value: 'Jatiwangi' },
                    { value: 'Kasokandel' },
                    { value: 'Dawuan' },
                    { value: 'Cigasong' },
                    { value: 'Sukahaji' },
                    { value: 'Sindangwangi' },
                    { value: 'Rajagaluh' },
                    { value: 'Leuwimunding' },
                    { value: 'Palasah' },
                    { value: 'Kertajati' },
                    { value: 'Jatitujuh' },
                    { value: 'Ligung' },
                    { value: 'Sumberjaya' },
                    { value: 'Bantarujeg' },
                    { value: 'Cikijing' },
                    { value: 'Cingambul' },
                    { value: 'Talaga' },
                    { value: 'Banjaran' },
                    { value: 'Maja' },
                    { value: 'Argapura' },
                    { value: 'Sindang' },
                    { value: 'Malausma' },
                    { value: 'Lemahsugih' },
                    { value: 'Panyingkiran' },
                  ],
                },
              },
            },
          },
          location: { index: 2 },
        },
      },
      {
        createItem: {
          item: {
            title: 'Nomor Rekening / E-Wallet & Nama Bank/Provider',
            description: 'Contoh: BCA 1234567890 a.n Budi atau DANA 08123456789',
            questionItem: {
              question: {
                required: true,
                textQuestion: { paragraph: false },
              },
            },
          },
          location: { index: 3 },
        },
      },
      {
        createItem: {
          item: {
            title: 'Kategori Barang',
            questionItem: {
              question: {
                required: true,
                choiceQuestion: {
                  type: 'RADIO',
                  options: [
                    { value: 'Fashion' },
                    { value: 'Sneakers / Sepatu' },
                    { value: 'Helm & Otomotif' },
                    { value: 'Gadget & Elektronik' },
                    { value: 'Lainnya' },
                  ],
                },
              },
            },
          },
          location: { index: 4 },
        },
      },
      {
        createItem: {
          item: {
            title: 'Nama & Merk Barang',
            description: 'Contoh: Helm Slimhead, Sneakers Nike Dunk Low, Jaket Uniqlo',
            questionItem: {
              question: {
                required: true,
                textQuestion: { paragraph: false },
              },
            },
          },
          location: { index: 5 },
        },
      },
      {
        createItem: {
          item: {
            title: 'Ukuran / Size',
            description: 'Contoh: M, L, XL, 42, All Size',
            questionItem: {
              question: {
                required: true,
                textQuestion: { paragraph: false },
              },
            },
          },
          location: { index: 6 },
        },
      },
      {
        createItem: {
          item: {
            title: 'Kondisi Barang',
            questionItem: {
              question: {
                required: true,
                choiceQuestion: {
                  type: 'RADIO',
                  options: [
                    { value: 'Baru / BNIB' },
                    { value: 'Seperti Baru / Like New' },
                    { value: 'Bekas Pemakaian Wajar' },
                    { value: 'Ada Minus' },
                  ],
                },
              },
            },
          },
          location: { index: 7 },
        },
      },
      {
        createItem: {
          item: {
            title: 'Deskripsi & Detail Minus',
            description: 'Jelaskan kelengkapan (box/tag) serta minus sekecil apapun secara jujur',
            questionItem: {
              question: {
                required: true,
                textQuestion: { paragraph: true },
              },
            },
          },
          location: { index: 8 },
        },
      },
      {
        createItem: {
          item: {
            title: 'Harga Bersih / Nett yang Diinginkan Penitip (Rp)',
            description: 'Nominal bersih yang diterima penitip saat barang terjual',
            questionItem: {
              question: {
                required: true,
                textQuestion: { paragraph: false },
              },
            },
          },
          location: { index: 9 },
        },
      },
      {
        createItem: {
          item: {
            title: 'Persetujuan Aturan & Sistem Komisi',
            questionItem: {
              question: {
                required: true,
                choiceQuestion: {
                  type: 'CHECKBOX',
                  options: [
                    {
                      value: 'Saya menyetujui bahwa barang yang dititipkan adalah barang original/jujur dan menyetujui sistem komisi dari info.barkasmajalengka.',
                    },
                  ],
                },
              },
            },
          },
          location: { index: 10 },
        },
      },
    ],
  };

  const updateRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatePayload),
  });

  if (!updateRes.ok) {
    const errorData = await updateRes.json().catch(() => ({}));
    console.warn('Form created but failed to populate some items:', errorData);
  }

  return {
    formId,
    responderUri,
    editUri,
    title: formData.info?.title || 'Formulir Titip Jual info.barkasmajalengka',
  };
};

export const getGoogleFormDetails = async (formId: string, accessToken: string) => {
  const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error('Gagal mengambil data Google Form');
  }
  return res.json();
};

export const getGoogleFormResponses = async (formId: string, accessToken: string) => {
  const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error('Gagal mengambil respon Google Form');
  }
  return res.json();
};
