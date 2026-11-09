import { accountApi } from '@/lib/account';

export const MAX_PROOF_BYTES = 6 * 1024 * 1024;

/** A photo turned into a real JPEG, then wrapped in a one-page PDF (the private bucket takes PDFs only). */
export async function imageToPdf(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * k)), h = Math.max(1, Math.round(bmp.height * k));
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.drawImage(bmp, 0, 0, w, h);
  const url = cv.toDataURL('image/jpeg', 0.85);
  if (!url.startsWith('data:image/jpeg;base64,')) throw new Error('This browser could not prepare the photo. Try a PDF instead.');
  const bin = atob(url.slice('data:image/jpeg;base64,'.length));
  const jpg = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) jpg[i] = bin.charCodeAt(i);
  if (jpg[0] !== 0xff || jpg[1] !== 0xd8) throw new Error('This browser could not prepare the photo. Try a PDF instead.');
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const off: number[] = [];
  let len = 0;
  const push = (u: Uint8Array) => { parts.push(u); len += u.length; };
  const text = (t: string) => push(enc.encode(t));
  text('%PDF-1.4\n');
  const obj = (n: number, body: string) => { off[n] = len; text(`${n} 0 obj\n${body}\nendobj\n`); };
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  obj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Contents 4 0 R /Resources << /XObject << /Im0 5 0 R >> >> >>`);
  const draw = `q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q`;
  obj(4, `<< /Length ${draw.length} >>\nstream\n${draw}\nendstream`);
  off[5] = len;
  text(`5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`);
  push(jpg);
  text('\nendstream\nendobj\n');
  const xref = len;
  text('xref\n0 6\n0000000000 65535 f \n' + [1, 2, 3, 4, 5].map((n) => `${String(off[n]).padStart(10, '0')} 00000 n \n`).join(''));
  text(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(parts as BlobPart[], { type: 'application/pdf' });
}

/** Sends a photo or PDF to the private bucket and returns its path. `purpose` is "payment" for a payment screenshot. */
export async function uploadProof(file: File, purpose: 'verify' | 'payment' = 'verify'): Promise<string> {
  const pdf = file.type === 'application/pdf' ? file : await imageToPdf(file);
  if (pdf.size > MAX_PROOF_BYTES) throw new Error('That file is larger than 6 MB.');
  const addr = (await accountApi('proof_upload_url', { ext: 'pdf', size: pdf.size, purpose })) as { path: string; upload_url: string };
  const put = await fetch(addr.upload_url, { method: 'PUT', headers: { 'Content-Type': 'application/pdf' }, body: pdf });
  if (!put.ok) throw new Error('The upload failed. Check your connection and try again.');
  return addr.path;
}
